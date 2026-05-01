import { google } from 'googleapis';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { detectRoleType, extractJobFromEmail, type ExtractedJob } from './ai.js';
import { appendApplicationRow, appendApplicationRows, createApplicationSheet, getAuthedGmailClient } from './google.js';

type PortalRule = {
  portal: string;
  senders: string[];
  subjectKeywords: string[];
};

const portalRules: PortalRule[] = [
  {
    portal: 'LinkedIn',
    senders: ['jobs-noreply@linkedin.com'],
    subjectKeywords: ['your application was sent to', 'you applied to'],
  },
  {
    portal: 'Naukri',
    senders: ['donotreply@naukri.com'],
    subjectKeywords: ['application submitted', 'you have applied', 'successfully applied'],
  },
  {
    portal: 'Internshala',
    senders: ['info@internshala.com', 'noreply@internshala.com'],
    subjectKeywords: ['application received', 'you have applied', 'your application for'],
  },
  {
    portal: 'Unstop',
    senders: ['noreply@unstop.com'],
    subjectKeywords: ['you applied to', 'your application has been submitted', 'successfully registered'],
  },
  {
    portal: 'Indeed',
    senders: ['indeedapply@indeed.com', 'noreply@indeed.com'],
    subjectKeywords: ['you applied for', 'application submitted', 'application confirmation'],
  },
  {
    portal: 'Wellfound',
    senders: ['noreply@wellfound.com'],
    subjectKeywords: ['application sent', 'you applied to', 'your application was submitted'],
  },
  {
    portal: 'Glassdoor',
    senders: ['noreply@glassdoor.com'],
    subjectKeywords: ['application submitted', 'you applied', 'your application'],
  },
  {
    portal: 'Cutshort',
    senders: ['noreply@cutshort.io'],
    subjectKeywords: ['you applied', 'application submitted'],
  },
  {
    portal: 'Hirect',
    senders: ['no-reply@hirect.in'],
    subjectKeywords: ['you applied', 'application sent'],
  },
  {
    portal: 'Shine',
    senders: ['noreply@shine.com'],
    subjectKeywords: ['application submitted', 'successfully applied'],
  },
  {
    portal: 'Foundit',
    senders: ['noreply@foundit.in', 'noreply@monsterindia.com'],
    subjectKeywords: ['application submitted', 'you have applied'],
  },
  {
    portal: 'Google Forms',
    senders: ['forms-receipts-noreply@google.com'],
    subjectKeywords: ['your response', 'form submitted', 'response recorded'],
  },
];

const historicalSenderQuery =
  '(from:jobs-noreply@linkedin.com OR from:donotreply@naukri.com OR from:info@internshala.com OR from:noreply@internshala.com OR from:noreply@unstop.com OR from:indeedapply@indeed.com OR from:noreply@indeed.com OR from:noreply@wellfound.com OR from:noreply@glassdoor.com OR from:noreply@cutshort.io OR from:no-reply@hirect.in OR from:noreply@shine.com OR from:noreply@foundit.in OR from:noreply@monsterindia.com OR from:forms-receipts-noreply@google.com)';

const scanBatchSize = 20;
const scanBatchDelayMs = 500;
const googleDocBodyKeywords = ['position', 'role', 'job title', 'applying for'];

export async function startGmailWatch(userId: string, providedGmail?: ReturnType<typeof google.gmail>) {
  const gmail = providedGmail ?? (await getAuthedGmailClient(userId));
  const watched = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      labelIds: ['INBOX'],
      topicName: config.googlePubSubTopicName,
    },
  });

  await query(
    `update users
     set gmail_watch_history_id = $1,
         gmail_watch_expiration = to_timestamp(($2::numeric / 1000.0))
     where id = $3`,
    [watched.data.historyId ?? null, watched.data.expiration ?? null, userId],
  );

  return watched.data;
}

export async function processGmailWebhook(emailAddress: string, historyId: string) {
  const user = await query<{
    id: string;
    gmail_watch_history_id: string | null;
  }>('select id, gmail_watch_history_id from users where lower(email) = lower($1)', [emailAddress]);

  const found = user.rows[0];
  if (!found) {
    await insertWebhookLog({
      userId: null,
      pubsubEmail: emailAddress,
      sender: null,
      subject: null,
      result: 'skipped:user_not_found',
    });
    return { processed: 0 };
  }

  await insertWebhookLog({
    userId: found.id,
    pubsubEmail: emailAddress,
    sender: null,
    subject: null,
    result: `received:history:${historyId}`,
  });

  const gmail = await getAuthedGmailClient(found.id);
  const startHistoryId = found.gmail_watch_history_id ?? historyId;
  const messageIds = await listHistoryMessageIds(gmail, startHistoryId);
  let processed = 0;

  for (const messageId of messageIds) {
    const email = await fetchMessageText(gmail, messageId);
    if (!isApplicationConfirmation(email.subject, email.from, email.body)) {
      await insertWebhookLog({
        userId: found.id,
        pubsubEmail: emailAddress,
        sender: parseSenderEmail(email.from) || null,
        subject: email.subject || null,
        result: 'skipped:not_application_confirmation',
      });
      continue;
    }
    const inserted = await upsertExtractedEmail(found.id, email, false);
    if (!inserted) {
      await insertWebhookLog({
        userId: found.id,
        pubsubEmail: emailAddress,
        sender: parseSenderEmail(email.from) || null,
        subject: email.subject || null,
        result: 'skipped:duplicate_or_low_confidence',
      });
      continue;
    }
    await insertWebhookLog({
      userId: found.id,
      pubsubEmail: emailAddress,
      sender: parseSenderEmail(email.from) || null,
      subject: email.subject || null,
      result: 'processed:appended',
    });
    processed += 1;
  }

  await query('update users set gmail_watch_history_id = $1 where id = $2', [historyId, found.id]);
  return { processed };
}

export async function runInitialGmailScan(userId: string) {
  const user = await query<{ initial_scan_completed: boolean; google_sheet_id: string | null }>(
    'select initial_scan_completed, google_sheet_id from users where id = $1',
    [userId],
  );
  if (user.rows[0]?.initial_scan_completed) return { found: 0 };
  if (!user.rows[0]?.google_sheet_id) await createApplicationSheet(userId);

  const gmail = await getAuthedGmailClient(userId);
  const messageIds = await listAllMessagesByQuery(gmail, historicalSenderQuery);
  const rows: string[][] = [];
  let found = 0;

  try {
    for (let index = 0; index < messageIds.length; index += scanBatchSize) {
      const batch = messageIds.slice(index, index + scanBatchSize);
      for (const messageId of batch) {
        const email = await fetchMessageText(gmail, messageId);
        if (!isApplicationConfirmation(email.subject, email.from, email.body)) continue;
        const app = await upsertExtractedEmail(userId, email, true);
        if (!app) continue;
        rows.push(toSheetRow(app));
        found += 1;
      }
      if (index + scanBatchSize < messageIds.length) {
        await delay(scanBatchDelayMs);
      }
    }

    if (rows.length) await appendApplicationRows(userId, rows);
  } finally {
    await query(
      'update users set initial_scan_completed = true, initial_scan_found_count = $1 where id = $2',
      [found, userId],
    );
  }

  return { found };
}

export function isApplicationConfirmation(subject: string, sender: string, body = '') {
  const normalizedSubject = subject.toLowerCase().replace(/\s+/g, ' ').trim();
  const senderEmail = parseSenderEmail(sender);
  const normalizedBody = body.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!senderEmail) return false;

  for (const rule of portalRules) {
    if (!rule.senders.includes(senderEmail)) continue;
    return rule.subjectKeywords.some((phrase) => normalizedSubject.includes(phrase));
  }

  if (isGoogleDomainSender(senderEmail)) {
    return googleDocBodyKeywords.some((keyword) => normalizedBody.includes(keyword));
  }

  return false;
}

export function isPromotionalJobText(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return (
    normalized.includes('jobs similar to') ||
    normalized.includes('new jobs for you') ||
    normalized.includes('jobs for you') ||
    normalized.includes('job alert') ||
    normalized.includes('recommended for you') ||
    normalized.includes('people also viewed') ||
    normalized.includes('are you still interested') ||
    normalized.includes('job suggestion') ||
    normalized.includes('is hiring') ||
    normalized.includes('apply now') ||
    /\band\s+\d+\s+more\s+jobs?\b/.test(normalized)
  );
}

async function listHistoryMessageIds(gmail: ReturnType<typeof google.gmail>, startHistoryId: string) {
  const ids = new Set<string>();
  let pageToken: string | undefined;

  do {
    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded'],
      pageToken,
    });
    for (const item of history.data.history ?? []) {
      for (const added of item.messagesAdded ?? []) {
        if (added.message?.id) ids.add(added.message.id);
      }
    }
    pageToken = history.data.nextPageToken ?? undefined;
  } while (pageToken);

  return [...ids];
}

async function listAllMessagesByQuery(gmail: ReturnType<typeof google.gmail>, q: string) {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q,
      maxResults: 500,
      pageToken,
    });
    ids.push(
      ...((response.data.messages ?? [])
        .map((message) => message.id)
        .filter(Boolean) as string[]),
    );
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return ids;
}

async function fetchMessageText(gmail: ReturnType<typeof google.gmail>, messageId: string) {
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  const headers = message.data.payload?.headers ?? [];
  const header = (name: string) =>
    headers.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
  const subject = header('subject');
  const from = header('from');
  const date = header('date');
  const body = decodeParts(message.data.payload as GmailMessagePart | undefined);
  return {
    id: messageId,
    subject,
    from,
    date,
    body,
    text: `From: ${from}\nSubject: ${subject}\nDate: ${date}\n\n${body}`,
  };
}

type GmailMessagePart = {
  body?: { data?: string | null } | null;
  parts?: GmailMessagePart[] | null;
};

function decodeParts(part: GmailMessagePart | undefined): string {
  if (!part) return '';
  const chunks: string[] = [];
  if (part.body?.data) chunks.push(decodeBase64Url(part.body.data));
  for (const child of part.parts ?? []) {
    chunks.push(decodeParts(child));
  }
  return chunks.join('\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

async function upsertExtractedEmail(
  userId: string,
  email: Awaited<ReturnType<typeof fetchMessageText>>,
  deferSheetAppend: boolean,
) {
  const duplicateMessage = await query<{ id: string }>(
    'select id from applications where gmail_message_id = $1 limit 1',
    [email.id],
  );
  if (duplicateMessage.rows.length) return null;

  if (!isApplicationConfirmation(email.subject, email.from, email.body)) return null;

  const extracted = await extractEmailData(email);
  if (!extracted.is_job_related || extracted.confidence < 0.4) return null;
  const role = normalizeCandidateField(extracted.role);
  const company = normalizeCandidateField(extracted.company);
  const source = normalizePortalName(extracted.source, email);
  const isGoogleDoc = source === 'Google Doc';
  if (!role) return null;
  if (!company && !isGoogleDoc) return null;

  const appliedAt = extracted.applied_date
    ? new Date(extracted.applied_date).toISOString()
    : email.date
      ? new Date(email.date).toISOString()
      : new Date().toISOString();
  const duplicateByCore = await query<{ id: string }>(
    `select id
     from applications
     where user_id = $1
       and lower(job_title) = lower($2)
       and lower(company) = lower($3)
       and date(applied_at) = date($4::timestamptz)
     limit 1`,
    [userId, role, company ?? 'Unknown - Google Doc', appliedAt],
  );
  if (duplicateByCore.rows.length) return null;

  const roleType = detectRoleType(email.text);

  const inserted = await query<{
    job_title: string;
    company: string;
    role_type: string;
    portal: string;
    applied_at: string;
    status: string;
  }>(
    `insert into applications
      (user_id, job_title, company, role_type, portal, job_url, applied_at, status, raw_data,
       confidence, needs_review, raw_text, gmail_message_id)
     values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10, $11, $12, $13)
     on conflict do nothing
     returning job_title, company, role_type, portal, applied_at, status`,
    [
      userId,
      role,
      company ?? 'Unknown - Google Doc',
      roleType,
      source,
      `gmail:${email.id}`,
      appliedAt,
      'Applied',
      extracted,
      extracted.confidence,
      extracted.confidence < 0.7,
      email.text.slice(0, 12000),
      email.id,
    ],
  );

  const app = inserted.rows[0];
  if (!app) return null;

  if (!deferSheetAppend) {
    await appendApplicationRow(userId, toSheetRow(app));
  }

  return app;
}

async function extractEmailData(email: Awaited<ReturnType<typeof fetchMessageText>>): Promise<ExtractedJob> {
  const senderEmail = parseSenderEmail(email.from);
  if (senderEmail === 'forms-receipts-noreply@google.com') {
    const form = extractGoogleForm(email.subject, email.body, email.date);
    if (form) return form;
  }

  if (isGoogleDomainSender(senderEmail) && hasGoogleDocKeywords(email.body)) {
    const doc = extractGoogleDoc(email.subject, email.body, email.date);
    if (doc) return doc;
  }

  const subjectCompany = extractCompanyFromSubject(email.subject, email.from);
  const ai = await extractJobFromEmail(email.text, { company: subjectCompany });
  return {
    ...ai,
    company: subjectCompany ?? ai.company,
    source: ai.source === 'Unknown' ? portalFromSender(email.from) : ai.source,
  };
}

function extractCompanyFromSubject(subject: string, from: string) {
  const senderEmail = parseSenderEmail(from);
  if (senderEmail !== 'jobs-noreply@linkedin.com') return null;
  return (
    subject
      .match(/(?:application was sent to|you applied to|applied to)\s+(.+?)(?:\s+on|\s+via|$)/i)?.[1]
      ?.replace(/^["']|["']$/g, '')
      .trim() ?? null
  );
}

function extractGoogleForm(subject: string, body: string, date: string): ExtractedJob | null {
  const title = subject
    .match(/(?:response for|response to)\s+(.+?)\s+(?:has been recorded|was recorded|recorded)/i)?.[1]
    ?.trim();
  const valueFor = (labels: string[]) => {
    for (const label of labels) {
      const match = body.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n\\r|]{2,140})`, 'i'));
      if (match?.[1]) return match[1].trim();
    }
    return null;
  };
  const role = valueFor(['position', 'role', 'job title', 'applying for']) ?? title ?? null;
  const company =
    valueFor(['company', 'organisation', 'organization', 'employer']) ?? 'Unknown - Google Form';
  return {
    company,
    role,
    status: 'Applied',
    applied_date: date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    source: 'Google Form',
    confidence: role && company !== 'Unknown - Google Form' ? 0.8 : 0.55,
    is_job_related: true,
  };
}

function extractGoogleDoc(subject: string, body: string, date: string): ExtractedJob | null {
  const valueFor = (labels: string[]) => {
    for (const label of labels) {
      const match = body.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n\\r|]{2,140})`, 'i'));
      if (match?.[1]) return match[1].trim();
    }
    return null;
  };
  const role = valueFor(['position', 'role', 'job title', 'applying for']) ?? subject ?? null;
  const company =
    valueFor(['company', 'organisation', 'organization', 'employer']) ?? 'Unknown - Google Doc';
  return {
    company,
    role,
    status: 'Applied',
    applied_date: date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    source: 'Google Doc',
    confidence: role && company !== 'Unknown - Google Doc' ? 0.72 : 0.5,
    is_job_related: true,
  };
}

function portalFromSender(from: string) {
  const senderEmail = parseSenderEmail(from);
  if (!senderEmail) return 'Unknown' as ExtractedJob['source'];
  const matched = portalRules.find((rule) => rule.senders.includes(senderEmail));
  if (!matched) return 'Unknown' as ExtractedJob['source'];
  return matched.portal as ExtractedJob['source'];
}

function normalizePortalName(source: string, email: Awaited<ReturnType<typeof fetchMessageText>>) {
  if (source === 'Google Form') return 'Google Forms';
  if (source === 'Unknown') {
    const senderPortal = portalFromSender(email.from);
    return senderPortal === 'Google Form' ? 'Google Forms' : senderPortal;
  }
  return source;
}

function toSheetRow(app: {
  job_title: string;
  company: string;
  role_type: string;
  portal: string;
  applied_at: string;
  status: string;
}) {
  return [
    app.job_title,
    app.company,
    app.role_type,
    app.portal,
    new Date(app.applied_at).toISOString().slice(0, 10),
    app.status,
  ];
}

function normalizeCandidateField(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (/^(unknown|n\/a|na|null|none)$/i.test(normalized)) return null;
  return normalized;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseSenderEmail(from: string) {
  const bracketMatch = from.match(/<([^>]+)>/);
  if (bracketMatch?.[1]) return bracketMatch[1].trim().toLowerCase();
  const plainEmailMatch = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return plainEmailMatch?.[0]?.toLowerCase() ?? '';
}

function isGoogleDomainSender(senderEmail: string) {
  const domain = senderEmail.split('@')[1] ?? '';
  return domain === 'google.com' || domain.endsWith('.google.com');
}

function hasGoogleDocKeywords(body: string) {
  const normalizedBody = body.toLowerCase().replace(/\s+/g, ' ');
  return googleDocBodyKeywords.some((keyword) => normalizedBody.includes(keyword));
}

async function insertWebhookLog(input: {
  userId: string | null;
  pubsubEmail: string;
  sender: string | null;
  subject: string | null;
  result: string;
}) {
  await query(
    `insert into webhook_logs
      (user_id, pubsub_email, sender_email, subject, processing_result)
     values ($1, $2, $3, $4, $5)`,
    [input.userId, input.pubsubEmail, input.sender, input.subject, input.result],
  );
}

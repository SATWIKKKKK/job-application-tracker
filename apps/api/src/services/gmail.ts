import { google } from 'googleapis';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { checkDuplicate, detectRoleType, extractJobFromEmail, updateJobStatus, type ExtractedJob } from './ai.js';
import { appendApplicationRow, appendApplicationRows, createApplicationSheet, getAuthedGmailClient } from './google.js';

const portalSenders: Record<string, string> = {
  'jobs-noreply@linkedin.com': 'LinkedIn',
  'donotreply@naukri.com': 'Naukri',
  'info@internshala.com': 'Internshala',
  'noreply@unstop.com': 'Unstop',
  'indeedapply@indeed.com': 'Indeed',
  'noreply@wellfound.com': 'Wellfound',
  'noreply@glassdoor.com': 'Glassdoor',
  'noreply@cutshort.io': 'Cutshort',
  'no-reply@hirect.in': 'Hirect',
  'forms-receipts-noreply@google.com': 'Google Forms',
};

const senderQuery = [
  `(from:jobs-noreply@linkedin.com (subject:"your application was sent to" OR subject:"you applied to" OR subject:"application submitted") -subject:"jobs similar to" -subject:"is hiring" -subject:"apply now" -subject:"recommended for you" -subject:"new jobs for you" -subject:"job alert" -subject:"people also viewed" -subject:"are you still interested" -subject:"job suggestion" -subject:"jobs in")`,
  `(from:donotreply@naukri.com (subject:"application submitted" OR subject:"application received" OR subject:"you applied" OR subject:"application confirmation") -subject:"recommended" -subject:"job alert" -subject:"jobs for you" -subject:"apply now" -subject:"is hiring" -subject:"suggestion" -subject:"jobs in")`,
  `(from:info@internshala.com (subject:"application submitted" OR subject:"application received" OR subject:"you applied" OR subject:"application confirmation") -subject:"recommended" -subject:"job alert" -subject:"jobs for you" -subject:"apply now" -subject:"is hiring" -subject:"suggestion")`,
  `(from:noreply@unstop.com (subject:"you applied" OR subject:"application submitted" OR subject:"application received" OR subject:"submitted successfully") -subject:"recommended" -subject:"opportunities for you" -subject:"apply now" -subject:"is hiring" -subject:"jobs for you")`,
  `(from:indeedapply@indeed.com (subject:"you applied for" OR subject:"application received" OR subject:"application confirmation") -subject:"jobs for you" -subject:"alert" -subject:"recommendation" -subject:"new jobs")`,
  `(from:noreply@wellfound.com (subject:"you applied" OR subject:"application submitted" OR subject:"application received") -subject:"recommended" -subject:"new jobs" -subject:"jobs for you" -subject:"apply now" -subject:"is hiring" -subject:"discover jobs")`,
  `(from:noreply@glassdoor.com (subject:"application submitted" OR subject:"you applied" OR subject:"your application") -subject:"jobs near you" -subject:"apply now" -subject:"salary" -subject:"review" -subject:"for you" -subject:"more jobs")`,
  `(from:noreply@cutshort.io (subject:"you applied" OR subject:"application submitted" OR subject:"application received" OR subject:"application confirmation") -subject:"recommended" -subject:"job alert" -subject:"jobs for you" -subject:"apply now" -subject:"is hiring")`,
  `(from:no-reply@hirect.in (subject:"you applied" OR subject:"application submitted" OR subject:"application received" OR subject:"application confirmation") -subject:"recommended" -subject:"job alert" -subject:"jobs for you" -subject:"apply now" -subject:"is hiring")`,
  `(from:forms-receipts-noreply@google.com (subject:"your response for" OR subject:"has been recorded" OR subject:"response recorded"))`,
].join(' OR ');

const INITIAL_SCAN_LIMIT = 200;
const INITIAL_SCAN_BATCH_SIZE = 20;
const INITIAL_SCAN_BATCH_DELAY_MS = 500;

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
  if (!found) return { processed: 0 };

  const gmail = await getAuthedGmailClient(found.id);
  const startHistoryId = found.gmail_watch_history_id ?? historyId;
  const messageIds = await listHistoryMessageIds(gmail, startHistoryId);
  let processed = 0;

  for (const messageId of messageIds) {
    const email = await fetchMessageText(gmail, messageId);
    if (!isKnownJobSender(email.from)) continue;
    if (!isApplicationConfirmation(email.subject, email.from, email.body)) continue;
    const inserted = await upsertExtractedEmail(found.id, email, false);
    if (inserted) processed += 1;
  }

  await query('update users set gmail_watch_history_id = $1 where id = $2', [historyId, found.id]);
  return { processed };
}

export async function runInitialGmailScan(userId: string) {
  const user = await query<{ initial_scan_completed: boolean; google_sheet_id: string | null }>(
    'select initial_scan_completed, google_sheet_id from users where id = $1',
    [userId],
  );
  if (user.rows[0]?.initial_scan_completed) {
    return { found: 0 };
  }
  if (!user.rows[0]?.google_sheet_id) await createApplicationSheet(userId);

  const gmail = await getAuthedGmailClient(userId);
  const messageIds = await listMessagesByQuery(gmail, senderQuery, INITIAL_SCAN_LIMIT);
  const rows: string[][] = [];
  let found = 0;

  try {
    for (let index = 0; index < messageIds.length; index += INITIAL_SCAN_BATCH_SIZE) {
      const batch = messageIds.slice(index, index + INITIAL_SCAN_BATCH_SIZE);
      for (const messageId of batch) {
        const email = await fetchMessageText(gmail, messageId);
        if (!isApplicationConfirmation(email.subject, email.from, email.body)) continue;
        const app = await upsertExtractedEmail(userId, email, true);
        if (app) {
          found += 1;
          rows.push(toSheetRow(app));
        }
      }
      if (index + INITIAL_SCAN_BATCH_SIZE < messageIds.length) {
        await delay(INITIAL_SCAN_BATCH_DELAY_MS);
      }
    }

    await appendApplicationRows(userId, rows);
  } catch (error) {
    console.warn('Initial scan processing failed/skipped:', error);
  } finally {
    await query(
      'update users set initial_scan_completed = true, initial_scan_found_count = $1 where id = $2',
      [found, userId],
    );
  }

  return { found };
}

export function isPromotionalJobText(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
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

async function listHistoryMessageIds(
  gmail: ReturnType<typeof google.gmail>,
  startHistoryId: string,
) {
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

async function listMessagesByQuery(
  gmail: ReturnType<typeof google.gmail>,
  q: string,
  maxResults: number,
) {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const remaining = maxResults - ids.length;
    if (remaining <= 0) break;
    const response = await gmail.users.messages.list({
      userId: 'me',
      q,
      maxResults: Math.min(100, remaining),
      pageToken,
    });
    ids.push(...(response.data.messages ?? []).map((message) => message.id).filter(Boolean) as string[]);
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken && ids.length < maxResults);

  return ids.slice(0, maxResults);
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
  mimeType?: string | null;
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

function isKnownJobSender(from: string) {
  const lower = from.toLowerCase();
  return Object.keys(portalSenders).some((sender) => lower.includes(sender));
}

export function isApplicationConfirmation(subject: string, sender: string, body = '') {
  return isApplicationConfirmationInternal(subject, sender, body);
}

type PortalFilterRule = {
  senderIncludes: string[];
  allowSubject: string[];
  denySubject: string[];
  denyBody?: string[];
};

const globalDenySubject = [
  'jobs similar to',
  'and 1 more job',
  'and 2 more jobs',
  'and 3 more jobs',
  'and 4 more jobs',
  'and 5 more jobs',
  'for you',
  'recommended',
  'recommendation',
  'job alert',
  'alerts',
  'people also viewed',
  'are you still interested',
  'is hiring',
  'apply now',
  'job suggestion',
  'jobs in',
  'jobs near you',
  'salary insights',
  'review',
];

const portalFilterRules: PortalFilterRule[] = [
  {
    senderIncludes: ['linkedin.com'],
    allowSubject: ['your application was sent to', 'you applied to', 'application submitted'],
    denySubject: [
      'jobs similar to',
      'is hiring',
      'apply now',
      'recommended for you',
      'new jobs for you',
      'your job alert',
      'people also viewed',
      'are you still interested',
      'job suggestion',
      'jobs in',
    ],
  },
  {
    senderIncludes: ['glassdoor.com'],
    allowSubject: ['application submitted', 'you applied', 'your application'],
    denySubject: ['jobs near you', 'apply now', 'salary', 'review', 'for you', 'more jobs'],
  },
  {
    senderIncludes: ['indeed.com'],
    allowSubject: ['you applied for', 'application received', 'application confirmation'],
    denySubject: ['jobs for you', 'alert', 'recommendation', 'for you', 'new jobs'],
  },
  {
    senderIncludes: ['naukri.com'],
    allowSubject: ['application submitted', 'application received', 'you applied', 'application confirmation'],
    denySubject: ['recommended', 'job alert', 'jobs for you', 'apply now', 'is hiring', 'suggestion', 'jobs in'],
  },
  {
    senderIncludes: ['internshala.com'],
    allowSubject: ['application submitted', 'application received', 'you applied', 'application confirmation'],
    denySubject: ['recommended', 'job alert', 'jobs for you', 'apply now', 'is hiring', 'suggestion'],
  },
  {
    senderIncludes: ['unstop.com'],
    allowSubject: ['you applied', 'application submitted', 'application received', 'submitted successfully'],
    denySubject: ['recommended', 'opportunities for you', 'apply now', 'is hiring', 'jobs for you'],
  },
  {
    senderIncludes: ['wellfound.com'],
    allowSubject: ['you applied', 'application submitted', 'application received'],
    denySubject: ['recommended', 'new jobs', 'jobs for you', 'apply now', 'is hiring', 'discover jobs'],
  },
  {
    senderIncludes: ['cutshort.io', 'hirect.in'],
    allowSubject: ['you applied', 'application submitted', 'application received', 'application confirmation'],
    denySubject: ['recommended', 'job alert', 'jobs for you', 'apply now', 'is hiring'],
  },
  {
    senderIncludes: ['forms-receipts-noreply@google.com'],
    allowSubject: ['your response for', 'has been recorded', 'response recorded', 'form response'],
    denySubject: [],
    denyBody: ['newsletter', 'unsubscribe'],
  },
];

function isApplicationConfirmationInternal(subject: string, sender: string, body: string) {
  const normalizedSubject = subject.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedSender = sender.toLowerCase();
  const normalizedBody = body.toLowerCase().replace(/\s+/g, ' ').trim();

  if (!normalizedSubject) return false;
  if (globalDenySubject.some((phrase) => normalizedSubject.includes(phrase))) return false;
  if (/\band\s+\d+\s+more\s+jobs?\b/.test(normalizedSubject)) return false;

  const rule = portalFilterRules.find((item) =>
    item.senderIncludes.some((senderPart) => normalizedSender.includes(senderPart)),
  );
  if (!rule) return false;
  if (rule.denySubject.some((phrase) => normalizedSubject.includes(phrase))) return false;
  if (rule.denyBody?.some((phrase) => normalizedBody.includes(phrase))) return false;

  const subjectAllowed = rule.allowSubject.some((phrase) => normalizedSubject.includes(phrase));
  if (!subjectAllowed) return false;

  const confirmationSignals = [
    'application submitted',
    'application received',
    'your application',
    'you applied',
    'submitted successfully',
    'has been recorded',
    'response for',
  ];
  const hasSignal = confirmationSignals.some(
    (signal) => normalizedSubject.includes(signal) || normalizedBody.includes(signal),
  );
  return hasSignal;
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

  if (!isApplicationConfirmation(email.subject, email.from)) return null;

  const extracted = await extractEmailData(email);
  if (!extracted.is_job_related || extracted.confidence < 0.4) return null;
  const role = normalizeCandidateField(extracted.role);
  const company = normalizeCandidateField(extracted.company);
  const isGoogleFormSource = extracted.source === 'Google Form' || extracted.source === 'Google Forms';
  if (!role) return null;
  if (!company && !isGoogleFormSource) return null;

  const recent = await query<{ id: string; company: string; job_title: string; status: string }>(
    `select id, company, job_title, status
     from applications
     where user_id = $1
     order by created_at desc
     limit 10`,
    [userId],
  );

  for (const job of recent.rows) {
    const duplicate = await checkDuplicate(job, extracted);
    if (duplicate.is_duplicate) {
      const statusUpdate = await updateJobStatus(job, email.text);
      if (statusUpdate.changed) {
        await query('update applications set status = $1 where id = $2', [
          mapStatus(statusUpdate.new_status),
          job.id,
        ]);
      }
      return null;
    }
  }

  const appliedAt = extracted.applied_date
    ? new Date(extracted.applied_date).toISOString()
    : email.date
      ? new Date(email.date).toISOString()
      : new Date().toISOString();
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
      company ?? 'Unknown - Google Form',
      roleType,
      normalizePortalName(extracted.source),
      `gmail:${email.id}`,
      appliedAt,
      mapStatus(extracted.status),
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
    try {
      await appendApplicationRow(userId, toSheetRow(app));
    } catch (error) {
      console.warn('Gmail sheet append skipped/failed:', error);
    }
  }
  return app;
}

async function extractEmailData(email: Awaited<ReturnType<typeof fetchMessageText>>): Promise<ExtractedJob> {
  if (email.from.toLowerCase().includes('forms-receipts-noreply@google.com')) {
    const form = extractGoogleForm(email.subject, email.body, email.date);
    if (form) return form;
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
  if (!from.toLowerCase().includes('linkedin.com')) return null;
  return subject
    .match(/(?:application was sent to|you applied to|applied to)\s+(.+?)(?:\s+on|\s+via|$)/i)?.[1]
    ?.replace(/^["']|["']$/g, '')
    .trim() ?? null;
}

function extractGoogleForm(subject: string, body: string, date: string): ExtractedJob | null {
  const title = subject.match(/(?:response for|response to)\s+(.+?)\s+(?:has been recorded|was recorded|recorded)/i)?.[1]?.trim();
  const valueFor = (labels: string[]) => {
    for (const label of labels) {
      const match = body.match(new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n\\r|]{2,100})`, 'i'));
      if (match?.[1]) return match[1].trim();
    }
    return null;
  };
  const role = valueFor(['position', 'role', 'job title', 'applying for']) ?? title ?? null;
  const company = valueFor(['company', 'organisation', 'organization', 'employer']) ?? 'Unknown - Google Form';
  return {
    company,
    role,
    status: 'Applied',
    applied_date: date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    source: 'Google Form',
    confidence: role && company !== 'Unknown - Google Form' ? 0.8 : 0.55,
    is_job_related: true,
  };
}

function portalFromSender(from: string) {
  const lower = from.toLowerCase();
  const match = Object.entries(portalSenders).find(([sender]) => lower.includes(sender));
  return (match?.[1] ?? 'Unknown') as ExtractedJob['source'];
}

function mapStatus(status: string) {
  if (status === 'Offer') return 'Accepted';
  if (status === 'Interview') return 'Shortlisted';
  if (status === 'Rejected') return 'Rejected';
  return 'Applied';
}

function normalizePortalName(source: string) {
  if (source === 'Google Form') return 'Google Forms';
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

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeCandidateField(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (/^(unknown|n\/a|na|null|none)$/i.test(normalized)) return null;
  if (
    /(jobs?\s+similar|recommended\s+for\s+you|jobs?\s+for\s+you|job\s+alert|apply\s+now|and\s+\d+\s+more\s+jobs?)/i.test(
      normalized,
    )
  ) {
    return null;
  }
  return normalized;
}

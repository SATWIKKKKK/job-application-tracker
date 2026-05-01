import OpenAI from 'openai';
import { config } from '../config.js';

export type ExtractedJob = {
  company: string | null;
  role: string | null;
  status: 'Applied' | 'Interview' | 'Rejected' | 'Offer' | 'Unknown';
  applied_date: string | null;
  source:
    | 'LinkedIn'
    | 'Naukri'
    | 'Internshala'
    | 'Unstop'
    | 'Indeed'
    | 'Wellfound'
    | 'Glassdoor'
    | 'Cutshort'
    | 'Hirect'
    | 'Shine'
    | 'Foundit'
    | 'Careers Page'
    | 'Google Form'
    | 'Google Forms'
    | 'Google Doc'
    | 'Unknown';
  confidence: number;
  is_job_related: boolean;
};

export type ExtractionHints = {
  company?: string | null;
};

const client = new OpenAI({
  baseURL: config.aiCreditsBaseUrl,
  apiKey: config.aiCreditsApiKey || 'missing-aicredits-key',
});

const emailSystemPrompt = `You are a job application data extraction system.
Always respond with ONLY valid JSON matching this exact schema. No explanation, no markdown.
Schema: {"company":string|null,"role":string|null,"status":"Applied"|"Interview"|"Rejected"|"Offer"|"Unknown","applied_date":"YYYY-MM-DD"|null,"source":"LinkedIn"|"Naukri"|"Internshala"|"Unstop"|"Indeed"|"Wellfound"|"Glassdoor"|"Cutshort"|"Hirect"|"Shine"|"Foundit"|"Careers Page"|"Google Form"|"Google Forms"|"Google Doc"|"Unknown","confidence":0.0,"is_job_related":boolean}
Rules:
- Set is_job_related false for newsletters, OTPs, spam, and non-job emails.
- If is_job_related is true, status must be "Applied".
- Never hallucinate company or role names.
- If company is not found, return null.`;

type ChatMessage = { role: 'system' | 'user'; content: string };

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function callModelWithRetry(model: string, messages: ChatMessage[], maxTokens: number) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        messages,
      });
      return response.choices[0]?.message?.content ?? '{}';
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 429 || attempt === 2) throw error;
      const waitMs = 1000 * (attempt + 1);
      await sleep(waitMs);
    }
  }
  return '{}';
}

async function completeJson(messages: ChatMessage[], maxTokens: number) {
  const primaryModel = config.aiCreditsModel || 'deepseek/deepseek-v3';
  const fallbackModel = config.aiCreditsFallbackModel || 'deepseek/deepseek-chat';

  try {
    return await callModelWithRetry(primaryModel, messages, maxTokens);
  } catch (error) {
    if (fallbackModel === primaryModel) throw error;
    return callModelWithRetry(fallbackModel, messages, maxTokens);
  }
}

export async function extractJobFromEmail(emailBody: string, hints: ExtractionHints = {}): Promise<ExtractedJob> {
  if (!config.aiCreditsApiKey) return fallbackExtract(emailBody);

  const hintText = hints.company
    ? `\n\nKnown extraction hint: company is already extracted as "${hints.company}". Confirm this company and find the job title from the email body only. Do not replace the company unless the email clearly proves the hint is wrong.`
    : '';

  const content = await completeJson(
    [
      { role: 'system', content: emailSystemPrompt },
      { role: 'user', content: `Extract job data from this email:${hintText}\n\n${emailBody}` },
    ],
    400,
  );
  const extracted = normalizeExtracted(JSON.parse(content));
  if (hints.company && !extracted.company) {
    return normalizeExtracted({ ...extracted, company: hints.company });
  }
  return extracted;
}

export async function updateJobStatus(
  oldJob: { company: string; job_title: string; status: string },
  newEmailBody: string,
) {
  void oldJob;
  void newEmailBody;
  return {
    new_status: 'Applied',
    confidence: 1,
    changed: false,
  };
}

export async function checkDuplicate(
  job1: { company: string | null; job_title?: string | null; role?: string | null },
  job2: { company: string | null; role?: string | null },
) {
  if (!config.aiCreditsApiKey) {
    const role1 = (job1.job_title ?? job1.role ?? '').toLowerCase();
    const role2 = (job2.role ?? '').toLowerCase();
    const company1 = (job1.company ?? '').toLowerCase();
    const company2 = (job2.company ?? '').toLowerCase();
    return {
      is_duplicate: Boolean(company1 && company1 === company2 && role1 && role2 && role1.includes(role2.slice(0, 12))),
      confidence: 0.6,
      reason: 'Local fallback similarity check',
    };
  }

  const content = await completeJson(
    [
      {
        role: 'system',
        content:
          'You detect duplicate job applications. Return ONLY JSON: {"is_duplicate":boolean,"confidence":0.0,"reason":string}. Be conservative.',
      },
      { role: 'user', content: `Job 1: ${JSON.stringify(job1)}\nJob 2: ${JSON.stringify(job2)}` },
    ],
    100,
  );
  return JSON.parse(content ?? '{"is_duplicate":false,"confidence":0,"reason":"No match"}');
}

export function detectRoleType(text: string) {
  const value = text.toLowerCase();
  if (value.includes('intern')) return 'Internship';
  if (value.includes('part-time') || value.includes('part time')) return 'Part Time';
  if (value.includes('contract')) return 'Contract';
  if (value.includes('stipend')) return 'Stipend Based';
  return 'Full Time';
}

function normalizeExtracted(value: Partial<ExtractedJob>): ExtractedJob {
  const inferredStatus = ['Applied', 'Interview', 'Rejected', 'Offer', 'Unknown'].includes(
    String(value.status),
  )
    ? value.status
    : 'Unknown';
  let confidence = Math.max(0, Math.min(1, Number(value.confidence ?? 0)));
  const company = value.company ?? null;
  const role = value.role ?? null;
  const hasCoreFields = Boolean(
    company && !/^unknown$/i.test(company) && role && !/^unknown$/i.test(role),
  );
  if (!hasCoreFields) confidence = Math.min(confidence, 0.69);
  const isJobRelated = Boolean(value.is_job_related);
  return {
    company,
    role,
    status: (isJobRelated ? 'Applied' : inferredStatus) as ExtractedJob['status'],
    applied_date: value.applied_date ?? null,
    source: value.source ?? 'Unknown',
    confidence,
    is_job_related: isJobRelated,
  };
}

function fallbackExtract(emailBody: string): ExtractedJob {
  const lower = emailBody.toLowerCase();
  const isJobRelated =
    /application|applied|interview|not moving forward|offer|candidate|position|role/.test(lower);
  const status = lower.includes('interview')
    ? 'Applied'
    : isJobRelated
      ? 'Applied'
      : 'Unknown';
  return {
    company: null,
    role: null,
    status,
    applied_date: null,
    source: lower.includes('linkedin')
      ? 'LinkedIn'
      : lower.includes('naukri')
        ? 'Naukri'
        : lower.includes('unstop')
          ? 'Unstop'
          : lower.includes('wellfound')
            ? 'Wellfound'
            : lower.includes('indeed')
              ? 'Indeed'
              : 'Unknown',
    confidence: isJobRelated ? 0.45 : 0,
    is_job_related: isJobRelated,
  };
}

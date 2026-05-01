import 'dotenv/config';
import { detectRoleType, extractJobFromEmail } from '../services/ai.js';

type ConfidenceBucket = 'high' | 'low';

type Expected = {
  job_title: string;
  company: string;
  role_type: string;
  portal: string;
  stipend_based: 'Yes' | 'No';
  confidence: ConfidenceBucket;
  review_flag?: boolean;
};

const cases: Array<{ name: string; email: string; expected: Expected }> = [
  {
    name: 'LinkedIn Easy Apply',
    email: `From: jobs-noreply@linkedin.com
Subject: Your application was sent to Google

Hi Satwik, your application for Software Engineer Intern
at Google was successfully submitted. The role is based
in Bangalore. Stipend: INR 80,000/month.`,
    expected: {
      job_title: 'Software Engineer Intern',
      company: 'Google',
      role_type: 'Internship',
      portal: 'LinkedIn',
      stipend_based: 'Yes',
      confidence: 'high',
    },
  },
  {
    name: 'Naukri Full Time',
    email: `From: donotreply@naukri.com
Subject: Application submitted - Backend Developer at Razorpay

Dear Candidate, your application for the position of
Backend Developer (Full Time) at Razorpay has been
received. Location: Mumbai. CTC: 12-15 LPA.`,
    expected: {
      job_title: 'Backend Developer',
      company: 'Razorpay',
      role_type: 'Full Time',
      portal: 'Naukri',
      stipend_based: 'No',
      confidence: 'high',
    },
  },
  {
    name: 'Google Form Application',
    email: `From: forms-receipts-noreply@google.com
Subject: Your response for Internship Application Form
at StartupXYZ has been recorded

Thank you for applying.
Position applying for: Product Management Intern
Company: StartupXYZ
Employment type: Part Time Internship
Stipend: Yes`,
    expected: {
      job_title: 'Product Management Intern',
      company: 'StartupXYZ',
      role_type: 'Internship',
      portal: 'Google Forms',
      stipend_based: 'Yes',
      confidence: 'high',
    },
  },
  {
    name: 'Ambiguous Email Low Confidence',
    email: `From: noreply@wellfound.com
Subject: You applied to a role

Hi there, thanks for applying.
The team will be in touch soon.`,
    expected: {
      job_title: 'Unknown',
      company: 'Unknown',
      role_type: 'Full Time',
      portal: 'Wellfound',
      stipend_based: 'No',
      confidence: 'low',
      review_flag: true,
    },
  },
  {
    name: 'Unstop Contract Role',
    email: `From: noreply@unstop.com
Subject: You applied to DevOps Consultant (Contract)
at Infosys on Unstop

Hi Satwik, your application for DevOps Consultant
(Contract, Remote) at Infosys has been submitted
successfully through Unstop.
Duration: 6 months contract.`,
    expected: {
      job_title: 'DevOps Consultant',
      company: 'Infosys',
      role_type: 'Contract',
      portal: 'Unstop',
      stipend_based: 'No',
      confidence: 'high',
    },
  },
];

function confidenceBucket(confidence: number): ConfidenceBucket {
  return confidence >= 0.7 ? 'high' : 'low';
}

function portalFromEmail(email: string, source: string) {
  const lower = email.toLowerCase();
  if (lower.includes('jobs-noreply@linkedin.com')) return 'LinkedIn';
  if (lower.includes('donotreply@naukri.com')) return 'Naukri';
  if (lower.includes('forms-receipts-noreply@google.com')) return 'Google Forms';
  if (lower.includes('noreply@wellfound.com')) return 'Wellfound';
  if (lower.includes('noreply@unstop.com')) return 'Unstop';
  return source === 'Google Form' ? 'Google Forms' : source;
}

function stipendBased(email: string) {
  return /stipend\s*[:\-]?\s*(yes|rs|inr|\d)/i.test(email) ? 'Yes' : 'No';
}

async function run() {
  if (!process.env.AICREDITS_API_KEY) {
    console.error('AICREDITS_API_KEY is missing. Set it in apps/api/.env or the shell before running DeepSeek extraction tests.');
    process.exit(1);
  }

  let failures = 0;
  for (const testCase of cases) {
    const extracted = await extractJobFromEmail(testCase.email);
    const actual: Record<keyof Expected, string | boolean> = {
      job_title: extracted.role ?? 'Unknown',
      company: extracted.company ?? 'Unknown',
      role_type: detectRoleType(testCase.email),
      portal: portalFromEmail(testCase.email, extracted.source),
      stipend_based: stipendBased(testCase.email),
      confidence: confidenceBucket(extracted.confidence),
      review_flag: extracted.confidence < 0.7,
    };

    const expected = testCase.expected;
    const diffs = (Object.keys(expected) as Array<keyof Expected>)
      .filter((key) => actual[key] !== expected[key])
      .map((key) => ({ field: key, expected: expected[key], actual: actual[key] }));

    console.log(`\n${testCase.name}`);
    console.log('Actual:', JSON.stringify({ raw: extracted, normalized: actual }, null, 2));

    if (diffs.length) {
      failures += 1;
      console.error('FAIL:', JSON.stringify(diffs, null, 2));
    } else {
      console.log('PASS');
    }
  }

  if (failures) {
    console.error(`\n${failures} DeepSeek extraction test(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll DeepSeek extraction tests passed.');
}

void run();

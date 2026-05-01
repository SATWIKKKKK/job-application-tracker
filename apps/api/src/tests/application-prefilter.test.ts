import { isApplicationConfirmation, isPromotionalJobText } from '../services/gmail.js';

type FilterCase = {
  name: string;
  subject: string;
  sender: string;
  body?: string;
  expected: boolean;
};

const cases: FilterCase[] = [
  {
    name: 'LinkedIn confirmation accepted',
    sender: 'jobs-noreply@linkedin.com',
    subject: 'Your application was sent to Google',
    expected: true,
  },
  {
    name: 'LinkedIn recommendation blocked',
    sender: 'jobs-noreply@linkedin.com',
    subject: 'New jobs similar to Frontend Engineer for you',
    expected: false,
  },
  {
    name: 'Glassdoor ad blocked',
    sender: 'noreply@glassdoor.com',
    subject: 'Full Stack Engineer at Accenture and 3 more jobs in Bhubaneswar for you.',
    expected: false,
  },
  {
    name: 'Indeed confirmation accepted',
    sender: 'indeedapply@indeed.com',
    subject: 'Application confirmation: You applied for Backend Engineer',
    expected: true,
  },
  {
    name: 'Google forms receipt accepted',
    sender: 'forms-receipts-noreply@google.com',
    subject: 'Your response for Internship Application Form at StartupXYZ has been recorded',
    expected: true,
  },
];

function assertEqual(name: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${name} failed. Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function run() {
  for (const testCase of cases) {
    const actual = isApplicationConfirmation(
      testCase.subject,
      testCase.sender,
      testCase.body ?? '',
    );
    assertEqual(testCase.name, actual, testCase.expected);
    console.log(`PASS: ${testCase.name}`);
  }

  assertEqual(
    'Promotion text detector',
    isPromotionalJobText('New jobs similar to Frontend Developer at Acme'),
    true,
  );
  assertEqual('Normal job title detector', isPromotionalJobText('Software Engineer Intern'), false);
  console.log('PASS: promotional text detection');
}

run();


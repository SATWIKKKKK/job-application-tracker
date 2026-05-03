import { ArrowRight, CheckCircle2, FileSpreadsheet, MailCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Footer, NavBar } from '../../components/site-chrome';

const steps = [
  {
    icon: UserCheck,
    title: 'Sign up with your job-search Gmail',
    text: 'Use the same email address you use on job portals. This lets JobTrackr match incoming confirmation emails to your dashboard.',
  },
  {
    icon: MailCheck,
    title: 'Connect Google securely',
    text: 'Authorize Gmail read access for application confirmations and Google Sheets access so JobTrackr can create and update your tracker.',
  },
  {
    icon: CheckCircle2,
    title: 'Apply on supported portals',
    text: 'Apply normally on LinkedIn, Naukri, Internshala, Unstop, Indeed, Wellfound, Glassdoor, Google Forms, and other supported sources.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Review your tracker',
    text: 'Confirmed applications appear in your dashboard, heatmap, and Google Sheet. Manual logging is available when a portal does not send a usable email.',
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="How it Works" />
      <main className="mx-auto w-full max-w-screen-xl flex-1 px-6 pb-20 pt-28 md:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-background md:text-5xl">
            How JobTrackr works now
          </h1>
          <p className="mt-5 text-base leading-7 text-on-surface-variant md:text-lg">
            The system is email-based: connect Google once, keep applying normally, and let confirmations become structured records.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                  {index + 1}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/auth/signin"
            className="hero-gradient inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-on-primary"
          >
            Start Tracking Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <Footer active="How it Works" />
    </div>
  );
}

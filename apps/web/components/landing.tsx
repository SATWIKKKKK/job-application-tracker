'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileSpreadsheet, MailCheck, ShieldCheck } from 'lucide-react';

const workflowCards = [
  {
    title: 'Connect Gmail',
    text: 'Use the same email you apply with so confirmations can be detected.',
    icon: MailCheck,
  },
  {
    title: 'Apply Normally',
    text: 'Keep using LinkedIn, Naukri, Internshala, Indeed, Google Forms, and supported portals.',
    icon: ShieldCheck,
  },
  {
    title: 'Track Automatically',
    text: 'Confirmed applications flow into your dashboard and Google Sheet.',
    icon: FileSpreadsheet,
  },
] as const;

export function LandingPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex max-w-screen-xl flex-col items-center px-6 pb-20 pt-36 text-center md:px-8 md:pb-24 md:pt-40">
        <div className="mb-8 inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-1.5 shadow-sm">
          <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
          <span className="font-label text-sm font-medium tracking-wide text-on-surface-variant">
            Track Every Application, Zero Effort
          </span>
        </div>
        <h1 className="max-w-4xl font-headline text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-on-background md:text-6xl">
          Never Lose Track of a <br />
          <span className="text-primary-container">Job Application</span> Again
        </h1>
        <p className="mt-6 max-w-2xl font-body text-lg leading-8 text-on-surface-variant md:text-xl">
          Connect Gmail once. JobTrackr reads job application confirmation emails, extracts the details, and keeps your Google Sheet and dashboard organized automatically.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/auth/signin"
            className="hero-gradient inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-body text-base font-bold text-on-primary shadow-[0_4px_20px_rgba(0,73,197,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,73,197,0.3)] active:scale-95"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-screen-xl gap-5 px-6 pb-24 md:grid-cols-3 md:px-8">
        {workflowCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <card.icon className="h-5 w-5" />
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{card.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-screen-xl px-6 pb-28 md:px-8">
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6 md:p-8">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Create your account', 'Sign up with the same Gmail address you use on job portals.'],
              ['2', 'Connect Google', 'Authorize Gmail read access and Google Sheets sync from your dashboard.'],
              ['3', 'Apply and relax', 'JobTrackr watches confirmation emails, filters noise, and logs confident matches.'],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-lg bg-surface-container-low p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold">{number}</div>
                <h3 className="font-headline text-lg font-bold text-on-surface">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

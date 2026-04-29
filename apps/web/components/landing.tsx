'use client';

import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, PlayCircle, X } from 'lucide-react';

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
          The intelligent browser extension that auto-logs your job hunt directly to Google Sheets with a single click.
          Seamless, organized, and beautifully effortless.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/auth/signin"
            className="hero-gradient inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-body text-base font-bold text-on-primary shadow-[0_4px_20px_rgba(0,73,197,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,73,197,0.3)] active:scale-95"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => document.getElementById('visual-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-8 py-4 font-body text-base font-semibold text-on-surface shadow-sm transition-colors duration-300 hover:bg-surface-container-low"
          >
            <PlayCircle className="h-5 w-5" /> Watch Demo
          </button>
        </div>
      </header>

      <section id="visual-demo" className="relative mx-auto w-full max-w-screen-2xl px-6 pb-28 md:px-8">
        <div className="relative flex aspect-[16/11] w-full items-center justify-center overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low shadow-[0_20px_60px_rgba(25,28,32,0.08)] md:aspect-[21/9]">
          <div className="absolute inset-0 flex flex-col px-5 pt-6 opacity-70 md:px-8 md:pt-8">
            <div className="mb-6 flex items-center gap-2 border-b border-outline-variant/25 pb-4">
              <div className="h-3 w-3 rounded-full bg-error-container" />
              <div className="h-3 w-3 rounded-full bg-tertiary-container/70" />
              <div className="h-3 w-3 rounded-full bg-primary-fixed-dim" />
              <div className="ml-3 h-6 flex-1 rounded-md bg-surface-container-lowest/70" />
            </div>
            <div className="flex flex-1 gap-6 pb-8">
              <div className="hidden h-full w-64 flex-col gap-4 rounded-lg border border-outline-variant/10 bg-surface-container-lowest/80 p-4 shadow-sm md:flex">
                <div className="h-4 w-3/4 rounded bg-surface-container-high" />
                <div className="h-4 w-1/2 rounded bg-surface-container-high" />
                <div className="h-4 w-5/6 rounded bg-surface-container-high" />
              </div>
              <div className="relative h-full flex-1 overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-lowest/90 p-6 shadow-sm">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e1e2e8_1px,transparent_1px),linear-gradient(to_bottom,#e1e2e8_1px,transparent_1px)] bg-[size:4rem_3rem]" />
                <div className="absolute left-10 top-12 flex items-center rounded-md bg-primary-fixed px-4 py-2 font-body text-sm font-medium text-on-primary-fixed shadow-sm md:left-16">
                  <BriefcaseBusiness className="mr-2 h-4 w-4" /> Senior Product Designer
                </div>
                <div className="absolute left-10 top-24 flex items-center rounded-md bg-secondary-fixed px-4 py-2 font-body text-sm font-medium text-on-primary-fixed shadow-sm md:left-16">
                  <Building2 className="mr-2 h-4 w-4" /> Acme Corp
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-[19rem] rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0_10px_40px_rgba(25,28,32,0.12)] md:w-80 md:translate-x-1/3 md:-translate-y-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary">
                  JT
                </div>
                <span className="font-headline font-bold text-on-surface">JobTrackr</span>
              </div>
              <button type="button" aria-label="Close demo popup" className="rounded-full p-1 text-outline transition-colors hover:bg-surface-container-low">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                ['Role', 'Senior UI Designer'],
                ['Company', 'Stripe'],
                ['Salary Range', '$140k - $180k'],
              ].map(([label, value]) => (
                <div key={label}>
                  <label className="mb-1 block font-label text-xs uppercase tracking-wider text-on-surface-variant">{label}</label>
                  <div className="rounded-md border border-outline-variant/10 bg-surface-container-low px-3 py-2 font-body text-sm text-on-surface">
                    {value}
                  </div>
                </div>
              ))}
              <Link
                href="/auth/signin"
                className="hero-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-md py-3 font-body font-bold text-on-primary shadow-sm transition-shadow hover:shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" /> Save to Sheets
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { Footer, NavBar } from '../../components/site-chrome';

const sections = [
  { id: 'scope', label: 'Service Scope' },
  { id: 'responsibility', label: 'Account Responsibility' },
  { id: 'data', label: 'Data & Permissions' },
  { id: 'availability', label: 'Availability' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />

      {/* Hero */}
      <div className="hero-gradient pt-28 pb-14">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 uppercase tracking-widest mb-5">
            Legal
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white md:text-5xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-white/60">Last updated: May 1, 2026</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-24 pt-10 md:px-8">

        {/* TOC pills */}
        <nav className="mb-10 flex flex-wrap gap-2">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-outline-variant/50 bg-surface-container-low px-4 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary hover:text-white hover:border-primary"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-6">

          <section id="scope" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Service Scope</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              JobTrackr helps users track job applications by reading confirmation emails from connected Gmail accounts
              and logging extracted details into a user-owned Google Sheet. Use of the service is subject to these terms.
            </p>
          </section>

          <section id="responsibility" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Account Responsibility</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              You are responsible for using the same email address across job portals and JobTrackr to ensure correct
              tracking. You are also responsible for keeping your account credentials secure and for all activity that
              occurs under your account.
            </p>
          </section>

          <section id="data" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Data and Permissions</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              By connecting Google OAuth, you authorize JobTrackr to access Gmail read-only data for application
              confirmations and write to Google Sheets/Drive for your tracker sheet. You can revoke access at any time
              via your Google account settings at{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                myaccount.google.com/permissions
              </a>.
            </p>
          </section>

          <section id="availability" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Availability</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              We aim for reliable uptime but do not guarantee uninterrupted service. Features may evolve as portal
              formats and provider policies change. We reserve the right to modify or discontinue any part of the
              service with reasonable notice.
            </p>
          </section>

          <section id="contact" className="rounded-2xl border border-primary/20 bg-primary/5 p-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Contact</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              For legal or account concerns, contact{' '}
              <a href="mailto:satwikchandra65@gmail.com" className="font-semibold text-primary hover:underline">
                satwikchandra65@gmail.com
              </a>
              . We typically respond within 48 hours.
            </p>
          </section>

        </div>
      </main>
      <Footer active="Terms of Service" />
    </div>
  );
}

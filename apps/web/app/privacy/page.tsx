import { Footer, NavBar } from '../../components/site-chrome';

const sections = [
  { id: 'collect', label: 'Data We Collect' },
  { id: 'use', label: 'How We Use It' },
  { id: 'not-do', label: 'What We Don\'t Do' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />

      {/* Hero */}
      <div className="hero-gradient pt-28 pb-14">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 uppercase tracking-widest mb-5">
            Legal
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white md:text-5xl">Privacy Policy</h1>
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

          <section id="collect" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">What Data We Collect</h2>
            </div>
            <ul className="space-y-3 pl-1">
              {[
                'Gmail read access for job confirmation emails only.',
                'Google Sheets write access to your own JobTrackr sheet.',
                'Your account email address for authentication and account ownership.',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section id="use" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">How We Use It</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              JobTrackr uses this data solely to detect job application confirmation emails and log the extracted
              application details into your personal Google Sheet. We do not use your data for any other purpose.
            </p>
          </section>

          <section id="not-do" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">What We Do Not Do</h2>
            </div>
            <ul className="space-y-3 pl-1">
              {[
                'We do not read personal emails unrelated to job applications.',
                'We do not store full personal email content beyond extracted job fields such as title and company.',
                'We do not sell your data.',
                'We do not share your data with third parties for advertising.',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section id="retention" className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-ambient">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Data Retention</h2>
            </div>
            <p className="text-sm leading-7 text-on-surface-variant">
              You can request account deletion at any time. When deleted, all associated JobTrackr data in our database
              is permanently removed. We retain no backups of your personal data after deletion.
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
              For privacy concerns, reach out at{' '}
              <a href="mailto:satwikchandra65@gmail.com" className="font-semibold text-primary hover:underline">
                satwikchandra65@gmail.com
              </a>
              . We typically respond within 48 hours.
            </p>
          </section>

        </div>
      </main>
      <Footer active="Privacy Policy" />
    </div>
  );
}

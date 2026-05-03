import { Mail, Send } from 'lucide-react';
import { Footer, NavBar } from '../../components/site-chrome';

const activePortals = [
  'LinkedIn',
  'Naukri',
  'Internshala',
  'Unstop',
  'Indeed',
  'Wellfound',
  'Glassdoor',
  'Cutshort',
  'Hirect',
  'Shine',
  'Foundit',
  'Monster India',
  'Google Forms',
  'Google Docs-style application forms',
];

export default function HelpCenterPage() {
  const email = 'satwikchandra65@gmail.com';
  const subject = encodeURIComponent('JobTrackr Help Request');
  const body = encodeURIComponent('Hi JobTrackr team,\n\nI need help with:\n');

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <NavBar active="Help" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 pb-16 pt-28 md:px-8">
        <section data-animate-item className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="font-headline text-4xl font-black tracking-tight text-blue-950 md:text-5xl">
            Help Center
          </h1>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">
            Get support for account setup, Gmail connection, application tracking, and Google Sheet sync.
          </p>
        </section>

        <section data-animate-item className="shadow-ambient rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline text-xl font-bold">Contact Us</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{email}</p>
            </div>
            <a
              href={`mailto:${email}?subject=${subject}&body=${body}`}
              className="hero-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-on-primary"
            >
              <Send className="h-4 w-4" /> Email Support
            </a>
          </div>
        </section>

        <section data-animate-item className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h2 className="font-headline text-xl font-bold">Actively Tracked Portals</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            These sources currently have Gmail confirmation rules that can create application records automatically.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {activePortals.map((portal) => (
              <span key={portal} className="rounded-full bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface">
                {portal}
              </span>
            ))}
          </div>
        </section>
      </main>
      <Footer active="Contact" />
    </div>
  );
}

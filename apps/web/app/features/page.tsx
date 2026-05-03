import { Activity, BarChart3, FileSpreadsheet, MailCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Footer, NavBar } from '../../components/site-chrome';

const features = [
  {
    icon: MailCheck,
    title: 'Email-based capture',
    text: 'JobTrackr detects application confirmation emails from supported portals and Google Forms instead of relying on an extension.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Google Sheets sync',
    text: 'Every confirmed application is appended to your own Google Sheet so your data stays portable.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard tracking',
    text: 'Review applications, update status, search by company, and manually add roles that do not send confirmation emails.',
  },
  {
    icon: Activity,
    title: 'Activity heatmap',
    text: 'See daily application activity and click any date to inspect the applications submitted that day.',
  },
  {
    icon: ShieldCheck,
    title: 'Noise filtering',
    text: 'Promotional job alerts and recommendations are filtered out so your tracker focuses on actual applications.',
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="Features" />
      <main className="mx-auto w-full max-w-screen-xl flex-1 px-6 pb-20 pt-28 md:px-8">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-tight text-on-surface md:text-5xl">
            Automatic tracking from the emails you already receive
          </h1>
          <p className="mt-5 text-base leading-7 text-on-surface-variant md:text-lg">
            No browser extension. No one-click capture. JobTrackr watches confirmation emails, extracts clean application details, and keeps your job hunt organized.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/auth/signin" className="hero-gradient inline-flex rounded-full px-6 py-3 text-sm font-bold text-on-primary">
            Start Tracking
          </Link>
        </div>
      </main>
      <Footer active="Features" />
    </div>
  );
}

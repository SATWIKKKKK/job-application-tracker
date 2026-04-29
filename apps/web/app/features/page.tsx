import { Briefcase, LayoutDashboard, MailCheck, Puzzle, Table2 } from 'lucide-react';
import { Footer, NavBar } from '../../components/site-chrome';

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="Features" />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-8 py-28">
        <div className="mb-20 text-center">
          <h1 className="font-headline text-5xl font-extrabold">Everything you need to track smarter</h1>
          <p className="mt-8 text-2xl text-on-surface">One dashboard. All your applications. Zero manual entry.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FeatureCard className="md:col-span-2" icon={<Puzzle />} title="One-Click Capture" text="Apply on any job site, we log it instantly." large />
          <FeatureCard icon={<Table2 />} title="Auto-Sync to Google Sheets" text="Your applications appear in your sheet in real time." large />
          <FeatureCard icon={<Briefcase />} title="20+ Job Portals Supported" />
          <FeatureCard icon={<MailCheck />} title="Email Confirmation on Every Apply" />
          <FeatureCard icon={<LayoutDashboard />} title="Application Status Dashboard" />
        </div>
      </main>
      <Footer active="Features" />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  className = '',
  large = false,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
  className?: string;
  large?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-outline-variant bg-surface-container p-10 shadow-sm ${className}`}>
      <div className="mb-8 text-primary [&_svg]:h-10 [&_svg]:w-10">{icon}</div>
      <h2 className="font-headline text-3xl font-bold">{title}</h2>
      {text ? <p className="mt-5 max-w-lg text-xl leading-8 text-on-surface-variant">{text}</p> : null}
      {large ? <div className="mt-12 h-60 rounded-lg border border-white/80 bg-white/60" /> : null}
    </div>
  );
}

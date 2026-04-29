import { CheckCircle2, Cable, Puzzle } from 'lucide-react';
import Link from 'next/link';
import { Footer, NavBar } from '../../components/site-chrome';

const steps = [
  [Cable, 'Connect Your Sheet', 'Sign in with Google and grant access to Google Sheets. We create a dedicated JobTrackr sheet in your Drive.'],
  [Puzzle, 'Install the Extension', 'Add our Chrome extension from the Web Store. It works silently in the background on 20+ job portals.'],
  [CheckCircle2, 'Apply and Watch It Log', 'Apply to any job normally. The application details appear in your sheet within seconds.'],
] as const;

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container-low">
      <NavBar active="How it Works" />
      <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col items-center px-8 py-52 text-center">
        <h1 className="font-headline text-5xl font-semibold">Up and running in 3 minutes</h1>
        <p className="mt-8 max-w-3xl text-2xl leading-9 text-on-surface-variant">
          Get your automated job application tracker set up instantly. No complex configuration required.
        </p>
        <div className="relative mt-24 grid w-full grid-cols-1 gap-12 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-16 hidden h-px bg-outline-variant md:block" />
          {steps.map(([Icon, title, text], index) => (
            <div className="relative flex flex-col items-center" key={title}>
              <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-outline-variant bg-white text-primary">
                <Icon size={42} />
                <span className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <h2 className="mt-10 font-headline text-3xl font-bold">{title}</h2>
              <p className="mt-6 max-w-md text-xl leading-8 text-on-surface-variant">{text}</p>
            </div>
          ))}
        </div>
        <Link href="/auth/signin" className="mt-24 rounded-lg bg-primary px-10 py-4 font-bold tracking-wide text-white">
          Start Your Free Trial
        </Link>
      </main>
      <Footer />
    </div>
  );
}

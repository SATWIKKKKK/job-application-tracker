import { ArrowRight, CheckCircle2, Puzzle, Table2 } from 'lucide-react';
import Link from 'next/link';
import { Footer, NavBar } from '../../components/site-chrome';

const steps = [
  {
    icon: Table2,
    title: 'Connect Your Sheet',
    text: 'Link your existing Google Sheet or let us create a perfectly formatted tracking template for you instantly.',
    tone: 'bg-primary-fixed text-primary',
  },
  {
    icon: Puzzle,
    title: 'Install the Extension',
    text: 'Add our lightweight browser plugin. It sits quietly in the background until you find a job you love.',
    tone: 'bg-secondary-fixed text-secondary',
  },
  {
    icon: CheckCircle2,
    title: 'Apply & Watch It Log',
    text: "Click 'Save Job' on any supported career site. We automatically extract details and log them to your sheet.",
    tone: 'bg-tertiary-fixed text-tertiary',
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="How it Works" />
      <main className="flex min-h-screen flex-col justify-center px-6 pb-24 pt-32 md:px-8">
        <div className="relative mx-auto w-full max-w-screen-xl">
          <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
            <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-on-background md:text-5xl">
              Up and running in 3 minutes
            </h1>
            <p className="mt-6 font-body text-base leading-7 text-on-surface-variant md:text-lg">
              No complicated setups. Just connect, install, and let JobTrackr handle the rest while you focus on landing the perfect role.
            </p>
          </div>

          <div className="relative w-full">
            <div className="absolute left-[15%] right-[15%] top-[120px] z-0 hidden h-px bg-outline-variant/30 lg:block" />
            <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div className={`group flex flex-col items-center ${index === 1 ? 'lg:mt-12' : ''}`} key={step.title}>
                  <Link href={index === 0 ? '/dashboard/setup' : index === 1 ? '/dashboard/portals' : '/sites'} className="shadow-ambient relative flex w-full max-w-[320px] flex-col items-center overflow-hidden rounded-lg bg-surface-container-lowest p-10 transition-all duration-300 hover:-translate-y-2 hover:bg-primary-fixed/20">
                    <div className="pointer-events-none absolute -right-4 -top-4 select-none font-display text-8xl font-bold text-surface-container-low/60 transition-colors group-hover:text-surface-container-high/60">
                      {index + 1}
                    </div>
                    <div className={`relative z-10 mb-8 flex h-20 w-20 items-center justify-center rounded-full ${step.tone}`}>
                      <step.icon className="h-9 w-9" />
                    </div>
                    <h2 className="relative z-10 mb-4 text-center font-display text-xl font-bold text-on-background">{step.title}</h2>
                    <p className="relative z-10 text-center font-body text-sm leading-6 text-on-surface-variant">{step.text}</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center md:mt-20">
            <Link
              href="/auth/signin"
              className="hero-gradient mx-auto inline-flex items-center gap-2 rounded-full px-8 py-4 font-body font-semibold text-on-primary shadow-ambient transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            >
              Start Tracking Now <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

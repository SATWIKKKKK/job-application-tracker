import { BarChart3, Globe2, Mail, Puzzle, RefreshCw } from 'lucide-react';
import { Footer, NavBar } from '../../components/site-chrome';

const featureImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC5VbssfSk7STp5_XsUYdYyZ_ZTSd7l6cCBo2Hs7ptjbrdtgaaTQ3pCB5s591PFAj86R4a9iISCEah9uLmCF4Mp9z25E07wsV-3ANJ3aMwckZe1hInq2wSrFxx_963Rsi-FfvAHuIFzM7NiONI9Awb7wPSLlhM8VNGlzqtFf1BA3g6LzqNttqs7aWfvwi8lHroqM-VYmSDdGrJqJAWSulux1anOGRYmayyKsiTSFDXrh_hj8rg_vR0nf0hGIP4TSgmoD-30eCjrmJP_';

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="Features" />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-6 pb-24 pt-32 md:px-12">
        <div className="mb-16 max-w-3xl md:mb-20">
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-on-surface md:text-6xl">
            Everything you need to track smarter
          </h1>
          <p className="mt-6 font-body text-lg leading-8 text-on-surface-variant md:text-xl">
            One dashboard. All your applications. Zero manual entry.
          </p>
        </div>

        <div className="grid auto-rows-[220px] grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          <div className="shadow-ambient group relative col-span-1 row-span-2 flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-8 md:col-span-2">
            <div className="relative z-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Puzzle className="h-6 w-6" />
              </div>
              <h2 className="mb-3 font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">One-Click Capture</h2>
              <p className="max-w-sm font-body leading-7 text-on-surface-variant">
                Save jobs from any site directly into your pipeline with our seamless browser extension.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 h-3/4 w-3/4 rounded-full bg-gradient-to-tl from-primary-container/20 to-transparent blur-3xl transition-transform duration-700 group-hover:scale-110" />
            <div
              aria-label="Browser extension popup floating over clean application windows"
              className="absolute -bottom-6 -right-8 h-64 w-2/3 rounded-xl border border-outline-variant/20 bg-cover bg-center drop-shadow-2xl transition-transform duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2"
              style={{ backgroundImage: `url(${featureImage})` }}
            />
          </div>

          <div className="group relative col-span-1 row-span-2 flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-8">
            <div className="relative z-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h2 className="mb-3 font-headline text-2xl font-bold tracking-tight text-on-surface">Auto-Sync to Google Sheets</h2>
              <p className="font-body leading-7 text-on-surface-variant">Keep your data portable and accessible anywhere, automatically.</p>
            </div>
            <div className="mt-8 flex flex-grow flex-col justify-end opacity-80 transition-opacity group-hover:opacity-100">
              <div className="mb-3 flex h-12 w-full items-center rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 shadow-sm">
                <div className="mr-3 h-4 w-4 rounded-full bg-primary/20" />
                <div className="h-2 w-1/2 rounded-full bg-surface-dim" />
              </div>
              <div className="mx-auto mb-3 h-6 w-0.5 bg-outline-variant/40" />
              <div className="flex h-12 w-full items-center rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 shadow-sm">
                <BarChart3 className="mr-3 h-5 w-5 text-green-600" />
                <div className="h-2 w-2/3 rounded-full bg-surface-dim" />
              </div>
            </div>
          </div>

          <SmallFeature icon={<Globe2 />} title="20+ Portals" text="Works seamlessly with LinkedIn, Indeed, Greenhouse, and more." tone="tertiary" />
          <SmallFeature icon={<Mail />} title="Email Confirmations" text="Automatically parse application receipts from your inbox." tone="primary" />

          <div className="col-span-1 row-span-1 flex items-center justify-between overflow-hidden rounded-xl bg-surface-container-low p-6 md:col-span-2">
            <div className="relative z-10 w-1/2">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-headline text-xl font-bold tracking-tight text-on-surface">Status Dashboard</h3>
              <p className="font-body text-sm leading-6 text-on-surface-variant">Visualize your funnel from applied to offer.</p>
            </div>
            <div className="flex h-24 w-1/2 items-end justify-end gap-2 opacity-80">
              <div className="h-[40%] w-8 rounded-t-md bg-surface-variant" />
              <div className="h-[70%] w-8 rounded-t-md bg-primary-fixed-dim" />
              <div className="h-full w-8 rounded-t-md bg-primary" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SmallFeature({
  icon,
  title,
  text,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: 'primary' | 'tertiary';
}) {
  return (
    <div className="shadow-ambient col-span-1 row-span-1 flex flex-col justify-center rounded-xl bg-surface-container-lowest p-6 transition-shadow duration-300 hover:shadow-lg">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-tertiary-container/10 text-tertiary'}`}>
        {icon}
      </div>
      <h3 className="mb-2 font-headline text-xl font-bold tracking-tight text-on-surface">{title}</h3>
      <p className="font-body text-sm leading-6 text-on-surface-variant">{text}</p>
    </div>
  );
}

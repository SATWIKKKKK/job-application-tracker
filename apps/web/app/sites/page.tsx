import { Footer, NavBar } from '../../components/site-chrome';
import { SUPPORTED_PORTALS } from '../../lib/portals';

export default function SitesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="Sites" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-24 pt-32 md:px-8">
        <h1 className="font-headline text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Supported job portals</h1>
        <p className="mt-5 text-lg text-on-surface-variant">Auto-log applications from the places you already apply.</p>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {SUPPORTED_PORTALS.map((portal) => (
            <a href="/auth/signin" key={portal} className="shadow-ambient rounded-lg border border-outline-variant/30 bg-white p-5 font-bold transition-transform hover:-translate-y-1">
              {portal}
            </a>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

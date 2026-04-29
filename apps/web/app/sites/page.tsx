import { Footer, NavBar } from '../../components/site-chrome';
import { SUPPORTED_PORTALS } from '../../lib/portals';

export default function SitesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar active="Sites" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-24">
        <h1 className="font-headline text-5xl font-extrabold">Supported job portals</h1>
        <p className="mt-5 text-xl text-on-surface-variant">Auto-log applications from the places you already apply.</p>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {SUPPORTED_PORTALS.map((portal) => (
            <div key={portal} className="rounded-lg border border-outline-variant bg-white p-5 font-bold">
              {portal}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { Footer, NavBar } from '../../components/site-chrome';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-20 pt-32 md:px-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Privacy Policy</h1>
        <p className="mt-3 text-sm text-on-surface-variant">Last updated: May 1, 2026</p>

        <div className="mt-10 space-y-8 text-on-surface">
          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">What Data We Collect</h2>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-on-surface-variant">
              <li>Gmail read access for job confirmation emails only.</li>
              <li>Google Sheets write access to your own JobTrackr sheet.</li>
              <li>Your account email address for authentication and account ownership.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">How We Use It</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              JobTrackr uses this data solely to detect job application confirmation emails and log the extracted
              application details into your personal Google Sheet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">What We Do Not Do</h2>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-on-surface-variant">
              <li>We do not read personal emails unrelated to job applications.</li>
              <li>We do not store full personal email content beyond extracted job fields such as title and company.</li>
              <li>We do not sell your data.</li>
              <li>We do not share your data with third parties for advertising.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Data Retention</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              You can request account deletion at any time. When deleted, all associated JobTrackr data in our database
              is removed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold">Contact</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              For privacy concerns, contact <a href="mailto:privacy@jobtrackr.app" className="font-semibold text-primary">privacy@jobtrackr.app</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer active="Privacy Policy" />
    </div>
  );
}

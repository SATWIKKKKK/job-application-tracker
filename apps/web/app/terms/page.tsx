import { Footer, NavBar } from '../../components/site-chrome';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-20 pt-32 md:px-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Terms of Service</h1>
        <p className="mt-3 text-sm text-on-surface-variant">Last updated: May 1, 2026</p>

        <div className="mt-10 space-y-8">
          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Service Scope</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              JobTrackr helps users track job applications by reading confirmation emails from connected Gmail accounts
              and logging extracted details into a user-owned Google Sheet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Account Responsibility</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              You are responsible for using the same email address across job portals and JobTrackr to ensure correct
              tracking. You are also responsible for keeping your account credentials secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Data and Permissions</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              By connecting Google OAuth, you authorize JobTrackr to access Gmail read-only data for application
              confirmations and write to Google Sheets/Drive for your tracker sheet. You can revoke access anytime in
              your Google account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Availability</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              We aim for reliable uptime but do not guarantee uninterrupted service. Features may evolve as portal
              formats and provider policies change.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Contact</h2>
            <p className="text-sm leading-7 text-on-surface-variant">
              For legal or account concerns, contact <a href="mailto:privacy@jobtrackr.app" className="font-semibold text-primary">privacy@jobtrackr.app</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer active="Terms of Service" />
    </div>
  );
}

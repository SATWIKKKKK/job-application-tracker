import { Chrome } from 'lucide-react';
import { API_URL } from '../../../lib/config';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="font-headline text-3xl font-extrabold text-primary">JobTrackr</div>
          <h1 className="mt-8 font-headline text-3xl font-bold">Sign in</h1>
          <p className="mt-3 text-on-surface-variant">Google sign-in connects Sheets access in one step.</p>
        </div>
        <form className="space-y-4 opacity-60">
          <input disabled className="w-full rounded-lg border border-outline-variant px-4 py-3" placeholder="Email address" />
          <input disabled className="w-full rounded-lg border border-outline-variant px-4 py-3" placeholder="Password" type="password" />
        </form>
        <a
          href={`${API_URL}/api/auth/google`}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 font-bold text-white"
        >
          <Chrome size={20} /> Continue with Google
        </a>
      </div>
    </main>
  );
}

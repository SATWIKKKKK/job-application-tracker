'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '../../../lib/config';
import { getOAuthReturnTo } from '../../../lib/oauth';

type Mode = 'login' | 'signup' | 'otp';

function persistWebToken(token?: string) {
  if (!token) return;
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `jt_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function getSafeNextPath(nextPath: string | null | undefined, fallback = '/dashboard') {
  if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    return nextPath;
  }
  return fallback;
}

export function AuthPanel() {
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'));
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [confirmedEmailMatch, setConfirmedEmailMatch] = useState(false);

  useEffect(() => {
    setShowEmailWarning(localStorage.getItem('jobtrackr-email-warning-understood') !== 'true');
  }, []);

  function acceptEmailWarning() {
    if (!confirmedEmailMatch) return;
    localStorage.setItem('jobtrackr-email-warning-understood', 'true');
    setShowEmailWarning(false);
  }

  async function submit(path: string, body: Record<string, string>) {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? 'Something went wrong');
        return data;
      }
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'login') {
      const data = await submit('/api/auth/login', { email, password });
      persistWebToken(data?.token);
      if (data?.token) {
        window.location.href = nextPath;
      }
      return;
    }
    if (mode === 'signup') {
      const data = await submit('/api/auth/signup', { email, password, name });
      if (data?.message === 'otp_sent') {
        setMode('otp');
        setMessage('Verification code sent to your email.');
      }
      return;
    }
    const data = await submit('/api/auth/verify-otp', { email, otp });
    persistWebToken(data?.token);
    if (data?.token) {
      window.location.href = nextPath;
    }
  }

  return (
    <>
      {showEmailWarning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-warning-title"
            className="shadow-[0_10px_40px_rgba(25,28,32,0.06),0_4px_20px_rgba(0,73,197,0.04)] flex w-full max-w-[480px] flex-col items-center rounded-lg bg-surface-container-lowest p-8 text-center sm:p-10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error-container/30 text-error">
              <AlertTriangle className="h-9 w-9" />
            </div>
            <h2 id="email-warning-title" className="mb-4 font-headline text-2xl font-bold tracking-tight text-on-surface">
              Important
            </h2>
            <p className="mb-6 px-1 text-base leading-relaxed text-on-surface-variant">
              Register and sign in with the same email address you use on LinkedIn, Naukri, Internshala, Unstop, Indeed, and other job portals. JobTrackr monitors your inbox for job confirmation emails. If you use a different email, we won&apos;t be able to track your applications automatically. Also note: if you apply to jobs via Google Forms or Google Docs links, make sure those forms are submitted using this same email so we can monitor those confirmations too.
            </p>
            <label className="mb-8 flex w-full items-start gap-3 rounded-DEFAULT bg-surface-container-low p-4 text-left text-sm font-medium leading-6 text-on-surface-variant">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                checked={confirmedEmailMatch}
                onChange={(event) => setConfirmedEmailMatch(event.target.checked)}
              />
              <span>I confirm my JobTrackr email matches my job portal email</span>
            </label>
            <button
              type="button"
              disabled={!confirmedEmailMatch}
              onClick={acceptEmailWarning}
              className="hero-gradient flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-headline text-lg font-bold text-on-primary shadow-[0_4px_20px_rgba(0,73,197,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,73,197,0.12)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Got it, Continue <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="shadow-ambient w-full max-w-md rounded-xl border border-outline-variant/30 bg-white p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="font-headline text-2xl font-black tracking-[-0.04em] text-primary-container">
            JobTrackr
          </Link>
          <h1 className="mt-8 font-headline text-2xl font-bold">
            {mode === 'signup' ? 'Create your account' : mode === 'otp' ? 'Verify your email' : 'Welcome back'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            {mode === 'otp' ? 'Enter the 6-digit code we sent you.' : 'Use email/password or continue with Google.'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-full bg-surface-container-low p-1 text-sm font-bold">
        <button type="button" onClick={() => setMode('login')} className={`rounded-full py-2 ${mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}>
          Login
        </button>
        <button type="button" onClick={() => setMode('signup')} className={`rounded-full py-2 ${mode !== 'login' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`}>
          Sign up
        </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
        {mode === 'signup' ? (
          <input className="w-full rounded-lg border border-outline-variant/40 px-4 py-3 text-sm" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        ) : null}
        <input className="w-full rounded-lg border border-outline-variant/40 px-4 py-3 text-sm" placeholder="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {mode === 'otp' ? (
          <input className="w-full rounded-lg border border-outline-variant/40 px-4 py-3 text-sm tracking-[0.4em]" placeholder="000000" value={otp} onChange={(event) => setOtp(event.target.value)} required minLength={6} maxLength={6} />
        ) : (
          <input className="w-full rounded-lg border border-outline-variant/40 px-4 py-3 text-sm" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        )}
        <button disabled={loading} className="hero-gradient flex w-full items-center justify-center rounded-full px-6 py-4 font-bold text-white disabled:opacity-60">
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Send OTP' : 'Verify and continue'}
        </button>
        </form>

        {message ? <p className="mt-4 rounded-lg bg-surface-container-low px-4 py-3 text-center text-sm text-on-surface-variant">{message}</p> : null}

        <a href={getGoogleAuthUrl(nextPath)} className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant/40 bg-white px-6 py-4 font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low">
          <GoogleIcon /> Continue with Google
        </a>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-xs leading-5 text-on-surface-variant">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>You may see a Google security warning. Click Continue to proceed. We only read job confirmation emails, never personal emails.</span>
        </p>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
  function getGoogleAuthUrl(nextPath: string) {
    const returnTo = getOAuthReturnTo();
    return `${API_URL}/api/auth/google?return_to=${encodeURIComponent(returnTo)}&next=${encodeURIComponent(nextPath)}`;
  }

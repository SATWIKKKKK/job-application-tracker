'use client';

import Link from 'next/link';
import { useState } from 'react';
import { API_URL } from '../../../lib/config';

type Mode = 'login' | 'signup' | 'otp';

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (data?.redirect_to) window.location.href = data.redirect_to;
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
    if (data?.redirect_to) window.location.href = data.redirect_to;
  }

  return (
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

      <a href={`${API_URL}/api/auth/google`} className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-outline-variant/40 bg-white px-6 py-4 font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low">
        <GoogleIcon /> Continue with Google
      </a>
    </div>
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

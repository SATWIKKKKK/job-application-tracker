'use client';

import { useState } from 'react';
import { ArrowRight, FileSpreadsheet, Puzzle } from 'lucide-react';
import { API_URL } from '../../../lib/config';

export function SetupClient() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function setupSheet() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/sheets/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.message === 'missing_google_refresh_token') {
          window.location.href = `${API_URL}/api/auth/google`;
          return;
        }
        setMessage(data.message ?? 'Could not create sheet');
        return;
      }
      setMessage(`Sheet created: ${data.sheet_url}`);
      window.location.href = '/dashboard';
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="shadow-ambient rounded-xl bg-white p-8 md:p-10">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <FileSpreadsheet className="h-7 w-7" />
        </div>
        <h1 className="font-headline text-3xl font-bold tracking-[-0.03em]">Set up your tracking sheet</h1>
        <p className="mt-4 max-w-2xl leading-7 text-on-surface-variant">
          Connect Google Sheets once. JobTrackr will create your application tracker and keep every future application in sync.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button onClick={setupSheet} disabled={loading} className="hero-gradient flex items-center justify-center gap-2 rounded-lg px-6 py-4 font-bold text-white disabled:opacity-60">
            <FileSpreadsheet className="h-5 w-5" /> {loading ? 'Creating...' : 'Connect Google Sheet'}
          </button>
          <a href="/dashboard/portals" className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant/40 px-6 py-4 font-bold text-primary transition-colors hover:bg-surface-container-low">
            <Puzzle className="h-5 w-5" /> Install Extension <ArrowRight className="h-5 w-5" />
          </a>
        </div>
        {message ? <p className="mt-6 rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">{message}</p> : null}
      </div>
    </section>
  );
}

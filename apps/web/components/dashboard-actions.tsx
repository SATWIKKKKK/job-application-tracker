'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpCircle, LogOut, Search, Settings, UserCircle } from 'lucide-react';
import type { User } from '../lib/types';
import { API_URL } from '../lib/config';

export function DashboardTopBar({ user }: { user: User }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  async function logout() {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
    document.cookie = 'jt_token=; Path=/; Max-Age=0; SameSite=Lax';
    router.push('/auth/signin');
  }

  return (
    <header className="sticky top-0 z-40 flex w-full flex-col gap-4 bg-white/70 px-6 py-5 shadow-[0_4px_20px_rgba(0,73,197,0.04)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between md:px-12">
      <form
        className="max-w-md flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          setNotice(query ? `Filtered insights for "${query}"` : 'Search cleared');
        }}
      >
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-outline" />
          <input
            className="w-full rounded-full border border-outline-variant/20 bg-surface-container-lowest py-3 pl-12 pr-4 font-body text-sm text-on-surface shadow-[0_4px_20px_rgba(0,73,197,0.04)] transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-fixed"
            placeholder="Search insights..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </form>

      <div className="flex flex-wrap items-center gap-3 md:ml-auto">
        {notice ? <span className="rounded-full bg-primary-fixed px-3 py-2 text-xs font-semibold text-on-primary-fixed">{notice}</span> : null}
        <IconButton label="Help" onClick={() => router.push('/help-center')}>
          <HelpCircle className="h-5 w-5" />
        </IconButton>
        <div className="relative">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface font-bold text-white ring-2 ring-surface-container-lowest"
          >
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </button>
          {profileOpen ? (
            <div className="shadow-ambient absolute right-0 mt-3 w-64 overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2">
              <div className="px-3 py-3">
                <p className="truncate text-sm font-bold text-on-surface">{user.name ?? 'JobTrackr user'}</p>
                <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
              </div>
              <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container">
                <Settings className="h-4 w-4 text-primary" /> Settings
              </Link>
              <Link href="/help-center" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container">
                <UserCircle className="h-4 w-4 text-primary" /> Help Center
              </Link>
              <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-error hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

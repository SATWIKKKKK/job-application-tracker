'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HelpCircle, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import type { SessionUser } from '../lib/auth';
import { API_URL } from '../lib/config';

export function MarketingAuthActions({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
    document.cookie = 'jt_token=; Path=/; Max-Age=0; SameSite=Lax';
    router.push('/auth/signin');
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 md:gap-4">
        <Link href="/auth/signin" className="font-body text-sm font-medium text-primary hover:text-primary-container">
          Login
        </Link>
        <Link
          href="/auth/signin"
          className="hero-gradient rounded-full px-5 py-3 font-body text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,73,197,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,73,197,0.25)] active:scale-95 md:px-7"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface font-bold text-white ring-2 ring-surface-container-lowest"
      >
        {(user.name ?? user.email).slice(0, 2).toUpperCase()}
      </button>
      {open ? (
        <div className="shadow-ambient absolute right-0 mt-3 w-64 overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2">
          <div className="px-3 py-3">
            <p className="truncate text-sm font-bold text-on-surface">{user.name ?? 'JobTrackr user'}</p>
            <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container">
            <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container">
            <Settings className="h-4 w-4 text-primary" /> Settings
          </Link>
          <Link href="/help-center" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container">
            <HelpCircle className="h-4 w-4 text-primary" /> Help Center
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-error hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Bell, HelpCircle, MessageSquare, Search, Sparkles } from 'lucide-react';
import type { User } from '@jobtrackr/types';

export function DashboardTopBar({ user }: { user: User }) {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

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
        <IconButton label="Notifications" onClick={() => setNotice('No new notifications')}>
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </IconButton>
        <IconButton label="Messages" onClick={() => setNotice('Messages are all caught up')}>
          <MessageSquare className="h-5 w-5" />
        </IconButton>
        <IconButton label="Help" onClick={() => setNotice('Help center coming soon')}>
          <HelpCircle className="h-5 w-5" />
        </IconButton>
        <button
          type="button"
          onClick={() => setNotice('Insight generated from your latest application activity')}
          className="hero-gradient flex items-center gap-2 rounded-full px-5 py-3 font-headline text-sm font-bold tracking-tight text-on-primary transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <Sparkles className="h-4 w-4" /> Generate Insight
        </button>
        <button
          type="button"
          aria-label="Open profile menu"
          onClick={() => setNotice('Profile menu ready')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface font-bold text-white ring-2 ring-surface-container-lowest"
        >
          {(user.name ?? user.email).slice(0, 2).toUpperCase()}
        </button>
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

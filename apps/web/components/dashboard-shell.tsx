'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, LayoutDashboard, ListChecks } from 'lucide-react';
import type { User } from '../lib/types';
import { DashboardTopBar } from './dashboard-actions';

const nav = [
  [LayoutDashboard, 'Dashboard', '/dashboard'],
  [ListChecks, 'Applications', '/dashboard/applications'],
  [Activity, 'Heatmap', '/dashboard/heatmap'],
] as const;

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <aside className={`fixed left-0 top-0 z-50 hidden h-screen flex-col gap-y-8 bg-slate-50 p-5 shadow-[0_10px_40px_rgba(25,28,32,0.06)] transition-all duration-300 lg:flex ${collapsed ? 'w-24' : 'w-72'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4'}`}>
          <Link href="/" className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-xs font-bold text-on-primary">
            JT
          </Link>
          {!collapsed ? <Link href="/" className="font-headline text-2xl font-black tracking-tight text-blue-900">JobTrackr</Link> : null}
        </div>

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-4 top-24 flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest text-primary shadow-sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className="mt-6 flex flex-grow flex-col gap-2">
          {nav.map(([Icon, label, href]) => (
            <Link
              key={label}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl p-3 font-headline text-sm transition-all duration-300 ${collapsed ? 'justify-center' : 'gap-3'} ${
                pathname === href
                  ? 'bg-primary-fixed/40 font-bold text-blue-700'
                  : 'font-medium text-slate-500 hover:translate-x-1 hover:text-blue-800'
              }`}
            >
              <Icon size={20} /> {!collapsed ? <span>{label}</span> : null}
            </Link>
          ))}
        </nav>

        {!collapsed ? <div className="mt-auto border-t border-slate-100 pt-6 text-xs font-semibold text-on-surface-variant">
          Automatic application tracking
        </div> : null}
      </aside>
      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-24' : 'lg:ml-72'}`}>
        <DashboardTopBar user={user} />
        <main className="flex flex-col gap-10 p-6 md:p-12">{children}</main>
      </div>
    </div>
  );
}

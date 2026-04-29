import Link from 'next/link';
import { Cloud, FileText, LayoutDashboard, LogOut, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import type { User } from '@jobtrackr/types';
import { DashboardTopBar } from './dashboard-actions';

const nav = [
  [LayoutDashboard, 'Dashboard', '/dashboard'],
  [Sparkles, 'Market Insights', '/dashboard?panel=insights'],
  [Workflow, 'Pipeline Analytics', '/dashboard?panel=pipeline'],
  [Users, 'Talent Pool', '/dashboard?panel=talent'],
  [FileText, 'Strategic Reports', '/dashboard?panel=reports'],
] as const;

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 flex-col gap-y-8 bg-slate-50 p-10 shadow-[0_10px_40px_rgba(25,28,32,0.06)] lg:flex">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-xs font-bold text-on-primary">
            JT
          </Link>
          <div>
            <h1 className="font-headline text-2xl font-black tracking-[-0.05em] text-blue-900">JobTrackr</h1>
            <p className="text-xs font-medium text-on-surface-variant">Enterprise Suite</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-grow flex-col gap-2">
          {nav.map(([Icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl p-3 font-headline text-sm transition-all duration-300 ${
                label === 'Dashboard'
                  ? 'bg-primary-fixed/40 font-bold text-blue-700'
                  : 'font-medium text-slate-500 hover:translate-x-1 hover:text-blue-800'
              }`}
            >
              <Icon size={20} /> <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-6">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
          >
            <Cloud className="h-4 w-4" /> System Status
          </Link>
          <Link href="/dashboard?panel=security" className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-800">
            <ShieldCheck className="h-5 w-5" /> Security
          </Link>
          <Link href="/auth/signin" className="flex items-center gap-3 rounded-xl p-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-800">
            <LogOut className="h-5 w-5" /> Log Out
          </Link>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col lg:ml-72">
        <DashboardTopBar user={user} />
        <main className="flex flex-col gap-10 p-6 md:p-12">{children}</main>
      </div>
    </div>
  );
}

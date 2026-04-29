import Link from 'next/link';
import { BarChart3, CreditCard, FileSpreadsheet, LayoutDashboard, Settings, ToggleLeft } from 'lucide-react';
import type { User } from '@jobtrackr/types';

const nav = [
  [LayoutDashboard, 'Dashboard', '/dashboard'],
  [BarChart3, 'Applications', '/dashboard'],
  [ToggleLeft, 'Portals', '/dashboard/portals'],
  [FileSpreadsheet, 'Sheet', '/dashboard'],
  [CreditCard, 'Billing', '/pricing'],
  [Settings, 'Settings', '/dashboard'],
] as const;

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-outline-variant bg-white p-6 lg:block">
        <Link href="/" className="font-headline text-2xl font-extrabold text-primary">
          JobTrackr
        </Link>
        <nav className="mt-10 space-y-2">
          {nav.map(([Icon, label, href]) => (
            <Link key={label} href={href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-semibold text-on-surface-variant hover:bg-surface-container-low">
              <Icon size={20} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-outline-variant bg-white/95 px-8">
          <div>
            <div className="text-sm text-on-surface-variant">Welcome back</div>
            <div className="font-headline text-2xl font-bold">{user.name ?? user.email}</div>
          </div>
          {user.plan === 'free' ? (
            <Link href="/pricing" className="rounded-full bg-primary px-6 py-3 font-bold text-white">
              Upgrade
            </Link>
          ) : null}
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

import { Settings } from 'lucide-react';
import type { User } from '../../../lib/types';
import { DashboardShell } from '../../../components/dashboard-shell';
import { apiFetch } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { user } = await apiFetch<{ user: User }>('/api/me');

  return (
    <DashboardShell user={user}>
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Settings</h1>
        </div>
        <div className="shadow-ambient rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Profile</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Name</p>
              <p className="mt-1 font-semibold text-on-surface">{user.name ?? 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Email</p>
              <p className="mt-1 font-semibold text-on-surface">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Plan</p>
              <p className="mt-1 font-semibold capitalize text-on-surface">{user.plan}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Gmail</p>
              <p className="mt-1 font-semibold text-on-surface">{user.gmail_connected ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

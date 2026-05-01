import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { JobApplication, User } from '../../../lib/types';
import { DashboardShell } from '../../../components/dashboard-shell';
import { apiFetch } from '../../../lib/api';
import { SUPPORTED_PORTALS } from '../../../lib/portals';

export const dynamic = 'force-dynamic';

export default async function PortalsPage() {
  const [{ user }, apps] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<{ data: JobApplication[] }>('/api/applications?page_size=100'),
  ]);
  const used = new Set(apps.data.map((app) => app.portal));

  return (
    <DashboardShell user={user}>
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-extrabold tracking-[-0.03em]">Portals</h1>
        <p className="mt-2 text-on-surface-variant">Enable auto-logging for the job sites you use most.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {SUPPORTED_PORTALS.map((portal, index) => {
          const locked = user.plan === 'free' && index >= 3;
          return (
            <div key={portal} className="shadow-ambient relative rounded-xl border border-outline-variant/30 bg-white p-6">
              <div className="font-headline text-lg font-bold">{portal}</div>
              <div className="mt-2 text-sm text-on-surface-variant">{used.has(portal) ? 'Connected' : 'Ready to connect'}</div>
              <label className="mt-6 flex items-center justify-between">
                <span className="font-semibold">Auto-logging</span>
                <input type="checkbox" disabled={locked} defaultChecked={!locked} className="h-5 w-5 accent-primary" />
              </label>
              {locked ? (
                <Link href="/pricing" className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/85 text-center backdrop-blur-sm">
                  <Lock className="text-primary" />
                  <div className="mt-3 font-bold">Upgrade to unlock</div>
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}

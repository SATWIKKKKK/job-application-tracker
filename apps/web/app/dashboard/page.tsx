import Link from 'next/link';
import { Activity, BarChart3, BriefcaseBusiness, CalendarClock, Layers3 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { User } from '../../lib/types';
import { DashboardConnectionUX } from '../../components/dashboard-connection-ux';
import { DashboardLoadingGate } from '../../components/dashboard-loading-gate';
import { DashboardShell } from '../../components/dashboard-shell';
import { apiFetch } from '../../lib/api';

export const dynamic = 'force-dynamic';

type DashboardStats = {
  total_applications: number;
  this_week: number;
  portals_active: number;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { oauth?: string };
}) {
  const [{ user }, stats] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<DashboardStats>('/api/applications/stats'),
  ]);

  return (
    <DashboardShell user={user}>
      <DashboardLoadingGate label="Loading dashboard">
      <div className="space-y-8">
        <section className="space-y-4">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
            Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant">
            Automatic tracking is primary. Manual logging stays available as a backup on the applications page.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              label="Total Applications"
              value={stats.total_applications}
            />
            <StatCard
              icon={<CalendarClock className="h-5 w-5" />}
              label="This Week"
              value={stats.this_week}
            />
            <StatCard
              icon={<Layers3 className="h-5 w-5" />}
              label="Portals Active"
              value={stats.portals_active}
            />
          </div>
          <div>
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <BarChart3 className="h-4 w-4 text-primary" />
              See All Applications
            </Link>
            <Link
              href="/dashboard/heatmap"
              className="ml-3 inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <Activity className="h-4 w-4 text-primary" />
              View Heatmap
            </Link>
          </div>
        </section>

        <DashboardConnectionUX user={user} oauthJustCompleted={searchParams?.oauth === 'google'} />
      </div>
      </DashboardLoadingGate>
    </DashboardShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="shadow-ambient rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed/50 text-primary">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-headline text-3xl font-bold text-on-surface">{value.toLocaleString()}</p>
    </div>
  );
}

import type { JobApplication, User } from '@jobtrackr/types';
import { ApplicationsTable } from '../../components/applications-table';
import { DashboardShell } from '../../components/dashboard-shell';
import { apiFetch } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [{ user }, apps] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<{ data: JobApplication[]; total: number }>('/api/applications?page_size=50'),
  ]);
  const applications = apps.data;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const appliedThisWeek = applications.filter((app) => new Date(app.applied_at).getTime() >= weekAgo).length;
  const portals = new Set(applications.map((app) => app.portal)).size;

  return (
    <DashboardShell user={user}>
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Stat title="Total Applications" value={apps.total} />
        <Stat title="Applied This Week" value={appliedThisWeek} />
        <Stat title="Portals Connected" value={portals} />
      </div>
      <ApplicationsTable applications={applications} />
    </DashboardShell>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-white p-6">
      <div className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">{title}</div>
      <div className="mt-4 font-headline text-4xl font-extrabold">{value}</div>
    </div>
  );
}

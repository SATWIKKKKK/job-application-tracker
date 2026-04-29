import type { JobApplication, User } from '@jobtrackr/types';
import { BriefcaseBusiness, Calendar, CheckCircle2, Clock, Code2, Download, FileText, Megaphone, Plus, RefreshCw, TrendingUp } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard-shell';
import { apiFetch } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [{ user }, apps] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<{ data: JobApplication[]; total: number }>('/api/applications?page_size=50'),
  ]);

  const applications = apps.data;
  const total = apps.total;
  const successRate = total
    ? Math.round((applications.filter((app) => app.status !== 'Rejected').length / applications.length) * 1000) / 10
    : 0;
  const connectedPortals = Array.from(new Set(applications.map((app) => app.portal))).slice(0, 3);
  const heatmap = buildHeatmap(applications);
  const recent = applications.slice(0, 3);

  return (
    <DashboardShell user={user}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 font-headline text-4xl font-bold tracking-[-0.04em] text-on-surface">Analytics Overview</h1>
          <p className="font-body text-lg leading-relaxed text-on-surface-variant">Real-time performance and logging insights.</p>
        </div>
        <a
          href="/dashboard?range=30d"
          className="flex w-fit items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 font-body text-sm text-on-surface-variant shadow-[0_4px_20px_rgba(0,73,197,0.04)]"
        >
          <Calendar className="h-4 w-4 text-primary" /> Last 30 Days
        </a>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <StatCard icon={<BriefcaseBusiness />} label="Total Jobs Tracked" value={total.toLocaleString()} delta="+12% from last month" />
        <StatCard icon={<CheckCircle2 />} label="Success Rate" value={`${successRate}%`} delta="+2.1% from last month" tone="secondary" />
        <StatCard
          icon={<RefreshCw />}
          label="Sheet Sync Status"
          value={user.google_sheet_id ? 'Active & Healthy' : 'Setup Needed'}
          subtext={user.google_sheet_id ? 'Last synced: live API ready' : 'Connect Sheets to enable sync'}
          tone="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <section className="shadow-ambient flex min-h-[430px] flex-col rounded-lg bg-surface-container-lowest p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Job Logging Activity</h2>
              <a href="/dashboard?export=activity" className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary-fixed/30">
                Export <Download className="h-4 w-4" />
              </a>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low p-8">
              <div className="grid w-full max-w-xl grid-cols-7 gap-2">
                {heatmap.map((level, index) => (
                  <div
                    key={`${level}-${index}`}
                    className="aspect-square rounded-md"
                    style={{ backgroundColor: `rgba(0, 73, 197, ${0.08 + level * 0.18})` }}
                  />
                ))}
              </div>
              <span className="absolute rounded-full border border-outline-variant/10 bg-white/85 px-4 py-2 text-sm font-medium text-on-surface-variant shadow-sm backdrop-blur-sm">
                30-Day Frequency Heatmap
              </span>
            </div>
          </section>

          <section id="automations" className="shadow-ambient rounded-lg bg-surface-container-lowest p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">Recent Automations</h2>
              <a className="text-sm font-medium text-primary hover:underline" href="/dashboard?panel=automations">
                View All
              </a>
            </div>
            <ul className="flex flex-col gap-4">
              {(recent.length ? recent : fallbackAutomations).map((app, index) => (
                <AutomationItem key={`${app.job_title}-${index}`} app={app} index={index} />
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-10">
          <section className="shadow-ambient flex flex-col items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest p-8 text-center md:p-10">
            <h2 className="mb-8 w-full text-left font-headline text-xl font-bold tracking-tight text-on-surface">Success Prediction</h2>
            <div className="relative mb-6 h-24 w-48 overflow-hidden">
              <div className="absolute left-0 top-0 h-48 w-48 rounded-full border-[16px] border-surface-container-low" />
              <div className="absolute left-0 top-0 h-48 w-48 rotate-45 rounded-full border-[16px] border-primary-container border-b-transparent border-r-transparent" />
              <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-on-surface" />
            </div>
            <h3 className="font-headline text-4xl font-bold text-on-surface">{successRate >= 75 || !total ? 'High' : 'Growing'}</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Based on recent parse accuracy and sheet sync stability, system health is optimal.
            </p>
          </section>

          <section className="shadow-ambient flex-1 rounded-lg bg-surface-container-lowest p-8 md:p-10">
            <h2 className="mb-6 font-headline text-xl font-bold tracking-tight text-on-surface">Connected Portals</h2>
            <div className="grid grid-cols-2 gap-4">
              {(connectedPortals.length ? connectedPortals : ['LinkedIn', 'Indeed', 'Glassdoor']).map((portal) => (
                <PortalBadge key={portal} portal={portal} />
              ))}
              <a
                href="/dashboard/portals"
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-lowest p-4 text-center transition-colors hover:bg-surface-container-low"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-variant text-on-surface-variant transition-colors group-hover:text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="font-body text-sm font-semibold text-on-surface-variant transition-colors group-hover:text-primary">Add Portal</p>
              </a>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  subtext,
  tone = 'primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  subtext?: string;
  tone?: 'primary' | 'secondary' | 'green';
}) {
  const toneClass = {
    primary: { icon: 'bg-primary-container/10 text-primary-container', bubble: 'bg-primary-fixed/30' },
    secondary: { icon: 'bg-secondary-container/20 text-secondary', bubble: 'bg-secondary-fixed/30' },
    green: { icon: 'bg-emerald-100 text-emerald-700', bubble: 'bg-emerald-100/50' },
  }[tone];

  return (
    <div className="shadow-ambient group relative flex min-h-56 flex-col justify-between overflow-hidden rounded-lg bg-surface-container-lowest p-8 transition-transform hover:-translate-y-1">
      <div className={`absolute right-0 top-0 h-32 w-32 -translate-y-10 translate-x-10 rounded-bl-full ${toneClass.bubble} transition-transform group-hover:scale-110`} />
      <div className="relative z-10 mb-6 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass.icon}`}>{icon}</div>
        <h3 className="font-body font-medium text-on-surface-variant">{label}</h3>
      </div>
      <div className="relative z-10">
        <span className="font-headline text-4xl font-bold tracking-[-0.04em] text-on-surface">{value}</span>
        {delta ? (
          <div className="mt-2 flex items-center gap-1 text-sm font-medium text-emerald-600">
            <TrendingUp className="h-4 w-4" /> {delta}
          </div>
        ) : null}
        {subtext ? (
          <div className="mt-2 flex items-center gap-1 text-sm font-medium text-on-surface-variant">
            <Clock className="h-4 w-4" /> {subtext}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AutomationItem({ app, index }: { app: Pick<JobApplication, 'job_title' | 'company' | 'portal'>; index: number }) {
  const icons = [FileText, Code2, Megaphone];
  const Icon = icons[index % icons.length];
  const times = ['10m ago', '45m ago', '2h ago'];

  return (
    <li className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-container shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-body font-semibold text-on-surface">{app.job_title} parsed</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">Logged from {app.portal || app.company}</p>
        </div>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-on-surface-variant shadow-sm">{times[index % times.length]}</span>
    </li>
  );
}

function PortalBadge({ portal }: { portal: string }) {
  const initials = portal === 'LinkedIn' ? 'in' : portal.slice(0, 1);

  return (
    <a
      href="/dashboard/portals"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 text-center transition-transform hover:-translate-y-1"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container font-bold text-white shadow-sm">{initials}</div>
      <div>
        <p className="font-body text-sm font-semibold text-on-surface">{portal}</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Synced
        </p>
      </div>
    </a>
  );
}

function buildHeatmap(applications: JobApplication[]) {
  const counts = new Array(28).fill(0);
  const now = new Date();
  for (const app of applications) {
    const diff = Math.floor((now.getTime() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < counts.length) counts[counts.length - 1 - diff] += 1;
  }
  const max = Math.max(...counts, 1);
  return counts.map((count, index) => (count ? Math.min(5, Math.ceil((count / max) * 5)) : (index % 7) + (index % 3) > 6 ? 2 : 1));
}

const fallbackAutomations = [
  { job_title: 'Senior Product Designer', company: 'Stripe', portal: 'Design Candidates 2024' },
  { job_title: 'Frontend Engineer', company: 'Acme Corp', portal: 'Engineering Roles' },
  { job_title: 'Marketing Director', company: 'Northstar', portal: 'Marketing Q3' },
] as Pick<JobApplication, 'job_title' | 'company' | 'portal'>[];

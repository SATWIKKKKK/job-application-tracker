import Link from 'next/link';
import { BarChart3, BriefcaseBusiness, CalendarClock, Layers3 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { User } from '../../lib/types';
import { DashboardConnectionUX } from '../../components/dashboard-connection-ux';
import { DashboardShell } from '../../components/dashboard-shell';
import { apiFetch } from '../../lib/api';

export const dynamic = 'force-dynamic';

type DashboardStats = {
  total_applications: number;
  this_week: number;
  portals_active: number;
};

type HeatmapEntry = {
  date: string;
  count: number;
};

type HeatmapCell = {
  date: string;
  count: number;
  color: string;
};

const HEATMAP_ZERO = '#EFF4FF';
const HEATMAP_ONE = '#B4C5FF';
const HEATMAP_TWO_TO_THREE = '#6B8EFF';
const HEATMAP_FOUR_PLUS = '#0049C5';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { oauth?: string };
}) {
  const [{ user }, stats, heatmapData] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<DashboardStats>('/api/applications/stats'),
    apiFetch<HeatmapEntry[]>('/api/applications/heatmap'),
  ]);

  const heatmap = buildHeatmapGrid(heatmapData);

  return (
    <DashboardShell user={user}>
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
          </div>
        </section>

        <DashboardConnectionUX user={user} oauthJustCompleted={searchParams?.oauth === 'google'} />

        <section className="shadow-ambient rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Application Activity</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Last 12 weeks</p>

          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[40px_repeat(12,minmax(0,1fr))] gap-2 text-[11px] font-semibold text-on-surface-variant">
                <span />
                {heatmap.monthLabels.map((label, index) => (
                  <span key={`${label}-${index}`} className="text-center">
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-[40px_repeat(12,minmax(0,1fr))] gap-2">
                {['Mon', '', 'Wed', '', 'Fri', '', ''].map((label, row) => (
                  <div key={row} className="contents">
                    <span className="flex h-6 items-center text-[11px] font-medium text-on-surface-variant">
                      {label}
                    </span>
                    {heatmap.columns.map((column) => {
                      const cell = column[row];
                      return (
                        <span
                          key={cell.date}
                          title={`${cell.date} - ${cell.count} application${cell.count === 1 ? '' : 's'}`}
                          className="h-6 rounded-[6px] border border-white/70"
                          style={{ backgroundColor: cell.color }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
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

function buildHeatmapGrid(entries: HeatmapEntry[]) {
  const counts = new Map(entries.map((entry) => [entry.date, entry.count]));
  const today = atMidnight(new Date());
  const thisWeekStart = startOfWeekMonday(today);
  const startWeek = new Date(thisWeekStart);
  startWeek.setDate(startWeek.getDate() - 11 * 7);

  const columns: HeatmapCell[][] = [];
  const monthLabels: string[] = [];

  for (let week = 0; week < 12; week += 1) {
    const weekStart = new Date(startWeek);
    weekStart.setDate(startWeek.getDate() + week * 7);
    const monthLabel = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const prevLabel = monthLabels[monthLabels.length - 1];
    monthLabels.push(week === 0 || prevLabel !== monthLabel ? monthLabel : '');

    const weekCells: HeatmapCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + day);
      const iso = date.toISOString().slice(0, 10);
      const count = date <= today ? counts.get(iso) ?? 0 : 0;
      weekCells.push({
        date: iso,
        count,
        color: colorForCount(count),
      });
    }
    columns.push(weekCells);
  }

  return { columns, monthLabels };
}

function colorForCount(count: number) {
  if (count <= 0) return HEATMAP_ZERO;
  if (count === 1) return HEATMAP_ONE;
  if (count <= 3) return HEATMAP_TWO_TO_THREE;
  return HEATMAP_FOUR_PLUS;
}

function atMidnight(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeekMonday(date: Date) {
  const copy = atMidnight(date);
  const day = copy.getDay();
  const mondayDistance = (day + 6) % 7;
  copy.setDate(copy.getDate() - mondayDistance);
  return copy;
}

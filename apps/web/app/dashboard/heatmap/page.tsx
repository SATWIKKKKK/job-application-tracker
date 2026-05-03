import type { JobApplication, User } from '../../../lib/types';
import { ApplicationsResultsTable } from '../../../components/applications-results-table';
import { DashboardLoadingGate } from '../../../components/dashboard-loading-gate';
import { DashboardShell } from '../../../components/dashboard-shell';
import { HeatmapClient } from '../../../components/heatmap-client';
import { apiFetch } from '../../../lib/api';

export const dynamic = 'force-dynamic';

type HeatmapEntry = {
  date: string;
  count: number;
};

type ApplicationsResponse = {
  data: JobApplication[];
  page: number;
  page_size: number;
  total: number;
  q?: string;
  date?: string;
};

const HEATMAP_ZERO = '#EFF4FF';
const HEATMAP_ONE = '#B4C5FF';
const HEATMAP_TWO_TO_THREE = '#6B8EFF';
const HEATMAP_FOUR_PLUS = '#0049C5';

export default async function HeatmapPage({
  searchParams,
}: {
  searchParams?: { range?: string; date?: string };
}) {
  const range = normalizeHeatmapDays(searchParams?.range);
  const selectedDate = normalizeSelectedDate(searchParams?.date);
  const query = new URLSearchParams({ page: '1', page_size: '100' });
  if (selectedDate) query.set('date', selectedDate);

  const [{ user }, heatmapData, applications] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<HeatmapEntry[]>(`/api/applications/heatmap?days=${range}`),
    selectedDate
      ? apiFetch<ApplicationsResponse>(`/api/applications?${query.toString()}`)
      : Promise.resolve({ data: [], page: 1, page_size: 100, total: 0 } as ApplicationsResponse),
  ]);

  const cells = buildExactHeatmapCells(heatmapData, range);
  const selectedRows = selectedDate
    ? applications.data.filter((app) => formatIsoDate(new Date(app.applied_at)) === selectedDate)
    : [];

  return (
    <DashboardShell user={user}>
      <DashboardLoadingGate label="Loading heatmap">
        <div className="space-y-8">
          <HeatmapClient
            cells={cells}
            range={range}
            selectedDate={selectedDate}
            todayLabel={formatDisplayDate(new Date())}
          />

          <section id="heatmap-applications" className="shadow-ambient rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
            <div className="border-b border-outline-variant/20 p-5">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {selectedDate ? `Applications on ${formatDisplayDate(parseLocalDate(selectedDate))}` : 'Select a date'}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {selectedDate ? `${selectedRows.length.toLocaleString()} record${selectedRows.length === 1 ? '' : 's'}` : 'Click a heatmap date to view applications.'}
              </p>
            </div>
            <ApplicationsResultsTable
              rows={selectedRows}
              emptyText={selectedDate ? 'No applications found for this date.' : 'Choose a date with activity to see application details.'}
            />
          </section>
        </div>
      </DashboardLoadingGate>
    </DashboardShell>
  );
}

function buildExactHeatmapCells(entries: HeatmapEntry[], days: number) {
  const counts = new Map(entries.map((entry) => [entry.date, entry.count]));
  const today = atMidnight(new Date());
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = formatIsoDate(date);
    const count = counts.get(iso) ?? 0;
    return {
      date: iso,
      count,
      color: colorForCount(count),
      label: date.getDate() <= 7 || index === 0 ? date.toLocaleDateString('en-US', { month: 'short' }) : '',
    };
  });
}

function colorForCount(count: number) {
  if (count <= 0) return HEATMAP_ZERO;
  if (count === 1) return HEATMAP_ONE;
  if (count <= 3) return HEATMAP_TWO_TO_THREE;
  return HEATMAP_FOUR_PLUS;
}

function normalizeHeatmapDays(range: string | undefined) {
  const parsed = Number(range ?? 90);
  if (parsed === 15 || parsed === 30 || parsed === 60 || parsed === 90) return parsed;
  return 90;
}

function normalizeSelectedDate(date: string | undefined) {
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function atMidnight(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

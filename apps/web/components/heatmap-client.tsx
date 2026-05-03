'use client';

import { useRouter } from 'next/navigation';

type HeatmapCell = {
  date: string;
  count: number;
  color: string;
  label: string;
};

export function HeatmapClient({
  cells,
  range,
  selectedDate,
  todayLabel,
}: {
  cells: HeatmapCell[];
  range: number;
  selectedDate: string;
  todayLabel: string;
}) {
  const router = useRouter();
  const columns = Math.ceil(cells.length / 7);
  const cellWidth = range === 90 ? 34 : range === 60 ? 42 : range === 30 ? 52 : 62;
  const cellHeight = range === 90 ? 22 : 24;
  const gap = range === 90 ? 6 : 8;
  const labelWidth = 34;
  const template = `${labelWidth}px repeat(${columns}, ${cellWidth}px)`;

  function selectDate(date: string, count: number) {
    router.push(`/dashboard/heatmap?range=${range}&date=${date}`);
    if (count > 0) {
      window.setTimeout(() => {
        document.getElementById('heatmap-applications')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }

  return (
    <section className="shadow-ambient rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight text-on-surface">Application Activity</h1>
          <p className="mt-2 text-base text-on-surface-variant">Includes every day through {todayLabel}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {([
            [15, 'Last 15 days'],
            [30, 'Last 30 days'],
            [60, 'Last 2 months'],
            [90, 'Last 3 months'],
          ] as const).map(([days, label]) => (
            <button
              key={days}
              type="button"
              onClick={() => router.push(`/dashboard/heatmap?range=${days}`)}
              className={`rounded-full px-5 py-3 text-sm font-bold transition-colors ${
                range === days ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="w-max max-w-full">
          <div className="grid" style={{ gridTemplateColumns: template, gap }}>
            <span />
            {Array.from({ length: columns }).map((_, index) => {
              const cell = cells[index * 7];
              return (
                <span key={index} className="text-center text-xs font-bold text-on-surface-variant">
                  {cell?.label ?? ''}
                </span>
              );
            })}
          </div>

          <div
            className="mt-3 grid grid-flow-col grid-rows-7 gap-3"
            style={{ gridTemplateColumns: template, gap }}
          >
            {['Mon', '', 'Wed', '', 'Fri', '', ''].map((label, index) => (
              <span key={`label-${index}`} className="flex items-center text-xs font-medium text-on-surface-variant" style={{ height: cellHeight }}>
                {label}
              </span>
            ))}
            {cells.map((cell) => (
              <button
                key={cell.date}
                type="button"
                title={`${cell.date} - ${cell.count} application${cell.count === 1 ? '' : 's'}`}
                aria-label={`${cell.date}, ${cell.count} applications`}
                onClick={() => selectDate(cell.date, cell.count)}
                className={`rounded-md border border-white/70 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                  selectedDate === cell.date ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{ backgroundColor: cell.color, width: cellWidth, height: cellHeight }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

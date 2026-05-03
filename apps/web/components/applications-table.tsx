'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, Globe2, Plus, Tags } from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../lib/types';
import { withBrowserAuth } from '../lib/browser-auth';
import { API_URL } from '../lib/config';
import { SUPPORTED_PORTALS } from '../lib/portals';

const statusClass: Record<string, string> = {
  Applied: 'bg-[#D6E2FF] text-primary',
  Saved: 'bg-[#BBDEFB] text-[#002b6f]',
  Shortlisted: 'bg-[#FFF9C4] text-yellow-900',
  Rejected: 'bg-red-100 text-error',
  Accepted: 'bg-[#C8E6C9] text-green-900',
  Interview: 'bg-[#FFF9C4] text-yellow-900',
  Offer: 'bg-[#C8E6C9] text-green-900',
  Unknown: 'bg-surface-container text-on-surface-variant',
};

const statuses: ApplicationStatus[] = ['Applied', 'Saved', 'Shortlisted', 'Rejected', 'Accepted'];
const roleTypes = ['Full Time', 'Part Time', 'Internship', 'Contract', 'Stipend Based'];
const manualPortals = [...SUPPORTED_PORTALS, 'Other'];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ApplicationsTable({ applications }: { applications: JobApplication[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rows, setRows] = useState(applications);
  const [portalFilter, setPortalFilter] = useState('All');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMessage, setManualMessage] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualForm, setManualForm] = useState({
    job_title: '',
    company: '',
    role_type: 'Full Time',
    portal: 'LinkedIn',
    applied_at: todayInputValue(),
    status: 'Applied',
  });
  const portals = useMemo(() => ['All', ...Array.from(new Set(rows.map((row) => row.portal)))], [rows]);
  const filteredRows = useMemo(
    () => (portalFilter === 'All' ? rows : rows.filter((row) => row.portal === portalFilter)),
    [portalFilter, rows],
  );

  async function updateStatus(app: JobApplication, status: ApplicationStatus) {
    setRows((current) => current.map((item) => (item.id === app.id ? { ...item, status } : item)));
    const response = await fetch(`${API_URL}/api/applications/${app.id}/status`, {
      ...withBrowserAuth({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    });
    if (!response.ok) {
      setRows((current) => current.map((item) => (item.id === app.id ? app : item)));
    }
  }

  async function submitManualApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualLoading(true);
    setManualMessage('');
    setManualError('');
    try {
      const response = await fetch(`${API_URL}/api/applications/manual`, {
        ...withBrowserAuth({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(manualForm),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setManualError(data.message ?? 'Could not log application');
        return;
      }
      setRows((current) => [data.application, ...current]);
      setManualMessage('Application logged to your Sheet');
      setManualForm({
        job_title: '',
        company: '',
        role_type: 'Full Time',
        portal: 'LinkedIn',
        applied_at: todayInputValue(),
        status: 'Applied',
      });
    } finally {
      setManualLoading(false);
    }
  }

  function updateManualForm(field: keyof typeof manualForm, value: string) {
    setManualForm((current) => ({ ...current, [field]: value }));
  }

  const columns = useMemo<ColumnDef<JobApplication>[]>(
    () => [
      { accessorKey: 'job_title', header: 'Job Title' },
      { accessorKey: 'company', header: 'Company' },
      { accessorKey: 'role_type', header: 'Role Type' },
      {
        accessorKey: 'portal',
        header: 'Portal',
        cell: ({ getValue }) => <span className="rounded-full bg-surface-container px-3 py-1 font-semibold">{String(getValue())}</span>,
      },
      {
        accessorKey: 'applied_at',
        header: 'Date Applied',
        cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString(),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const app = row.original;
          return (
            <select
              className={`rounded-full border-0 px-3 py-1 text-sm font-bold ${statusClass[app.status]}`}
              value={app.status}
              onChange={(event) => updateStatus(app, event.target.value as ApplicationStatus)}
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-outline-variant/30 bg-white shadow-ambient">
        <div className="flex flex-col gap-3 border-b border-outline-variant/30 p-5 md:flex-row md:items-center md:justify-between">
          <h2 className="font-headline text-xl font-bold">Applications</h2>
          <select className="rounded-full border border-outline-variant/40 px-4 py-2 text-sm" value={portalFilter} onChange={(event) => setPortalFilter(event.target.value)}>
            {portals.map((portal) => (
              <option key={portal}>{portal}</option>
            ))}
          </select>
        </div>
        <table className="w-full min-w-[800px]">
          <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-5 py-4">
                    <button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}</button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-sm">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-outline-variant">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <button
          type="button"
          onClick={() => setManualOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <div>
            <h3 className="font-headline text-base font-bold text-on-surface">Add Application Manually</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Backup logging for applications that do not send a trackable confirmation email.</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
            {manualOpen ? <ChevronDown className="h-5 w-5 rotate-180" /> : <Plus className="h-5 w-5" />}
          </span>
        </button>

        {manualOpen ? (
          <form className="border-t border-outline-variant/30 p-5" onSubmit={submitManualApplication}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ManualField icon={<BriefcaseBusiness />} label="Job Title">
                <input className="manual-input" value={manualForm.job_title} onChange={(event) => updateManualForm('job_title', event.target.value)} required />
              </ManualField>
              <ManualField icon={<Building2 />} label="Company">
                <input className="manual-input" value={manualForm.company} onChange={(event) => updateManualForm('company', event.target.value)} required />
              </ManualField>
              <ManualField icon={<Tags />} label="Role Type">
                <select className="manual-input" value={manualForm.role_type} onChange={(event) => updateManualForm('role_type', event.target.value)}>
                  {roleTypes.map((roleType) => (
                    <option key={roleType}>{roleType}</option>
                  ))}
                </select>
              </ManualField>
              <ManualField icon={<Globe2 />} label="Portal">
                <select className="manual-input" value={manualForm.portal} onChange={(event) => updateManualForm('portal', event.target.value)}>
                  {manualPortals.map((portal) => (
                    <option key={portal}>{portal}</option>
                  ))}
                </select>
              </ManualField>
              <ManualField icon={<CalendarDays />} label="Applied Date">
                <input className="manual-input" type="date" value={manualForm.applied_at} onChange={(event) => updateManualForm('applied_at', event.target.value)} required />
              </ManualField>
              <ManualField icon={<BadgeCheck />} label="Status">
                <select className="manual-input" value={manualForm.status} onChange={(event) => updateManualForm('status', event.target.value)}>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </ManualField>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm">
                {manualMessage ? <span className="font-semibold text-emerald-700">{manualMessage}</span> : null}
                {manualError ? <span className="font-semibold text-error">{manualError}</span> : null}
              </div>
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full rounded-full bg-surface-container-high px-6 py-3 font-headline text-sm font-bold text-on-surface transition-colors hover:bg-primary-fixed disabled:opacity-60 md:w-auto"
              >
                {manualLoading ? 'Logging...' : 'Log Application'}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function ManualField({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        <span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

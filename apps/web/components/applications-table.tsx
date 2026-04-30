'use client';

import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import type { JobApplication, ApplicationStatus } from '@jobtrackr/types';
import { API_URL } from '../lib/config';

const statusClass: Record<string, string> = {
  Applied: 'bg-[#D6E2FF] text-primary',
  Viewed: 'bg-yellow-100 text-yellow-800',
  Shortlisted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-error',
};

const statuses: ApplicationStatus[] = ['Applied', 'Viewed', 'Shortlisted', 'Rejected'];

export function ApplicationsTable({ applications }: { applications: JobApplication[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rows, setRows] = useState(applications);
  const [portalFilter, setPortalFilter] = useState('All');
  const portals = useMemo(() => ['All', ...Array.from(new Set(rows.map((row) => row.portal)))], [rows]);
  const filteredRows = useMemo(
    () => (portalFilter === 'All' ? rows : rows.filter((row) => row.portal === portalFilter)),
    [portalFilter, rows],
  );

  async function updateStatus(app: JobApplication, status: ApplicationStatus) {
    setRows((current) => current.map((item) => (item.id === app.id ? { ...item, status } : item)));
    const response = await fetch(`${API_URL}/api/applications/${app.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setRows((current) => current.map((item) => (item.id === app.id ? app : item)));
    }
  }
  const columns = useMemo<ColumnDef<JobApplication>[]>(
    () => [
      { accessorKey: 'job_title', header: 'Job Title' },
      { accessorKey: 'company', header: 'Company' },
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
  );
}

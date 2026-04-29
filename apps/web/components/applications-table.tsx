'use client';

import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import type { JobApplication, ApplicationStatus } from '@jobtrackr/types';

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
            <button
              className={`rounded-full px-3 py-1 text-sm font-bold ${statusClass[app.status]}`}
              onClick={() => {
                const next = statuses[(statuses.indexOf(app.status) + 1) % statuses.length];
                setRows((current) => current.map((item) => (item.id === app.id ? { ...item, status: next } : item)));
              }}
            >
              {app.status}
            </button>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-white">
      <table className="w-full min-w-[800px]">
        <thead className="bg-surface-container-low text-left text-sm uppercase tracking-wider text-on-surface-variant">
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
        <tbody>
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

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, Globe2, Plus, Search, Tags } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ApplicationStatus, JobApplication } from '../lib/types';
import { API_URL } from '../lib/config';
import { SUPPORTED_PORTALS } from '../lib/portals';

const statusClass: Record<string, string> = {
  Applied: 'bg-[#E3F2FD] text-[#1565C0]',
  Saved: 'bg-[#E8EAF6] text-[#283593]',
  Shortlisted: 'bg-[#FFF9C4] text-[#F57F17]',
  Rejected: 'bg-[#FFCDD2] text-[#B71C1C]',
  Accepted: 'bg-[#C8E6C9] text-[#1B5E20]',
  'In Progress': 'bg-[#FFE0B2] text-[#E65100]',
  Interview: 'bg-[#FFF9C4] text-[#F57F17]',
  Offer: 'bg-[#C8E6C9] text-[#1B5E20]',
  Unknown: 'bg-surface-container text-on-surface-variant',
};

const statuses: ApplicationStatus[] = ['Applied', 'Saved', 'Shortlisted', 'Rejected', 'Accepted', 'In Progress'];
const roleTypes = ['Full Time', 'Part Time', 'Internship', 'Contract', 'Stipend Based'];
const manualPortals = [...SUPPORTED_PORTALS, 'Other'];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ApplicationsPageClient({
  initialRows,
  page,
  pageSize,
  total,
  initialQuery,
}: {
  initialRows: JobApplication[];
  page: number;
  pageSize: number;
  total: number;
  initialQuery: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMessage, setManualMessage] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualForm, setManualForm] = useState({
    job_title: '',
    company: '',
    role_type: 'Full Time',
    portal: 'LinkedIn',
    applied_at: todayInputValue(),
    status: 'Applied',
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

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

  function navigateTo(nextPage: number, queryText: string) {
    const query = new URLSearchParams({
      page: String(nextPage),
    });
    if (queryText.trim()) query.set('q', queryText.trim());
    router.push(`/dashboard/applications?${query.toString()}`);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateTo(1, searchQuery);
  }

  function goPrevious() {
    if (page <= 1) return;
    navigateTo(page - 1, initialQuery);
  }

  function goNext() {
    if (page >= totalPages) return;
    navigateTo(page + 1, initialQuery);
  }

  async function submitManualApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualLoading(true);
    setManualMessage('');
    setManualError('');
    try {
      const response = await fetch(`${API_URL}/api/applications/manual`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(manualForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setManualError(data.message ?? 'Could not log application');
        return;
      }
      setManualMessage('Application logged to your Sheet');
      setManualForm({
        job_title: '',
        company: '',
        role_type: 'Full Time',
        portal: 'LinkedIn',
        applied_at: todayInputValue(),
        status: 'Applied',
      });
      router.refresh();
    } finally {
      setManualLoading(false);
    }
  }

  function updateManualForm(field: keyof typeof manualForm, value: string) {
    setManualForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="space-y-5">
      <section className="shadow-ambient overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
        <div className="flex flex-col gap-3 border-b border-outline-variant/20 p-5 md:flex-row md:items-center md:justify-between">
          <form onSubmit={onSearchSubmit} className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="manual-input pl-10"
              placeholder="Search by company or job title"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </form>
          <p className="text-sm font-semibold text-on-surface-variant">{total.toLocaleString()} records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-5 py-3">Job Title</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Role Type</th>
                <th className="px-5 py-3">Portal</th>
                <th className="px-5 py-3">Applied Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.length ? (
                rows.map((app) => (
                  <tr key={app.id} className="border-t border-outline-variant/20">
                    <td className="px-5 py-4 font-medium text-on-surface">{app.job_title}</td>
                    <td className="px-5 py-4">{app.company}</td>
                    <td className="px-5 py-4">{app.role_type}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-surface-container px-3 py-1 font-semibold">
                        {app.portal}
                      </span>
                    </td>
                    <td className="px-5 py-4">{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <select
                        className={`rounded-full border-0 px-3 py-1 text-sm font-bold ${statusClass[app.status]}`}
                        value={app.status}
                        onChange={(event) => updateStatus(app, event.target.value as ApplicationStatus)}
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-8 text-center text-on-surface-variant" colSpan={6}>
                    No applications found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/20 p-4 text-sm">
          <span className="font-semibold text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrevious}
              disabled={page <= 1}
              className="rounded-full border border-outline-variant/30 px-4 py-2 font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={page >= totalPages}
              className="rounded-full border border-outline-variant/30 px-4 py-2 font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <button
          type="button"
          onClick={() => setManualOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <div>
            <h3 className="font-headline text-base font-bold text-on-surface">Add Application Manually</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Backup option for applications that do not generate a confirmation email.
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
            {manualOpen ? <ChevronDown className="h-5 w-5 rotate-180" /> : <Plus className="h-5 w-5" />}
          </span>
        </button>

        {manualOpen ? (
          <form className="border-t border-outline-variant/20 p-5" onSubmit={submitManualApplication}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ManualField icon={<BriefcaseBusiness />} label="Job Title">
                <input
                  className="manual-input"
                  value={manualForm.job_title}
                  onChange={(event) => updateManualForm('job_title', event.target.value)}
                  required
                />
              </ManualField>
              <ManualField icon={<Building2 />} label="Company">
                <input
                  className="manual-input"
                  value={manualForm.company}
                  onChange={(event) => updateManualForm('company', event.target.value)}
                  required
                />
              </ManualField>
              <ManualField icon={<Tags />} label="Role Type">
                <select
                  className="manual-input"
                  value={manualForm.role_type}
                  onChange={(event) => updateManualForm('role_type', event.target.value)}
                >
                  {roleTypes.map((roleType) => (
                    <option key={roleType}>{roleType}</option>
                  ))}
                </select>
              </ManualField>
              <ManualField icon={<Globe2 />} label="Portal">
                <select
                  className="manual-input"
                  value={manualForm.portal}
                  onChange={(event) => updateManualForm('portal', event.target.value)}
                >
                  {manualPortals.map((portal) => (
                    <option key={portal}>{portal}</option>
                  ))}
                </select>
              </ManualField>
              <ManualField icon={<CalendarDays />} label="Applied Date">
                <input
                  className="manual-input"
                  type="date"
                  value={manualForm.applied_at}
                  onChange={(event) => updateManualForm('applied_at', event.target.value)}
                  required
                />
              </ManualField>
              <ManualField icon={<BadgeCheck />} label="Status">
                <select
                  className="manual-input"
                  value={manualForm.status}
                  onChange={(event) => updateManualForm('status', event.target.value)}
                >
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

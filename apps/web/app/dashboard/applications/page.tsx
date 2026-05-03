import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, TableProperties } from 'lucide-react';
import type { JobApplication, User } from '../../../lib/types';
import { ApplicationsPageClient } from '../../../components/applications-page-client';
import { DashboardLoadingGate } from '../../../components/dashboard-loading-gate';
import { DashboardShell } from '../../../components/dashboard-shell';
import { apiFetch } from '../../../lib/api';

export const dynamic = 'force-dynamic';

type ApplicationsResponse = {
  data: JobApplication[];
  page: number;
  page_size: number;
  total: number;
  q?: string;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string };
}) {
  const currentPage = Math.max(Number(searchParams?.page ?? '1') || 1, 1);
  const q = (searchParams?.q ?? '').trim();
  const query = new URLSearchParams({
    page: String(currentPage),
    page_size: '20',
  });
  if (q) query.set('q', q);

  const [{ user }, list] = await Promise.all([
    apiFetch<{ user: User }>('/api/me'),
    apiFetch<ApplicationsResponse>(`/api/applications?${query.toString()}`),
  ]);

  if (user.plan === 'free') {
    redirect('/pricing?reason=upgrade_required');
  }

  return (
    <DashboardShell user={user}>
      <DashboardLoadingGate label="Loading applications">
      <section className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-primary" />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            All Applications
          </h1>
        </div>
      </section>

      <ApplicationsPageClient
        initialRows={list.data}
        page={list.page}
        pageSize={list.page_size}
        total={list.total}
        initialQuery={q}
      />
      </DashboardLoadingGate>
    </DashboardShell>
  );
}

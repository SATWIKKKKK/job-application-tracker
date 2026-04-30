import type { User } from '@jobtrackr/types';
import { redirect } from 'next/navigation';
import { DashboardShell } from '../../../components/dashboard-shell';
import { apiFetch } from '../../../lib/api';
import { SetupClient } from './setup-client';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const { user } = await apiFetch<{ user: User }>('/api/me');
  if (user.google_sheet_id) redirect('/dashboard');

  return (
    <DashboardShell user={user}>
      <SetupClient />
    </DashboardShell>
  );
}

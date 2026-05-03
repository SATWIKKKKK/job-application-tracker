'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { API_URL } from '../lib/config';
import { usePlan } from './plan-context';

type Notification = {
  id: string;
  type: string;
  message: string;
};

function getBrowserAuthHeaders() {
  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('jt_token='))
    ?.split('=')[1];
  return token ? { authorization: `Bearer ${decodeURIComponent(token)}` } : undefined;
}

export function DashboardNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [downgrade, setDowngrade] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { refreshPlan } = usePlan();

  useEffect(() => {
    async function loadNotifications() {
      const response = await fetch(`${API_URL}/api/user/notifications`, {
        credentials: 'include',
        headers: getBrowserAuthHeaders(),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: Notification[] };
      setNotifications(data.notifications);
      setDowngrade(data.notifications.find((item) => item.type === 'plan_downgraded') ?? null);
      if (data.notifications.length) {
        await fetch(`${API_URL}/api/user/notifications/mark-read`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json', ...getBrowserAuthHeaders() },
          body: JSON.stringify({ ids: data.notifications.map((item) => item.id) }),
        });
      }
    }
    void loadNotifications();
  }, []);

  const warning = useMemo(
    () => notifications.find((item) => item.type.startsWith('plan_expiry_warning')),
    [notifications],
  );
  const portalNotice = useMemo(
    () => notifications.find((item) => item.type === 'skipped_portal'),
    [notifications],
  );

  useEffect(() => {
    const notice = warning ?? portalNotice;
    if (!notice) return;
    setDismissed(sessionStorage.getItem(`dismissed-${notice.id}`) === 'true');
  }, [warning, portalNotice]);

  if (downgrade) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm">
        <div className="shadow-ambient max-w-md rounded-lg bg-surface-container-lowest p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-error" />
          <h2 className="mt-4 font-headline text-2xl font-bold text-on-surface">Plan expired</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{downgrade.message}</p>
          <button
            type="button"
            onClick={() => {
              setDowngrade(null);
              void refreshPlan();
            }}
            className="hero-gradient mt-6 rounded-full px-6 py-3 text-sm font-bold text-on-primary"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  const visibleNotice = warning ?? portalNotice;
  if (!visibleNotice || dismissed) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-semibold">{visibleNotice.message}</p>
      <div className="flex gap-2">
        <Link href="/pricing" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary">
          {warning ? 'Renew Plan' : 'Upgrade'}
        </Link>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(`dismissed-${visibleNotice.id}`, 'true');
            setDismissed(true);
          }}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-on-surface"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

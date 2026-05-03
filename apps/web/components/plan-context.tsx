'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/config';
import type { Plan, PlanType } from '../lib/types';

export type PlanState = {
  plan: Plan;
  plan_type: PlanType | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  days_remaining: number | null;
};

type PlanContextValue = {
  plan: PlanState;
  isPro: boolean;
  refreshPlan: () => Promise<void>;
};

const freePlan: PlanState = {
  plan: 'free',
  plan_type: null,
  plan_started_at: null,
  plan_expires_at: null,
  days_remaining: null,
};

const PlanContext = createContext<PlanContextValue>({
  plan: freePlan,
  isPro: false,
  refreshPlan: async () => undefined,
});

function getBrowserAuthHeaders() {
  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('jt_token='))
    ?.split('=')[1];
  return token ? { authorization: `Bearer ${decodeURIComponent(token)}` } : undefined;
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanState>(freePlan);

  async function refreshPlan() {
    try {
      const response = await fetch(`${API_URL}/api/user/me`, {
        credentials: 'include',
        headers: getBrowserAuthHeaders(),
      });
      if (!response.ok) {
        setPlan(freePlan);
        return;
      }
      const data = (await response.json()) as { user: PlanState };
      setPlan({
        plan: data.user.plan,
        plan_type: data.user.plan_type,
        plan_started_at: data.user.plan_started_at,
        plan_expires_at: data.user.plan_expires_at,
        days_remaining: data.user.days_remaining,
      });
    } catch {
      setPlan(freePlan);
    }
  }

  useEffect(() => {
    void refreshPlan();
  }, []);

  const value = useMemo(
    () => ({
      plan,
      isPro: plan.plan === 'pro',
      refreshPlan,
    }),
    [plan],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}

export function planDisplayName(plan: PlanState) {
  if (plan.plan === 'free') return 'Free Plan';
  if (plan.plan_type === 'monthly') return 'Pro Monthly';
  if (plan.plan_type === 'quarterly') return 'Pro Quarterly';
  if (plan.plan_type === 'yearly') return 'Pro Yearly - Best Value';
  return 'Pro';
}

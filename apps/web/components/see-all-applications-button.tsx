'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Lock } from 'lucide-react';
import { usePlan } from './plan-context';

export function SeeAllApplicationsButton() {
  const router = useRouter();
  const { isPro } = usePlan();

  return (
    <button
      type="button"
      onClick={() => router.push(isPro ? '/dashboard/applications' : '/pricing')}
      className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
    >
      {isPro ? <BarChart3 className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-primary" />}
      See All Applications
    </button>
  );
}

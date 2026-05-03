'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { API_URL, RAZORPAY_KEY_ID } from '../../lib/config';
import type { SessionUser } from '../../lib/auth';
import { usePlan } from '../../components/plan-context';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: 'payment.failed', callback: (response: unknown) => void) => void;
    };
  }
}

type PaidPlan = 'monthly' | 'quarterly' | 'yearly';
type PlanId = 'free' | PaidPlan;

function getBrowserAuthHeaders() {
  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('jt_token='))
    ?.split('=')[1];
  return token ? { authorization: `Bearer ${decodeURIComponent(token)}` } : undefined;
}

const plans = [
  { id: 'free', title: 'Free Forever', price: '₹0', features: ['3 portal sources', 'Google Sheets sync', 'Basic dashboard'] },
  { id: 'monthly', title: 'Pro Monthly', price: '₹49', suffix: '/ month', features: ['Unlimited sources', 'Priority sync', 'Heatmap insights', 'Manual logging'] },
  { id: 'quarterly', title: 'Pro Quarterly', price: '₹99', suffix: '/ 3 months', features: ['Everything in monthly', 'Lower monthly cost', 'Best starter value'] },
  { id: 'yearly', title: 'Pro Yearly', price: '₹299', suffix: '/ year', features: ['Everything in Pro', 'Best value', 'Save more'] },
] as const;

function isCurrentPlan(planId: PlanId, currentPlan: ReturnType<typeof usePlan>['plan']) {
  if (planId === 'free') return currentPlan.plan === 'free';
  return currentPlan.plan === 'pro' && currentPlan.plan_type === planId;
}

export function PricingClient({
  user,
  reason,
  checkoutPlan,
}: {
  user: SessionUser | null;
  reason?: string;
  checkoutPlan?: PaidPlan | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState(
    reason === 'upgrade_required' ? 'Upgrade to Pro to access that dashboard feature.' : '',
  );
  const [currentPlanModal, setCurrentPlanModal] = useState<PlanId | null>(null);
  const [successPlan, setSuccessPlan] = useState<PaidPlan | null>(null);
  const { plan: currentPlan, refreshPlan } = usePlan();
  const startedCheckoutRef = useRef(false);

  const checkout = useCallback(async (plan: PaidPlan) => {
    try {
      setLoading(plan);
      setMessage('');
      if (!RAZORPAY_KEY_ID) {
        setMessage('Razorpay key is missing. Add NEXT_PUBLIC_RAZORPAY_KEY_ID.');
        return;
      }
      const authHeaders = getBrowserAuthHeaders();
      const response = await fetch(`${API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(authHeaders ?? {}),
        },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const nextPath = `/pricing?checkout=${plan}`;
          window.location.href = `/auth/signin?next=${encodeURIComponent(nextPath)}`;
          return;
        }
        if (response.status === 409) {
          setCurrentPlanModal(plan);
          return;
        }
        setMessage('Unable to start Razorpay checkout right now. Please try again.');
        return;
      }
      const order = await response.json();
      if (!window.Razorpay) {
        setMessage('Razorpay checkout failed to load. Please try again.');
        return;
      }
      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency ?? 'INR',
        name: 'JobTrackr',
        description: `${plan} plan`,
        prefill: {
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
        },
        theme: { color: '#0049C5' },
        handler: async (payment: Record<string, string>) => {
          const verify = await fetch(`${API_URL}/api/payments/verify`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...(authHeaders ?? {}),
            },
            credentials: 'include',
            body: JSON.stringify({ ...payment, plan }),
          });
          if (!verify.ok) {
            setMessage('Payment verification failed. Please contact support if money was deducted.');
            return;
          }
          await refreshPlan();
          setSuccessPlan(plan);
        },
        modal: {
          ondismiss: () => setMessage('Payment cancelled. You can try again anytime.'),
        },
      });
      razorpay.on('payment.failed', (failure) => {
        const reason = typeof failure === 'object' && failure && 'error' in failure
          ? String((failure as { error?: { description?: string; reason?: string } }).error?.description ?? (failure as { error?: { reason?: string } }).error?.reason ?? 'Payment failed')
          : 'Payment failed';
        setMessage(reason);
      });
      razorpay.open();
    } finally {
      setLoading(null);
    }
  }, [refreshPlan, user]);

  useEffect(() => {
    if (!checkoutPlan || !user || startedCheckoutRef.current) return;
    if (isCurrentPlan(checkoutPlan, currentPlan)) return;
    startedCheckoutRef.current = true;
    void checkout(checkoutPlan);
  }, [checkout, checkoutPlan, currentPlan, user]);

  return (
    <div className="space-y-4">
    {message ? <p className="rounded-lg bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
      {plans.map((plan) => {
        const activePlan = isCurrentPlan(plan.id, currentPlan);
        return (
          <div
            key={plan.id}
            id={plan.id === 'monthly' ? 'monthly-plan-card' : undefined}
            className="relative flex min-h-[320px] flex-col rounded-lg border border-outline-variant/40 bg-white p-5 shadow-sm"
          >
            <h2 className="font-headline text-xl font-bold text-on-surface">{plan.title}</h2>
            {activePlan ? (
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-green-700">
                <CheckCircle2 className="h-4 w-4" /> You are already on this plan
              </p>
            ) : null}
            <div className="mt-5 flex items-end">
              <span className="font-headline text-3xl font-extrabold text-on-surface">{plan.price}</span>
              {'suffix' in plan ? <span className="mb-1 ml-2 text-base opacity-80">{plan.suffix}</span> : null}
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li className="flex items-center gap-2 text-on-surface-variant" key={feature}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                if (activePlan) {
                  setCurrentPlanModal(plan.id);
                  return;
                }
                if (plan.id === 'free') {
                  window.location.href = '/auth/signin';
                  return;
                }
                void checkout(plan.id);
              }}
              className="mt-auto rounded-lg border border-primary px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5 hover:bg-primary-fixed active:scale-95"
            >
              {loading === plan.id
                ? 'Opening...'
                : activePlan
                  ? 'Current Plan'
                  : plan.id === 'free'
                    ? 'Start Free'
                    : plan.id === 'monthly'
                      ? 'Get Monthly'
                      : plan.id === 'quarterly'
                        ? 'Get Quarterly'
                        : 'Get Yearly'}
            </button>
          </div>
        );
      })}
    </div>
    {currentPlanModal ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm">
        <div className="shadow-ambient w-full max-w-md rounded-lg bg-surface-container-lowest p-6">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            {currentPlanModal === 'free' ? 'You are already on the Free Plan' : `You are already on Pro ${currentPlanModal === 'monthly' ? 'Monthly' : currentPlanModal === 'quarterly' ? 'Quarterly' : 'Yearly'}`}
          </h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            {currentPlanModal === 'free'
              ? 'You currently have access to 3 portal sources, Google Sheets sync, and basic dashboard. Upgrade to Pro for unlimited portals, heatmap insights, and manual logging.'
              : 'This plan is already active on your account.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setCurrentPlanModal(null)} className="rounded-full bg-surface-container px-5 py-3 text-sm font-bold text-on-surface">
              Got it
            </button>
            {currentPlanModal === 'free' ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentPlanModal(null);
                  document.getElementById('monthly-plan-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="hero-gradient rounded-full px-5 py-3 text-sm font-bold text-on-primary"
              >
                Upgrade to Pro
              </button>
            ) : null}
          </div>
        </div>
      </div>
    ) : null}
    {successPlan ? <UpgradeSuccessModal plan={successPlan} onClose={async () => {
      await refreshPlan();
      window.location.href = '/dashboard';
    }} /> : null}
    </div>
  );
}

function UpgradeSuccessModal({ plan, onClose }: { plan: PaidPlan; onClose: () => void }) {
  const label = plan === 'monthly' ? 'Monthly' : plan === 'quarterly' ? 'Quarterly' : 'Yearly';
  const features = [
    'Unlimited portal sync',
    'Heatmap insights',
    'Manual application logging',
    'Priority sync',
    ...(plan === 'quarterly' ? ['Lower monthly cost'] : []),
    ...(plan === 'yearly' ? ['Best value', 'Maximum savings'] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm">
      <div className="shadow-ambient w-full max-w-lg rounded-lg bg-surface-container-lowest p-8 text-center">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="mt-5 font-headline text-2xl font-bold text-on-surface">You are now on Pro {label}</h2>
        <div className="mt-5 grid gap-3 text-left">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
              <CheckCircle2 className="h-4 w-4 text-green-700" /> {feature}
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="hero-gradient mt-6 rounded-full px-6 py-3 text-sm font-bold text-on-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

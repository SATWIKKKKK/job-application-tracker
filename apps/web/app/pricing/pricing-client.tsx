'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { API_URL, RAZORPAY_KEY_ID } from '../../lib/config';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: 'payment.failed', callback: (response: unknown) => void) => void;
    };
  }
}

const plans = [
  { id: 'free', title: 'Free Forever', price: '₹0', features: ['3 portal sources', 'Google Sheets sync', 'Basic dashboard'] },
  { id: 'monthly', title: 'Pro Monthly', price: '₹49', suffix: '/ month', features: ['Unlimited sources', 'Priority sync', 'Heatmap insights', 'Manual logging'] },
  { id: 'quarterly', title: 'Pro Quarterly', price: '₹99', suffix: '/ 3 months', features: ['Everything in monthly', 'Lower monthly cost', 'Best starter value'] },
  { id: 'yearly', title: 'Pro Yearly', price: '₹299', suffix: '/ year', features: ['Everything in Pro', 'Best value', 'Save more'] },
] as const;

export function PricingClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function checkout(plan: 'monthly' | 'quarterly' | 'yearly') {
    try {
      setLoading(plan);
      setMessage('');
      if (!RAZORPAY_KEY_ID) {
        setMessage('Razorpay key is missing. Add NEXT_PUBLIC_RAZORPAY_KEY_ID.');
        return;
      }
      const response = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        window.location.href = '/auth/signin';
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
        handler: async (payment: Record<string, string>) => {
          const verify = await fetch(`${API_URL}/api/verify-payment`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ...payment, plan }),
          });
          if (!verify.ok) {
            setMessage('Payment verification failed. Please contact support if money was deducted.');
            return;
          }
          window.location.href = '/dashboard';
        },
        modal: {
          ondismiss: () => setMessage('Payment cancelled. You can try again anytime.'),
        },
      });
      razorpay.on('payment.failed', () => {
        setMessage('Payment failed. Please try another method or try again.');
      });
      razorpay.open();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
    {message ? <p className="rounded-lg bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
      {plans.map((plan) => {
        return (
          <div key={plan.id} className="relative flex min-h-[320px] flex-col rounded-lg border border-outline-variant/40 bg-white p-5 shadow-sm">
            <h2 className="font-headline text-xl font-bold text-on-surface">{plan.title}</h2>
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
              onClick={() => (plan.id === 'free' ? (window.location.href = '/auth/signin') : checkout(plan.id))}
              className="mt-auto rounded-lg border border-primary px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5 hover:bg-primary-fixed active:scale-95"
            >
              {loading === plan.id ? 'Opening...' : plan.id === 'free' ? 'Start Free' : plan.id === 'monthly' ? 'Get Monthly' : plan.id === 'quarterly' ? 'Get Quarterly' : 'Get Yearly'}
            </button>
          </div>
        );
      })}
    </div>
    </div>
  );
}

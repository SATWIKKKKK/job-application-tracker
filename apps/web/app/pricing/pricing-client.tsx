'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { API_URL } from '../../lib/config';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const plans = [
  { id: 'free', title: 'Free Forever', price: '₹0', features: ['3 portal integrations', 'Google Sheets sync', 'Basic dashboard'] },
  { id: 'monthly', title: 'Pro Monthly', price: '₹49', suffix: '/ month', popular: true, features: ['Unlimited portals', 'Priority sync', 'Email alerts', 'CSV export'] },
  { id: 'yearly', title: 'Pro Yearly', price: '₹299', suffix: '/ year', features: ['Everything in Pro', 'Best value', 'Save 50%'] },
] as const;

export function PricingClient() {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: 'monthly' | 'yearly') {
    setLoading(plan);
    const response = await fetch(`${API_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plan }),
    });
    const order = await response.json();
    setLoading(null);
    if (!window.Razorpay) {
      alert('Razorpay checkout failed to load. Please try again.');
      return;
    }
    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: order.order_id,
      amount: order.amount,
      currency: 'INR',
      name: 'JobTrackr',
      description: `${plan} plan`,
      handler: async (payment: Record<string, string>) => {
        await fetch(`${API_URL}/api/payments/verify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payment, plan }),
        });
        window.location.href = '/dashboard';
      },
    });
    razorpay.open();
  }

  return (
    <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
      {plans.map((plan) => {
        const pro = plan.id === 'monthly';
        return (
          <div key={plan.id} className={`relative flex min-h-[460px] flex-col rounded-xl border p-8 ${pro ? 'border-primary bg-primary text-white md:-translate-y-5' : 'border-outline-variant bg-white'}`}>
            {'popular' in plan && plan.popular ? <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-[#C9D8FF] px-5 py-1 font-bold text-on-surface-variant">Most Popular</div> : null}
            <h2 className="font-headline text-3xl font-bold">{plan.title}</h2>
            <div className="mt-7 flex items-end">
              <span className="font-headline text-5xl font-extrabold">{plan.price}</span>
              {'suffix' in plan ? <span className="mb-2 ml-2 text-lg opacity-80">{plan.suffix}</span> : null}
            </div>
            <ul className="mt-8 space-y-4 text-xl">
              {plan.features.map((feature) => (
                <li className="flex items-center gap-3" key={feature}>
                  <CheckCircle2 className={pro ? 'text-white' : 'text-primary'} /> {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => (plan.id === 'free' ? (window.location.href = '/auth/signin') : checkout(plan.id))}
              className={`mt-auto rounded-lg border px-6 py-4 font-bold ${pro ? 'bg-white text-primary' : 'border-primary text-primary'}`}
            >
              {loading === plan.id ? 'Opening...' : plan.id === 'free' ? 'Start Free' : plan.id === 'monthly' ? 'Get Pro' : 'Get Yearly'}
            </button>
            {pro ? <div className="mt-4 text-center text-lg text-[#C9D8FF]">₹99 / 3 months</div> : null}
          </div>
        );
      })}
    </div>
  );
}

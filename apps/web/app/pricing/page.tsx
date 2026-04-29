import Script from 'next/script';
import { Footer, NavBar } from '../../components/site-chrome';
import { PricingClient } from './pricing-client';

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <NavBar active="Pricing" />
      <main className="mx-auto w-full max-w-[1540px] flex-1 px-8 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-headline text-5xl font-extrabold">Simple, honest pricing</h1>
          <p className="mt-5 text-2xl text-on-surface-variant">Start free with 3 integrations. Scale when you need more.</p>
        </div>
        <PricingClient />
      </main>
      <Footer active="Pricing" />
    </div>
  );
}

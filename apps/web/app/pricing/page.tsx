import Script from 'next/script';
import { Footer, NavBar } from '../../components/site-chrome';
import { PricingClient } from './pricing-client';

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <NavBar active="Pricing" />
      <main className="mx-auto w-full max-w-screen-xl flex-1 px-6 pb-16 pt-28 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight md:text-4xl">Simple, honest pricing</h1>
          <p className="mt-3 text-base text-on-surface-variant">Start free with 3 sources. Scale when you need more.</p>
        </div>
        <PricingClient />
      </main>
      <Footer active="Pricing" />
    </div>
  );
}

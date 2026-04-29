import Script from 'next/script';
import { Footer, NavBar } from '../../components/site-chrome';
import { PricingClient } from './pricing-client';

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <NavBar active="Pricing" />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-6 pb-24 pt-32 md:px-8">
        <div className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Simple, honest pricing</h1>
          <p className="mt-5 text-lg text-on-surface-variant md:text-xl">Start free with 3 integrations. Scale when you need more.</p>
        </div>
        <PricingClient />
      </main>
      <Footer active="Pricing" />
    </div>
  );
}

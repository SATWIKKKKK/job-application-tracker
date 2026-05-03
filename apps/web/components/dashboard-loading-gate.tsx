'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function DashboardLoadingGate({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="shadow-ambient flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="font-headline text-lg font-bold text-on-surface">{label}</p>
            <p className="mt-1 text-sm text-on-surface-variant">Preparing your latest tracker view.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import Link from 'next/link';
import { Lock } from 'lucide-react';

export function LockedFeature({
  title,
  className = '',
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest ${className}`}>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-100/80 p-6 text-center backdrop-blur-[2px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <Lock className="h-5 w-5" />
        </div>
        <p className="max-w-sm font-headline text-base font-bold text-on-surface">{title}</p>
        <Link href="/pricing" className="hero-gradient rounded-full px-5 py-2 text-sm font-bold text-on-primary">
          See Plans
        </Link>
      </div>
      <div className="min-h-[220px] blur-sm grayscale">{/* visual placeholder */}</div>
    </div>
  );
}

import Link from 'next/link';
import clsx from 'clsx';

const links = [
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['How it Works', '/how-it-works'],
  ['Sites', '/sites'],
] as const;

export function NavBar({ active }: { active?: string }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant bg-white/95">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-8">
        <Link href="/" className="font-headline text-2xl font-extrabold text-primary">
          JobTrackr
        </Link>
        <div className="hidden items-center gap-10 md:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'rounded px-1 py-2 text-base text-on-surface transition',
                active === label && 'border-b-2 border-primary font-semibold text-primary',
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <Link href="/auth/signin" className="font-medium text-primary">
            Login
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-full bg-primary px-8 py-3 font-bold text-white shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Footer({ active }: { active?: string }) {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-6 px-8 py-10 md:flex-row">
        <div className="font-headline text-2xl font-extrabold">JobTrackr</div>
        <div className="flex flex-wrap justify-center gap-7 text-sm text-slate-500">
          {['Features', 'Pricing', 'Privacy Policy', 'Terms of Service', 'API Docs'].map((item) => (
            <Link
              href={item === 'Pricing' ? '/pricing' : '#'}
              className={clsx(active === item && 'font-semibold text-primary')}
              key={item}
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="text-sm text-slate-500">© 2024 JobTrackr Inc. Engineered for performance.</div>
      </div>
    </footer>
  );
}

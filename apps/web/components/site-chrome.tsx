import Link from 'next/link';
import clsx from 'clsx';
import { getSessionUser } from '../lib/auth';
import { MarketingAuthActions } from './marketing-auth-actions';

const links = [
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['How it Works', '/how-it-works'],
] as const;

export function NavBar({ active }: { active?: string }) {
  const user = getSessionUser();

  return (
    <nav className="fixed top-0 z-50 w-full bg-white/70 shadow-[0_4px_20px_rgba(0,73,197,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-screen-2xl items-center justify-between px-6 md:px-8">
        <Link href="/" className="font-headline text-xl font-black tracking-[-0.04em] text-blue-900 md:text-2xl">
          JobTrackr
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-2 py-2 font-body text-sm font-medium text-slate-600 transition-colors hover:text-blue-800',
                active === label && 'border-b-2 border-blue-700 font-bold text-blue-700',
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <MarketingAuthActions user={user} />
      </div>
    </nav>
  );
}

export function Footer({ active }: { active?: string }) {
  const footerLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Help Center', href: '/help-center' },
  ];

  return (
    <footer className="mt-auto border-t border-outline-variant/10 bg-slate-50">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-8 px-8 py-12 md:flex-row">
        <Link href="/" className="font-headline text-xl font-black tracking-[-0.04em] text-blue-900">
          JobTrackr
        </Link>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          {footerLinks.map((item) => (
            <Link
              href={item.href}
              className={clsx('font-body opacity-80 transition-all hover:text-blue-600 hover:opacity-100', active === item.label && 'font-semibold text-primary')}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="font-body text-sm text-slate-500">© 2024 JobTrackr. All rights reserved.</div>
      </div>
    </footer>
  );
}

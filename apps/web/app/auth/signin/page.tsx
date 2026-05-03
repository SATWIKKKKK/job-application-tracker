import { AuthPanel } from './signin-client';
import { redirect } from 'next/navigation';
import { getSessionUser } from '../../../lib/auth';

function resolveNextPath(nextPath?: string) {
  if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    return nextPath;
  }
  return '/dashboard';
}

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const user = getSessionUser();
  if (user) redirect(resolveNextPath(searchParams?.next));
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <AuthPanel />
    </main>
  );
}

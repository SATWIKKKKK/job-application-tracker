'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthBridgePage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const next = params.get('next') ?? '/dashboard';
    if (token) {
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `jt_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    }
    router.replace(next);
  }, [params, router]);

  return null;
}

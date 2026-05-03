function getBrowserToken() {
  if (typeof document === 'undefined') return null;
  const encoded = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('jt_token='))
    ?.split('=')[1];
  return encoded ? decodeURIComponent(encoded) : null;
}

export function withBrowserAuth(init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getBrowserToken();
  if (token && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`);
  }

  return {
    ...init,
    headers,
    credentials: token ? 'omit' : (init.credentials ?? 'include'),
  } satisfies RequestInit;
}
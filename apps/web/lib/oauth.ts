const LOCAL_WEB_ORIGIN = 'http://localhost:3001';

export function getOAuthReturnTo() {
  if (typeof window === 'undefined') return LOCAL_WEB_ORIGIN;
  try {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return LOCAL_WEB_ORIGIN;
    }
    return origin;
  } catch {
    return LOCAL_WEB_ORIGIN;
  }
}


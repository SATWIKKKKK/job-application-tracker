export function getOAuthReturnTo() {
  if (typeof window === 'undefined') return '';
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}

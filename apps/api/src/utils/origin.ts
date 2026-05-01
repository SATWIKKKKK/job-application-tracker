const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function parseOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isLocalHostname(hostname: string) {
  return LOCAL_HOSTS.has(hostname.toLowerCase());
}

export function isLocalOrigin(origin: string | null | undefined) {
  const parsed = parseOrigin(origin);
  if (!parsed) return false;
  try {
    return isLocalHostname(new URL(parsed).hostname);
  } catch {
    return false;
  }
}

export function isAllowedReturnOrigin(origin: string | null | undefined, configuredWebUrl: string) {
  const parsed = parseOrigin(origin);
  if (!parsed) return false;
  if (isLocalOrigin(parsed)) return true;
  const configuredOrigin = parseOrigin(configuredWebUrl);
  return Boolean(configuredOrigin && parsed === configuredOrigin);
}

export function originFromReferer(referer: string | null | undefined) {
  return parseOrigin(referer);
}


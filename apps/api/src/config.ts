import 'dotenv/config';

function trimEnv(value: string | undefined) {
  return value?.trim();
}

function normalizeUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isHostedRuntime() {
  return process.env.NODE_ENV === 'production' || Boolean(trimEnv(process.env.VERCEL_URL));
}

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  } catch {
    return false;
  }
}

function resolveApiUrl() {
  const configuredApiUrl = trimEnv(process.env.API_URL);
  if (configuredApiUrl && !(isHostedRuntime() && isLocalhostUrl(configuredApiUrl))) {
    return normalizeUrl(configuredApiUrl);
  }

  const vercelUrl = trimEnv(process.env.VERCEL_URL);
  if (vercelUrl) return normalizeUrl(vercelUrl);

  return 'http://localhost:4000';
}

function resolveGoogleRedirectUri(apiUrl: string) {
  const configuredRedirectUri = trimEnv(process.env.GOOGLE_REDIRECT_URI);
  if (configuredRedirectUri && !(isHostedRuntime() && isLocalhostUrl(configuredRedirectUri))) {
    return normalizeUrl(configuredRedirectUri);
  }

  return new URL('/api/auth/google/callback', `${apiUrl}/`).toString();
}

const apiUrl = resolveApiUrl();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3001',
  apiUrl,
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri: resolveGoogleRedirectUri(apiUrl),
  googlePubSubTopicName:
    process.env.GOOGLE_PUBSUB_TOPIC_NAME ??
    (process.env.GOOGLE_CLOUD_PROJECT
      ? `projects/${process.env.GOOGLE_CLOUD_PROJECT}/topics/jobtrackr-gmail-watch`
      : 'projects/jobtrackr/topics/jobtrackr-gmail-watch'),
  aiCreditsApiKey: process.env.AICREDITS_API_KEY ?? '',
  aiCreditsBaseUrl: process.env.AICREDITS_BASE_URL ?? 'https://api.aicredits.in/v1',
  aiCreditsModel: process.env.AICREDITS_MODEL ?? 'deepseek/deepseek-v3',
  aiCreditsFallbackModel: process.env.AICREDITS_FALLBACK_MODEL ?? 'deepseek/deepseek-chat',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  gmailUser: process.env.GMAIL_USER ?? '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
};

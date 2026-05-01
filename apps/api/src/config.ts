import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3001',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ??
    'http://localhost:4000/api/auth/google/callback',
  googlePubSubTopicName:
    process.env.GOOGLE_PUBSUB_TOPIC_NAME ??
    (process.env.GOOGLE_CLOUD_PROJECT
      ? `projects/${process.env.GOOGLE_CLOUD_PROJECT}/topics/jobtrackr-gmail-watch`
      : 'projects/jobtrackr/topics/jobtrackr-gmail-watch'),
  aiCreditsApiKey: process.env.AICREDITS_API_KEY ?? '',
  aiCreditsBaseUrl: process.env.AICREDITS_BASE_URL ?? 'https://api.aicredits.in/v1',
  aiCreditsModel: process.env.AICREDITS_MODEL ?? 'deepseek/deepseek-chat',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  gmailUser: process.env.GMAIL_USER ?? '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
};

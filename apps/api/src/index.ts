import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { config } from './config.js';
import { applicationsRouter } from './routes/applications.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { paymentsRouter } from './routes/payments.js';
import { sheetsRouter } from './routes/sheets.js';
import { startWeeklyDigestJob } from './jobs/weeklyDigest.js';

const app = express();

app.use(
  cors({
    origin: config.webUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/sheets', sheetsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/payments', paymentsRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error(error);
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'validation_error', issues: error.issues });
  }
  if (error instanceof Error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(500).json({ message: 'internal_error' });
});

startWeeklyDigestJob();

app.listen(config.port, () => {
  console.log(`JobTrackr API listening on http://localhost:${config.port}`);
});

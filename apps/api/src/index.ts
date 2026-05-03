import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { config } from './config.js';
import { applicationsRouter } from './routes/applications.js';
import { authRouter } from './routes/auth.js';
import { cronRouter } from './routes/cron.js';
import { gmailRouter } from './routes/gmail.js';
import { meRouter } from './routes/me.js';
import { paymentsRouter } from './routes/payments.js';
import { sheetsRouter } from './routes/sheets.js';
import { userRouter } from './routes/user.js';
import { ensureDatabaseShape } from './db/schema.js';
import { isAllowedReturnOrigin, isLocalOrigin, parseOrigin } from './utils/origin.js';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = parseOrigin(origin);
      if (!normalized) return callback(null, false);
      if (isLocalOrigin(normalized)) return callback(null, true);
      callback(null, isAllowedReturnOrigin(normalized, config.webUrl));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/cron', cronRouter);
app.use('/api/gmail', gmailRouter);
app.use('/api/me', meRouter);
app.use('/api/sheets', sheetsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api', paymentsRouter);
app.use('/api/user', userRouter);

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

let initialized = false;
async function initialize() {
  if (initialized) return;
  initialized = true;
  await ensureDatabaseShape();
}

void initialize().then(() => {
  if (process.env.NODE_ENV !== 'production') {
    app.listen(config.port, () => {
      console.log(`JobTrackr API listening on http://localhost:${config.port}`);
    });
  }
});

export default app;

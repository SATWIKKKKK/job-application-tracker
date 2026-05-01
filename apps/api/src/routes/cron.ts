import { Router, type Request } from 'express';
import { query } from '../db/pool.js';
import { runInitialGmailScan, startGmailWatch, syncRecentGmailConfirmations } from '../services/gmail.js';

export const cronRouter = Router();

function isAuthorizedCron(req: Request) {
  const cronHeader = req.header('x-vercel-cron');
  const bearer = req.header('authorization');
  const secret = process.env.CRON_SECRET;
  if (cronHeader) return true;
  if (secret && bearer === `Bearer ${secret}`) return true;
  return false;
}

cronRouter.get('/gmail-renew', async (req, res) => {
  if (!isAuthorizedCron(req)) return res.status(401).json({ message: 'unauthorized' });

  const users = await query<{ id: string; gmail_connected: boolean }>(
    `select id, gmail_connected from users
     where google_refresh_token is not null`,
  );

  let renewed = 0;
  for (const user of users.rows) {
    try {
      await startGmailWatch(user.id);
      renewed += 1;
      if (!user.gmail_connected) {
        await runInitialGmailScan(user.id);
      }
    } catch (error) {
      console.warn('gmail-renew failed for user', user.id, error);
    }
  }
  return res.json({ ok: true, renewed });
});

cronRouter.get('/weekly-digest', async (req, res) => {
  if (!isAuthorizedCron(req)) return res.status(401).json({ message: 'unauthorized' });
  return res.json({ ok: true, message: 'weekly digest cron endpoint active' });
});

cronRouter.get('/gmail-catchup', async (req, res) => {
  if (!isAuthorizedCron(req)) return res.status(401).json({ message: 'unauthorized' });

  const users = await query<{ id: string }>(
    `select id
     from users
     where google_refresh_token is not null
       and gmail_connected = true`,
  );

  let processed = 0;
  let checked = 0;
  for (const user of users.rows) {
    try {
      const result = await syncRecentGmailConfirmations(user.id, 30);
      processed += result.processed;
      checked += 1;
    } catch (error) {
      console.warn('gmail-catchup failed for user', user.id, error);
    }
  }

  return res.json({ ok: true, checked, processed });
});

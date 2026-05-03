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

function planLabel(planType: string | null) {
  if (planType === 'monthly') return 'Monthly';
  if (planType === 'quarterly') return 'Quarterly';
  if (planType === 'yearly') return 'Yearly';
  return 'Pro';
}

cronRouter.get('/check-expiry', async (req, res) => {
  if (!isAuthorizedCron(req)) return res.status(401).json({ message: 'unauthorized' });

  const users = await query<{
    id: string;
    plan_type: string | null;
    plan_expires_at: string;
    days_remaining: number;
  }>(
    `select id, plan_type, plan_expires_at,
            ceil(extract(epoch from (plan_expires_at - now())) / 86400)::int as days_remaining
     from users
     where plan <> 'free' and plan_expires_at is not null`,
  );

  let warned = 0;
  let downgraded = 0;
  for (const user of users.rows) {
    const label = planLabel(user.plan_type);
    if (user.days_remaining === 7 || user.days_remaining === 3) {
      const type = user.days_remaining === 7 ? 'plan_expiry_warning_7days' : 'plan_expiry_warning_3days';
      await query(
        `insert into notifications (user_id, type, message, metadata)
         values ($1, $2, $3, $4)`,
        [
          user.id,
          type,
          `Your ${label} plan expires in ${user.days_remaining} days. After that you will be moved to the Free plan.`,
          { plan_type: user.plan_type, days_remaining: user.days_remaining },
        ],
      );
      warned += 1;
    }
    if (new Date(user.plan_expires_at).getTime() <= Date.now()) {
      await query(
        `update users
         set plan = 'free', plan_type = null, plan_expires_at = null
         where id = $1`,
        [user.id],
      );
      await query(
        `insert into notifications (user_id, type, message, metadata)
         values ($1, 'plan_downgraded', $2, $3)`,
        [
          user.id,
          `Your ${label} plan has expired. You have been moved to the Free plan. Upgrade anytime to restore Pro features.`,
          { plan_type: user.plan_type },
        ],
      );
      downgraded += 1;
    }
  }

  return res.json({ ok: true, warned, downgraded });
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

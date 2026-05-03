import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { processGmailWebhook, runInitialGmailScan, startGmailWatch, syncRecentGmailConfirmations } from '../services/gmail.js';

export const gmailRouter = Router();

gmailRouter.post('/webhook', async (req, res, next) => {
  try {
    const encoded = req.body?.message?.data;
    if (!encoded) return res.status(400).json({ message: 'missing_pubsub_data' });
    const message = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as {
      emailAddress?: string;
      historyId?: string;
    };
    if (!message.emailAddress || !message.historyId) {
      return res.status(400).json({ message: 'invalid_pubsub_message' });
    }
    const result = await processGmailWebhook(message.emailAddress, message.historyId);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
});

gmailRouter.use(requireAuth);

gmailRouter.post('/acknowledge-connected', async (req, res, next) => {
  try {
    await startGmailWatch(req.user!.id);
    await query(
      `update users
       set gmail_connected = true,
           initial_scan_completed = false
       where id = $1`,
      [req.user!.id],
    );
    void runInitialGmailScan(req.user!.id).catch((error) => {
      console.error('Initial Gmail scan failed:', error);
    });
    res.json({ ok: true, gmail_connected: true });
  } catch (error) {
    await query('update users set gmail_connected = false where id = $1', [req.user!.id]);
    if (error instanceof Error) {
      return res.status(500).json({ message: 'gmail_watch_setup_failed', detail: error.message });
    }
    next(error);
  }
});

gmailRouter.post('/connect', async (req, res, next) => {
  try {
    await startGmailWatch(req.user!.id);
    await query('update users set gmail_connected = false, initial_scan_completed = false where id = $1', [
      req.user!.id,
    ]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

gmailRouter.post('/sync-recent', async (req, res, next) => {
  try {
    const result = await syncRecentGmailConfirmations(req.user!.id, 50);
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

gmailRouter.get('/scan-status', async (req, res, next) => {
  try {
    const status = await query<{
      initial_scan_completed: boolean;
      initial_scan_found_count: number;
      gmail_connected: boolean;
    }>(
      `select initial_scan_completed,
              initial_scan_found_count,
              (
                gmail_connected
                and gmail_watch_history_id is not null
                and (gmail_watch_expiration is null or gmail_watch_expiration > now())
              ) as gmail_connected
       from users where id = $1`,
      [req.user!.id],
    );
    res.json(status.rows[0]);
  } catch (error) {
    next(error);
  }
});

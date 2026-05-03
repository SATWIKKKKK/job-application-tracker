import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { createApplicationSheet } from '../services/google.js';

export const userRouter = Router();
userRouter.use(requireAuth);

function daysRemaining(planExpiresAt: string | Date | null) {
  if (!planExpiresAt) return null;
  return Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86400000));
}

userRouter.get('/me', async (req, res, next) => {
  try {
    const result = await query<{
      id: string;
      email: string;
      name: string | null;
      plan: string;
      plan_type: string | null;
      plan_started_at: string | null;
      plan_expires_at: string | null;
    }>(
      `select id, email, name, plan, plan_type, plan_started_at, plan_expires_at
       from users where id = $1`,
      [req.user!.id],
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'user_not_found' });
    return res.json({
      user: {
        ...user,
        days_remaining: daysRemaining(user.plan_expires_at),
      },
    });
  } catch (error) {
    next(error);
  }
});

userRouter.get('/notifications', async (req, res, next) => {
  try {
    const result = await query(
      `select id, type, message, is_read, metadata, created_at
       from notifications
       where user_id = $1 and is_read = false
       order by created_at desc
       limit 20`,
      [req.user!.id],
    );
    return res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

userRouter.patch('/notifications/mark-read', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === 'string') : [];
    if (!ids.length) return res.json({ ok: true });
    await query(
      `update notifications
       set is_read = true
       where user_id = $1 and id = any($2::uuid[])`,
      [req.user!.id, ids],
    );
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

function isGoogleReconnectError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message.includes('invalid_grant') || message.includes('invalid_request')) return true;
  const withResponse = error as Error & { response?: { data?: { error?: string } } };
  const code = withResponse.response?.data?.error?.toLowerCase();
  return code === 'invalid_grant' || code === 'invalid_request';
}

userRouter.get('/sheet-url', async (req, res, next) => {
  try {
    const user = await query<{ google_sheet_id: string | null; google_refresh_token: string | null }>(
      'select google_sheet_id, google_refresh_token from users where id = $1',
      [req.user!.id],
    );

    const row = user.rows[0];
    if (!row) return res.status(404).json({ message: 'user_not_found' });

    if (row.google_sheet_id) {
      return res.json({
        sheet_id: row.google_sheet_id,
        sheet_url: `https://docs.google.com/spreadsheets/d/${row.google_sheet_id}`,
        requires_reconnect: false,
      });
    }

    if (!row.google_refresh_token) {
      return res.status(409).json({
        sheet_id: null,
        sheet_url: null,
        requires_reconnect: true,
        reason: 'missing_google_refresh_token',
      });
    }

    try {
      const created = await createApplicationSheet(req.user!.id);
      return res.json({
        sheet_id: created.spreadsheetId,
        sheet_url: `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}`,
        requires_reconnect: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'sheet_create_failed';
      if (isGoogleReconnectError(error)) {
        await query(
          'update users set google_refresh_token = null, gmail_connected = false where id = $1',
          [req.user!.id],
        );
      }
      return res.status(409).json({
        sheet_id: null,
        sheet_url: null,
        requires_reconnect: true,
        reason: message,
      });
    }
  } catch (error) {
    next(error);
  }
});

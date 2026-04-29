import { Router } from 'express';
import { z } from 'zod';
import type { JobApplication } from '@jobtrackr/types';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { appendApplicationRow } from '../services/google.js';
import { sendEmail } from '../services/email.js';
import { applicationConfirmedEmail } from '../templates/emails.js';

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

const logSchema = z.object({
  job_title: z.string().min(1),
  company: z.string().min(1),
  portal: z.string().min(1),
  job_url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  applied_at: z.string().datetime().optional(),
});

applicationsRouter.post('/log', async (req, res, next) => {
  try {
    const body = logSchema.parse(req.body);
    const userId = req.user!.id;
    const user = await query<{ plan: string; email: string }>(
      'select plan, email from users where id = $1',
      [userId],
    );

    if (user.rows[0]?.plan === 'free') {
      const portals = await query<{ portal: string }>(
        'select distinct portal from applications where user_id = $1',
        [userId],
      );
      const used = new Set(portals.rows.map((row) => row.portal.toLowerCase()));
      if (!used.has(body.portal.toLowerCase()) && used.size >= 3) {
        return res.status(403).json({ message: 'upgrade_required' });
      }
    }

    const inserted = await query<JobApplication>(
      `insert into applications
        (user_id, job_title, company, portal, job_url, location, applied_at, raw_data)
       values ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()), $8)
       returning *`,
      [
        userId,
        body.job_title,
        body.company,
        body.portal,
        body.job_url || null,
        body.location || null,
        body.applied_at ?? null,
        body,
      ],
    );
    const app = inserted.rows[0];

    try {
      await appendApplicationRow(userId, [
        app.job_title,
        app.company,
        app.portal,
        app.location ?? '',
        app.job_url ?? '',
        app.applied_at,
        app.status,
      ]);
    } catch (error) {
      console.warn('Sheet append skipped/failed:', error);
    }

    await sendEmail(
      user.rows[0].email,
      `Application logged: ${app.job_title}`,
      applicationConfirmedEmail(app),
    );

    return res.status(201).json({ application: app });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.page_size ?? 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const total = await query<{ count: string }>(
      'select count(*) from applications where user_id = $1',
      [req.user!.id],
    );
    const apps = await query<JobApplication>(
      `select * from applications
       where user_id = $1
       order by applied_at desc
       limit $2 offset $3`,
      [req.user!.id, pageSize, offset],
    );

    res.json({
      data: apps.rows,
      page,
      page_size: pageSize,
      total: Number(total.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

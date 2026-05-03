import { Router } from 'express';
import { z } from 'zod';
import type { JobApplication } from '../types.js';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { appendApplicationRow, updateApplicationStatusRow } from '../services/google.js';
import { isPromotionalJobText } from '../services/gmail.js';
import { sendEmail } from '../services/email.js';
import { applicationConfirmedEmail } from '../templates/emails.js';

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

const logSchema = z.object({
  job_title: z.string().min(1),
  company: z.string().min(1),
  role_type: z
    .enum(['Full Time', 'Part Time', 'Internship', 'Contract', 'Stipend Based'])
    .optional()
    .default('Full Time'),
  portal: z.string().min(1),
  job_url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  applied_at: z.string().datetime().optional(),
});

const manualLogSchema = z.object({
  job_title: z.string().min(1),
  company: z.string().min(1),
  role_type: z.enum(['Full Time', 'Part Time', 'Internship', 'Contract', 'Stipend Based']),
  portal: z.string().min(1),
  applied_at: z.string().min(1),
  status: z.enum(['Applied', 'Saved', 'Shortlisted', 'Rejected', 'Accepted', 'In Progress']),
  job_url: z.string().url().optional().or(z.literal('')),
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
        (user_id, job_title, company, role_type, portal, job_url, location, applied_at, status, raw_data)
       values ($1, $2, $3, $4, $5, $6, $7, coalesce($8::timestamptz, now()), 'Applied', $9)
       returning *`,
      [
        userId,
        body.job_title,
        body.company,
        body.role_type,
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
        app.role_type,
        app.portal,
        new Date(app.applied_at).toISOString().slice(0, 10),
        app.status,
        app.job_url ?? '',
      ]);
    } catch (error) {
      console.warn('Sheet append skipped/failed:', error);
    }

    try {
      await sendEmail(
        user.rows[0].email,
        `Application logged: ${app.job_title}`,
        applicationConfirmedEmail(app),
      );
    } catch (error) {
      console.warn('Confirmation email skipped/failed:', error);
    }

    return res.status(201).json({ application: app });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.post('/manual', async (req, res, next) => {
  try {
    const body = manualLogSchema.parse(req.body);
    const appliedAt = new Date(body.applied_at);
    if (Number.isNaN(appliedAt.getTime())) {
      return res.status(400).json({ message: 'invalid_applied_at' });
    }

    const inserted = await query<JobApplication>(
      `insert into applications
        (user_id, job_title, company, role_type, portal, job_url, applied_at, status, raw_data)
       values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9)
       returning *`,
      [
        req.user!.id,
        body.job_title,
        body.company,
        body.role_type,
        body.portal,
        body.job_url || null,
        appliedAt.toISOString(),
        body.status,
        { ...body, source: 'manual' },
      ],
    );
    const app = inserted.rows[0];

    await appendApplicationRow(req.user!.id, [
      app.job_title,
      app.company,
      app.role_type,
      app.portal,
      new Date(app.applied_at).toISOString().slice(0, 10),
      app.status,
      app.job_url ?? '',
    ]);

    return res.status(201).json({ application: app, message: 'application_logged_to_sheet' });
  } catch (error) {
    return next(error);
  }
});

applicationsRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.page_size ?? 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const search = `%${q}%`;
    const total = await query<{ count: string }>(
      `select count(*)
       from applications
       where user_id = $1
         and (
           $2 = ''
           or company ilike $3
         )
         and (
           $4 = ''
           or date(applied_at) = $4::date
         )`,
      [req.user!.id, q, search, date],
    );
    const apps = await query<JobApplication>(
      `select * from applications
       where user_id = $1
         and (
           $2 = ''
           or company ilike $3
         )
         and (
           $6 = ''
           or date(applied_at) = $6::date
         )
       order by applied_at desc
       limit $4 offset $5`,
      [req.user!.id, q, search, pageSize, offset, date],
    );
    const filtered = apps.rows.filter((app) => !isPromotionalJobText(app.job_title) && !isPromotionalJobText(app.raw_text));

    res.json({
      data: filtered,
      page,
      page_size: pageSize,
      total: Number(total.rows[0].count),
      q,
      date,
    });
  } catch (error) {
    next(error);
  }
});

applicationsRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await query<{
      total_applications: string;
      this_week: string;
      portals_active: string;
    }>(
      `select
         count(*)::text as total_applications,
         count(*) filter (where applied_at >= now() - interval '7 days')::text as this_week,
         count(distinct lower(portal))::text as portals_active
       from applications
       where user_id = $1`,
      [req.user!.id],
    );

    const row = stats.rows[0];
    res.json({
      total_applications: Number(row?.total_applications ?? 0),
      this_week: Number(row?.this_week ?? 0),
      portals_active: Number(row?.portals_active ?? 0),
    });
  } catch (error) {
    next(error);
  }
});

applicationsRouter.get('/heatmap', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days ?? 84), 15), 120);
    const rows = await query<{ date: string; count: string }>(
      `select to_char(date(applied_at), 'YYYY-MM-DD') as date, count(*)::text as count
       from applications
       where user_id = $1
         and applied_at >= (current_date - ($2::int - 1) * interval '1 day')
       group by date(applied_at)
       order by date(applied_at) asc`,
      [req.user!.id, days],
    );

    res.json(
      rows.rows.map((row) => ({
        date: row.date,
        count: Number(row.count),
      })),
    );
  } catch (error) {
    next(error);
  }
});

applicationsRouter.get('/scan-status', async (req, res, next) => {
  try {
    const status = await query<{
      initial_scan_completed: boolean;
      initial_scan_found_count: number;
      gmail_connected: boolean;
    }>(
      `select initial_scan_completed, initial_scan_found_count, gmail_connected
       from users where id = $1`,
      [req.user!.id],
    );
    res.json(status.rows[0]);
  } catch (error) {
    next(error);
  }
});

applicationsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(['Applied', 'Saved', 'Shortlisted', 'Rejected', 'Accepted', 'In Progress']) })
      .parse(req.body);
    const updated = await query<JobApplication>(
      `update applications
       set status = $1
       where id = $2 and user_id = $3
       returning *`,
      [status, req.params.id, req.user!.id],
    );
    const app = updated.rows[0];
    if (!app) return res.status(404).json({ message: 'not_found' });

    try {
      await updateApplicationStatusRow(req.user!.id, app);
    } catch (error) {
      console.warn('Sheet status update skipped/failed:', error);
    }

    return res.json({ application: app });
  } catch (error) {
    return next(error);
  }
});

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { appendApplicationRow, createApplicationSheet } from '../services/google.js';

export const sheetsRouter = Router();
sheetsRouter.use(requireAuth);

sheetsRouter.post('/setup', async (req, res, next) => {
  try {
    const sheet = await createApplicationSheet(req.user!.id);
    res.json({ sheet_url: sheet.url, spreadsheet_id: sheet.spreadsheetId });
  } catch (error) {
    if (error instanceof Error && error.message === 'missing_google_refresh_token') {
      return res.status(409).json({ message: 'missing_google_refresh_token' });
    }
    next(error);
  }
});

const logSchema = z.object({
  job_title: z.string(),
  company: z.string(),
  role_type: z.string().optional().default('Full Time'),
  portal: z.string(),
  location: z.string().optional().default(''),
  job_url: z.string().optional().default(''),
  applied_at: z.string().optional().default(() => new Date().toISOString()),
  status: z.string().optional().default('Applied'),
});

sheetsRouter.post('/log', async (req, res, next) => {
  try {
    const body = logSchema.parse(req.body);
    await appendApplicationRow(req.user!.id, [
      body.job_title,
      body.company,
      body.role_type,
      body.portal,
      new Date(body.applied_at).toISOString().slice(0, 10),
      body.status,
      body.job_url,
    ]);
    res.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Error &&
      ['missing_google_refresh_token', 'missing_google_sheet_id'].includes(error.message)
    ) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
});

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
    next(error);
  }
});

const logSchema = z.object({
  job_title: z.string(),
  company: z.string(),
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
      body.portal,
      body.location,
      body.job_url,
      body.applied_at,
      body.status,
    ]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

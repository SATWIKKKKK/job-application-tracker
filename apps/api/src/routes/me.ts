import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', async (req, res, next) => {
  try {
    const user = await query(
      `select id, email, name, google_sheet_id, plan, plan_expires_at, created_at
       from users where id = $1`,
      [req.user!.id],
    );
    res.json({ user: user.rows[0] });
  } catch (error) {
    next(error);
  }
});

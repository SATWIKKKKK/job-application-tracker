import { Router } from 'express';
import { google } from 'googleapis';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { requireAuth, signAppJwt } from '../middleware/auth.js';
import { getGoogleAuthUrl, getOAuthClient } from '../services/google.js';

export const authRouter = Router();

authRouter.get('/google', (_req, res) => {
  res.redirect(getGoogleAuthUrl());
});

authRouter.get('/google/callback', async (req, res, next) => {
  try {
    const code = String(req.query.code ?? '');
    const oauth = getOAuthClient();
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth, version: 'v2' });
    const profile = await oauth2.userinfo.get();
    const email = profile.data.email;
    if (!email) return res.status(400).send('Google account did not return an email.');

    const user = await query<{
      id: string;
      email: string;
      name: string | null;
    }>(
      `insert into users (email, name, google_refresh_token)
       values ($1, $2, $3)
       on conflict (email)
       do update set
         name = excluded.name,
         google_refresh_token = coalesce(excluded.google_refresh_token, users.google_refresh_token)
       returning id, email, name`,
      [email, profile.data.name ?? null, tokens.refresh_token ?? null],
    );

    const appUser = user.rows[0];
    const token = signAppJwt(appUser);
    res.cookie('jt_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${config.webUrl}/dashboard`);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('jt_token');
  res.json({ ok: true });
});

authRouter.get('/extension-token', requireAuth, (req, res) => {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.jt_token;
  res.json({ token });
});

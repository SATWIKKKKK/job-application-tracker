import { Router, type Response } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { requireAuth, signAppJwt, type AuthUser } from '../middleware/auth.js';
import { getGoogleAuthUrl, getOAuthClient } from '../services/google.js';
import { sendEmail } from '../services/email.js';
import { verificationOtpEmail } from '../templates/emails.js';
import { createOtp, hashSecret, verifySecret } from '../services/password.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function setAuthCookie(res: Response, user: AuthUser) {
  const token = signAppJwt(user);
  res.cookie('jt_token', token, cookieOptions);
  return token;
}

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

    let appUser: AuthUser;
    const existingToken = req.cookies?.jt_token;
    const existingUser = existingToken
      ? (() => {
          try {
            return jwt.verify(existingToken, config.jwtSecret) as AuthUser;
          } catch {
            return null;
          }
        })()
      : null;

    if (existingUser?.id) {
      const linked = await query<AuthUser>(
        `update users
         set google_refresh_token = coalesce($1, google_refresh_token),
             name = coalesce(name, $2)
         where id = $3
         returning id, email, name`,
        [tokens.refresh_token ?? null, profile.data.name ?? null, existingUser.id],
      );
      appUser = linked.rows[0];
    } else {
      const user = await query<AuthUser>(
        `insert into users (email, name, google_refresh_token, email_verified_at)
       values ($1, $2, $3, now())
       on conflict (email)
       do update set
         name = excluded.name,
         google_refresh_token = coalesce(excluded.google_refresh_token, users.google_refresh_token)
       returning id, email, name`,
        [email, profile.data.name ?? null, tokens.refresh_token ?? null],
      );
      appUser = user.rows[0];
    }

    setAuthCookie(res, appUser);
    res.redirect(`${config.webUrl}/dashboard/setup`);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/signup', async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1).optional(),
      })
      .parse(req.body);

    const passwordHash = await hashSecret(body.password);
    const otp = createOtp();
    const otpHash = await hashSecret(otp);
    const user = await query<AuthUser>(
      `insert into users (email, name, password_hash, otp_hash, otp_expires_at)
       values ($1, $2, $3, $4, now() + interval '10 minutes')
       on conflict (email)
       do update set
         name = coalesce(excluded.name, users.name),
         password_hash = excluded.password_hash,
         otp_hash = excluded.otp_hash,
         otp_expires_at = excluded.otp_expires_at
       returning id, email, name`,
      [body.email.toLowerCase(), body.name ?? null, passwordHash, otpHash],
    );

    await sendEmail(body.email, 'Your JobTrackr verification code', verificationOtpEmail(otp));
    res.status(201).json({
      user: user.rows[0],
      message: 'otp_sent',
      dev_otp_sent: !process.env.GMAIL_USER,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), otp: z.string().length(6) }).parse(req.body);
    const found = await query<AuthUser & { otp_hash: string | null; otp_expires_at: string | null }>(
      'select id, email, name, otp_hash, otp_expires_at from users where email = $1',
      [body.email.toLowerCase()],
    );
    const user = found.rows[0];
    if (!user || new Date(user.otp_expires_at ?? 0).getTime() < Date.now()) {
      return res.status(400).json({ message: 'otp_expired' });
    }
    const valid = await verifySecret(body.otp, user.otp_hash);
    if (!valid) return res.status(400).json({ message: 'invalid_otp' });

    const verified = await query<AuthUser>(
      `update users
       set email_verified_at = now(), otp_hash = null, otp_expires_at = null
       where id = $1
       returning id, email, name`,
      [user.id],
    );
    setAuthCookie(res, verified.rows[0]);
    return res.json({ user: verified.rows[0], redirect_to: '/dashboard/setup' });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const found = await query<AuthUser & { password_hash: string | null; email_verified_at: string | null }>(
      'select id, email, name, password_hash, email_verified_at from users where email = $1',
      [body.email.toLowerCase()],
    );
    const user = found.rows[0];
    if (!user || !(await verifySecret(body.password, user.password_hash))) {
      return res.status(401).json({ message: 'invalid_credentials' });
    }
    if (!user.email_verified_at) return res.status(403).json({ message: 'email_not_verified' });
    setAuthCookie(res, user);
    return res.json({ user, redirect_to: '/dashboard' });
  } catch (error) {
    return next(error);
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

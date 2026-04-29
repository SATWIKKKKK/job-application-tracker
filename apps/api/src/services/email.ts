import nodemailer from 'nodemailer';
import { config } from '../config.js';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!config.gmailUser || !config.gmailAppPassword) {
    console.warn('Email skipped: Gmail SMTP env vars are not configured.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `"JobTrackr" <${config.gmailUser}>`,
    to,
    subject,
    html,
  });
}

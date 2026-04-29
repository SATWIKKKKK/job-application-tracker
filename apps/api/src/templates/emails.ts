import type { JobApplication } from '@jobtrackr/types';
import { config } from '../config.js';

const shell = (title: string, body: string) => `
  <div style="margin:0;padding:32px;background:#F8F9FF;font-family:Inter,Arial,sans-serif;color:#0B1C30">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #C2C6D8;border-radius:12px;overflow:hidden">
      <div style="padding:24px 28px;background:#0049C5;color:#ffffff">
        <h1 style="margin:0;font-family:Manrope,Arial,sans-serif;font-size:24px">${title}</h1>
      </div>
      <div style="padding:28px">${body}</div>
    </div>
  </div>
`;

export function applicationConfirmedEmail(app: Pick<JobApplication, 'job_title' | 'company' | 'portal'>) {
  return shell(
    'Application Confirmed',
    `
      <p style="font-size:16px;line-height:24px">Your application has been logged successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px;color:#424656">Job Title</td><td style="padding:8px;font-weight:700">${app.job_title}</td></tr>
        <tr><td style="padding:8px;color:#424656">Company</td><td style="padding:8px;font-weight:700">${app.company}</td></tr>
        <tr><td style="padding:8px;color:#424656">Portal</td><td style="padding:8px;font-weight:700">${app.portal}</td></tr>
      </table>
      <a href="${config.webUrl}/dashboard" style="display:inline-block;background:#0049C5;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Open dashboard</a>
    `,
  );
}

export function weeklyDigestEmail(apps: JobApplication[]) {
  const rows = apps
    .map(
      (app) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #C2C6D8">${app.job_title}</td>
        <td style="padding:10px;border-bottom:1px solid #C2C6D8">${app.company}</td>
        <td style="padding:10px;border-bottom:1px solid #C2C6D8">${app.portal}</td>
      </tr>`,
    )
    .join('');

  return shell(
    'Weekly Application Digest',
    `
      <p style="font-size:16px;line-height:24px">You logged <strong>${apps.length}</strong> applications this week.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:20px">
        <thead><tr><th align="left">Job</th><th align="left">Company</th><th align="left">Portal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `,
  );
}

import cron from 'node-cron';
import type { JobApplication } from '@jobtrackr/types';
import { query } from '../db/pool.js';
import { sendEmail } from '../services/email.js';
import { weeklyDigestEmail } from '../templates/emails.js';

export function startWeeklyDigestJob() {
  cron.schedule(
    '0 9 * * 1',
    async () => {
      const users = await query<{ id: string; email: string }>('select id, email from users');
      for (const user of users.rows) {
        const apps = await query<JobApplication>(
          `select * from applications
           where user_id = $1 and applied_at >= now() - interval '7 days'
           order by applied_at desc`,
          [user.id],
        );
        if (apps.rows.length > 0) {
          await sendEmail(user.email, 'Your JobTrackr weekly digest', weeklyDigestEmail(apps.rows));
        }
      }
    },
    { timezone: 'Asia/Kolkata' },
  );
}

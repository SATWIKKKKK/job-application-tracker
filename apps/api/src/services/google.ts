import { google } from 'googleapis';
import { config } from '../config.js';
import { query } from '../db/pool.js';

export const SHEET_HEADERS = [
  'Job Title',
  'Company',
  'Portal',
  'Location',
  'Job URL',
  'Date Applied',
  'Status',
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri,
  );
}

export function getGoogleAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
}

export async function getAuthedSheetsClient(userId: string) {
  const result = await query<{ google_refresh_token: string }>(
    'select google_refresh_token from users where id = $1',
    [userId],
  );
  const refreshToken = result.rows[0]?.google_refresh_token;
  if (!refreshToken) {
    throw new Error('missing_google_refresh_token');
  }

  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.sheets({ version: 'v4', auth });
}

export async function createApplicationSheet(userId: string) {
  const sheets = await getAuthedSheetsClient(userId);
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'JobTrackr Applications' },
      sheets: [{ properties: { title: 'Applications' } }],
    },
  });
  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) throw new Error('sheet_create_failed');

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Applications!A1:G1',
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADERS] },
  });

  await query('update users set google_sheet_id = $1 where id = $2', [
    spreadsheetId,
    userId,
  ]);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

export async function appendApplicationRow(userId: string, row: string[]) {
  const user = await query<{ google_sheet_id: string | null }>(
    'select google_sheet_id from users where id = $1',
    [userId],
  );
  const spreadsheetId = user.rows[0]?.google_sheet_id;
  if (!spreadsheetId) throw new Error('missing_google_sheet_id');

  const sheets = await getAuthedSheetsClient(userId);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Applications!A:G',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

export async function updateApplicationStatusRow(
  userId: string,
  app: { job_title: string; company: string; job_url: string | null; status: string },
) {
  const user = await query<{ google_sheet_id: string | null }>(
    'select google_sheet_id from users where id = $1',
    [userId],
  );
  const spreadsheetId = user.rows[0]?.google_sheet_id;
  if (!spreadsheetId) throw new Error('missing_google_sheet_id');

  const sheets = await getAuthedSheetsClient(userId);
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Applications!A2:G',
  });
  const rows = values.data.values ?? [];
  const index = rows.findIndex((row) => {
    const [title, company, , , url] = row;
    return title === app.job_title && company === app.company && (!app.job_url || url === app.job_url);
  });

  if (index < 0) throw new Error('sheet_row_not_found');

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Applications!G${index + 2}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[app.status]] },
  });
}

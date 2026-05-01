import { google } from 'googleapis';
import { config } from '../config.js';
import { query } from '../db/pool.js';

export const SHEET_HEADERS = [
  'Job Title',
  'Company',
  'Role Type',
  'Portal',
  'Applied Date',
  'Status',
  'Job URL',
];

const STATUS_COLUMN_INDEX = 5;
const STATUS_COLOR_RULES = [
  {
    value: 'Applied',
    backgroundColor: { red: 227 / 255, green: 242 / 255, blue: 253 / 255 },
    textColor: { red: 21 / 255, green: 101 / 255, blue: 192 / 255 },
  },
  {
    value: 'Saved',
    backgroundColor: { red: 232 / 255, green: 234 / 255, blue: 246 / 255 },
    textColor: { red: 40 / 255, green: 53 / 255, blue: 147 / 255 },
  },
  {
    value: 'Shortlisted',
    backgroundColor: { red: 255 / 255, green: 249 / 255, blue: 196 / 255 },
    textColor: { red: 245 / 255, green: 127 / 255, blue: 23 / 255 },
  },
  {
    value: 'Rejected',
    backgroundColor: { red: 255 / 255, green: 205 / 255, blue: 210 / 255 },
    textColor: { red: 183 / 255, green: 28 / 255, blue: 28 / 255 },
  },
  {
    value: 'Accepted',
    backgroundColor: { red: 200 / 255, green: 230 / 255, blue: 201 / 255 },
    textColor: { red: 27 / 255, green: 94 / 255, blue: 32 / 255 },
  },
  {
    value: 'In Progress',
    backgroundColor: { red: 255 / 255, green: 224 / 255, blue: 178 / 255 },
    textColor: { red: 230 / 255, green: 81 / 255, blue: 0 / 255 },
  },
] as const;

export function getOAuthClient() {
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri,
  );
}

export function getGoogleAuthUrl(state?: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
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

export async function getAuthedGmailClient(userId: string) {
  const result = await query<{ google_refresh_token: string }>(
    'select google_refresh_token from users where id = $1',
    [userId],
  );
  const refreshToken = result.rows[0]?.google_refresh_token;
  if (!refreshToken) throw new Error('missing_google_refresh_token');

  const auth = getOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth });
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

  await applyStatusFormatting(sheets, spreadsheetId);

  await query('update users set google_sheet_id = $1 where id = $2', [
    spreadsheetId,
    userId,
  ]);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

async function ensureApplicationSheet(userId: string) {
  const user = await query<{ google_sheet_id: string | null }>(
    'select google_sheet_id from users where id = $1',
    [userId],
  );
  return user.rows[0]?.google_sheet_id ?? (await createApplicationSheet(userId)).spreadsheetId;
}

export async function appendApplicationRow(userId: string, row: string[]) {
  await appendApplicationRows(userId, [row]);
}

export async function appendApplicationRows(userId: string, rows: string[][]) {
  if (!rows.length) return;
  const spreadsheetId = await ensureApplicationSheet(userId);
  const sheets = await getAuthedSheetsClient(userId);
  const startRow = await getNextApplicationSheetRow(sheets, spreadsheetId);
  const endRow = startRow + rows.length - 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Applications!A${startRow}:G${endRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
  await applyStatusFormatting(sheets, spreadsheetId);
}

async function getNextApplicationSheetRow(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
) {
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Applications!A:A',
  });
  const rows = values.data.values ?? [];
  for (let index = rows.length - 1; index >= 1; index -= 1) {
    if (String(rows[index]?.[0] ?? '').trim()) return index + 2;
  }
  return 2;
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
    const [title, company] = row;
    return title === app.job_title && company === app.company;
  });

  if (index < 0) throw new Error('sheet_row_not_found');

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Applications!F${index + 2}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[app.status]] },
  });
  await applyStatusFormatting(sheets, spreadsheetId);
}

async function applyStatusFormatting(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
) {
  const sheet = await sheets.spreadsheets.get({ spreadsheetId });
  const applicationSheet = sheet.data.sheets?.find((item) => item.properties?.title === 'Applications');
  const sheetId = applicationSheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) return;
  const existingRuleCount = applicationSheet?.conditionalFormats?.length ?? 0;
  const removeExistingRules = Array.from({ length: existingRuleCount }, (_, index) => ({
    deleteConditionalFormatRule: {
      sheetId,
      index: existingRuleCount - index - 1,
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 4,
              endColumnIndex: 5,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: 'TEXT',
                },
              },
            },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        ...removeExistingRules,
        ...STATUS_COLOR_RULES.map((color) => ({
          addConditionalFormatRule: {
            index: 0,
            rule: {
              ranges: [
                {
                  sheetId,
                  startRowIndex: 1,
                  startColumnIndex: STATUS_COLUMN_INDEX,
                  endColumnIndex: STATUS_COLUMN_INDEX + 1,
                },
              ],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: color.value }],
                },
                format: {
                  backgroundColor: color.backgroundColor,
                  textFormat: { foregroundColor: color.textColor },
                },
              },
            },
          },
        })),
      ],
    },
  });

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            setBasicFilter: {
              filter: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  startColumnIndex: 0,
                  endColumnIndex: 7,
                },
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    console.warn('Sheet basic filter setup skipped/failed:', message);
  }
}

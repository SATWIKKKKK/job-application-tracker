import { query } from './pool.js';

export async function ensureDatabaseShape() {
  await query('create extension if not exists "pgcrypto"');
  await query(`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      name text,
      google_sheet_id text,
      google_refresh_token text,
      gmail_connected boolean not null default false,
      gmail_watch_history_id text,
      gmail_watch_expiration timestamptz,
      initial_scan_completed boolean not null default false,
      initial_scan_found_count integer not null default 0,
      plan text not null default 'free' check (plan in ('free', 'pro')),
      plan_expires_at timestamptz,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists portals (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      portal_name text not null,
      is_enabled boolean not null default true,
      created_at timestamptz not null default now(),
      unique (user_id, portal_name)
    )
  `);
  await query(`
    create table if not exists applications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      job_title text not null,
      company text not null,
      role_type text not null default 'Full Time' check (role_type in ('Full Time', 'Part Time', 'Internship', 'Contract', 'Stipend Based')),
      portal text not null,
      job_url text,
      location text,
      applied_at timestamptz not null default now(),
      status text not null default 'Applied',
      raw_data jsonb,
      confidence real,
      needs_review boolean not null default false,
      raw_text text,
      gmail_message_id text,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists webhook_logs (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references users(id) on delete set null,
      pubsub_email text not null,
      sender_email text,
      subject text,
      processing_result text not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    alter table users
      add column if not exists password_hash text,
      add column if not exists otp_hash text,
      add column if not exists otp_expires_at timestamptz,
      add column if not exists email_verified_at timestamptz,
      add column if not exists gmail_connected boolean not null default false,
      add column if not exists gmail_watch_history_id text,
      add column if not exists gmail_watch_expiration timestamptz,
      add column if not exists initial_scan_completed boolean not null default false,
      add column if not exists initial_scan_found_count integer not null default 0
  `);
  await query(`
    alter table applications
      add column if not exists role_type text not null default 'Full Time',
      add column if not exists confidence real,
      add column if not exists needs_review boolean not null default false,
      add column if not exists raw_text text,
      add column if not exists gmail_message_id text
  `);
  await query('alter table applications drop constraint if exists applications_status_check');
  await query('alter table applications drop constraint if exists applications_role_type_check');
  await query(`
    alter table applications
      add constraint applications_role_type_check
      check (role_type in ('Full Time', 'Part Time', 'Internship', 'Contract', 'Stipend Based'))
  `);
  await query('create index if not exists idx_portals_user_id on portals(user_id)');
  await query('create index if not exists idx_applications_user_id on applications(user_id)');
  await query('create index if not exists idx_applications_user_applied_at on applications(user_id, applied_at desc)');
  await query('create index if not exists idx_applications_needs_review on applications(needs_review) where needs_review = true');
  await query('create index if not exists idx_webhook_logs_created_at on webhook_logs(created_at desc)');
  await query('create index if not exists idx_webhook_logs_user_id on webhook_logs(user_id)');
  await query(`
    create unique index if not exists idx_applications_user_source_unique
    on applications(user_id, (coalesce(job_url, '')), applied_at)
  `);
  await query(`
    create unique index if not exists idx_applications_gmail_message_id
    on applications(gmail_message_id)
    where gmail_message_id is not null
  `);
}

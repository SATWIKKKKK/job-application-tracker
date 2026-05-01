create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  password_hash text,
  otp_hash text,
  otp_expires_at timestamptz,
  email_verified_at timestamptz,
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
);

create table if not exists portals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  portal_name text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, portal_name)
);

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
);

create table if not exists webhook_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  pubsub_email text not null,
  sender_email text,
  subject text,
  processing_result text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_portals_user_id on portals(user_id);
create index if not exists idx_applications_user_id on applications(user_id);
create index if not exists idx_applications_user_applied_at on applications(user_id, applied_at desc);
create index if not exists idx_applications_needs_review on applications(needs_review) where needs_review = true;
create index if not exists idx_webhook_logs_created_at on webhook_logs(created_at desc);
create index if not exists idx_webhook_logs_user_id on webhook_logs(user_id);
drop index if exists idx_applications_user_source_unique;
create unique index if not exists idx_applications_user_url_unique
  on applications(user_id, job_url)
  where job_url is not null and job_url <> '';
create unique index if not exists idx_applications_gmail_message_id on applications(gmail_message_id) where gmail_message_id is not null;

-- Neon does not expose Supabase auth.uid()-style RLS. Ownership is enforced in API queries
-- after verifying the JobTrackr JWT issued by apps/api.

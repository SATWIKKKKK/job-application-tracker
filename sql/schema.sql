create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  google_sheet_id text,
  google_refresh_token text,
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
  portal text not null,
  job_url text,
  location text,
  applied_at timestamptz not null default now(),
  status text not null default 'Applied' check (status in ('Applied', 'Viewed', 'Shortlisted', 'Rejected')),
  raw_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_portals_user_id on portals(user_id);
create index if not exists idx_applications_user_id on applications(user_id);
create index if not exists idx_applications_user_applied_at on applications(user_id, applied_at desc);

-- Neon does not expose Supabase auth.uid()-style RLS. Ownership is enforced in API queries
-- after verifying the JobTrackr JWT issued by apps/api.

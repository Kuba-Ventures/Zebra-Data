-- ============================================================================
-- Zebra Data — initial schema
-- Run this in Supabase SQL Editor (or `supabase db push` if using local CLI).
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type sex_at_birth as enum ('male', 'female', 'intersex', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

do $$ begin
  create type insurance_priority as enum ('primary', 'secondary');
exception when duplicate_object then null; end $$;

do $$ begin
  create type provider_kind as enum ('pcp', 'specialist', 'pharmacy');
exception when duplicate_object then null; end $$;

do $$ begin
  create type connection_status as enum ('connected', 'disconnected', 'error', 'syncing', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sync_status as enum ('pending', 'running', 'success', 'failure', 'partial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conflict_status as enum ('pending', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type record_type as enum (
    'vital', 'lab', 'medication', 'allergy', 'condition',
    'visit', 'imaging', 'wearable_metric', 'sleep', 'activity', 'nutrition', 'mental_health'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PHI ENCRYPTION HELPERS
-- ---------------------------------------------------------------------------
-- Reads encryption key from a session-scoped GUC (set by app before calls).
-- For production, replace with Supabase Vault.

create or replace function zebra_phi_encrypt(plaintext text)
returns bytea
language plpgsql
security definer
as $$
declare
  k text := current_setting('app.phi_key', true);
begin
  if plaintext is null or plaintext = '' then return null; end if;
  if k is null or k = '' then
    raise exception 'phi key not set on session';
  end if;
  return pgp_sym_encrypt(plaintext, k);
end $$;

create or replace function zebra_phi_decrypt(ciphertext bytea)
returns text
language plpgsql
security definer
as $$
declare
  k text := current_setting('app.phi_key', true);
begin
  if ciphertext is null then return null; end if;
  if k is null or k = '' then return null; end if;
  return pgp_sym_decrypt(ciphertext, k);
exception when others then return null;
end $$;

-- ---------------------------------------------------------------------------
-- PATIENT PROFILES
-- ---------------------------------------------------------------------------
create table if not exists patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  legal_first_name text,
  middle_initial text,
  last_name text,
  preferred_name text,

  dob date,
  sex_at_birth sex_at_birth,
  gender_identity text,
  phone text,
  email text,

  address_street text,
  address_city text,
  address_state text,
  address_zip text,

  ssn_last4_encrypted bytea,

  emergency_contact jsonb,

  intake_progress jsonb default '{}'::jsonb,
  intake_step int default 1,
  intake_completed_at timestamptz,
  consents jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_profiles_user_id_idx on patient_profiles(user_id);
create index if not exists patient_profiles_dob_idx on patient_profiles(dob);
create index if not exists patient_profiles_lastname_dob_idx
  on patient_profiles(lower(last_name), dob);

-- ---------------------------------------------------------------------------
-- INSURANCE
-- ---------------------------------------------------------------------------
create table if not exists insurance_policies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient_profiles(id) on delete cascade,
  priority insurance_priority not null default 'primary',
  carrier text,
  member_id_encrypted bytea,
  group_number_encrypted bytea,
  policy_holder_name text,
  policy_holder_relationship text,
  created_at timestamptz not null default now()
);
create index if not exists insurance_patient_idx on insurance_policies(patient_id);

-- ---------------------------------------------------------------------------
-- PROVIDERS
-- ---------------------------------------------------------------------------
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient_profiles(id) on delete cascade,
  kind provider_kind not null,
  name text,
  specialty text,
  practice text,
  location text,
  created_at timestamptz not null default now()
);
create index if not exists providers_patient_idx on providers(patient_id);

-- ---------------------------------------------------------------------------
-- CONNECTIONS
-- ---------------------------------------------------------------------------
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patient_profiles(id) on delete cascade,
  source_id text not null,                     -- 'whoop', 'oura', 'mychart:vcu', etc.
  display_name text,
  status connection_status not null default 'pending',
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  token_expires_at timestamptz,
  permissions jsonb default '[]'::jsonb,
  sync_interval text not null default 'daily',  -- 'daily' | 'weekly'
  last_sync_at timestamptz,
  last_sync_status sync_status,
  last_sync_error text,
  external_account_id text,
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_id)
);
create index if not exists connections_user_idx on connections(user_id);
create index if not exists connections_status_idx on connections(status);

-- ---------------------------------------------------------------------------
-- RAW RECORDS (immutable log)
-- ---------------------------------------------------------------------------
create table if not exists raw_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references connections(id) on delete cascade,
  source_id text not null,
  record_type record_type not null,
  external_id text,
  payload jsonb not null,
  effective_date timestamptz,
  source_attribution jsonb,
  ingested_at timestamptz not null default now()
);
create index if not exists raw_records_user_idx on raw_records(user_id);
create index if not exists raw_records_conn_idx on raw_records(connection_id);
create index if not exists raw_records_type_idx on raw_records(record_type);
create index if not exists raw_records_effective_idx on raw_records(effective_date desc);

-- ---------------------------------------------------------------------------
-- UNIFIED RECORDS (post-resolution, what the dashboard reads)
-- ---------------------------------------------------------------------------
create table if not exists unified_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient_profiles(id) on delete cascade,
  record_type record_type not null,
  normalized_payload jsonb not null,
  effective_date timestamptz,
  confidence_score numeric(4,3) default 1.000,
  source_record_ids uuid[] not null default '{}',
  survivorship_policy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists unified_patient_type_idx on unified_records(patient_id, record_type);
create index if not exists unified_effective_idx on unified_records(effective_date desc);

-- ---------------------------------------------------------------------------
-- CONFLICTS
-- ---------------------------------------------------------------------------
create table if not exists conflicts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient_profiles(id) on delete cascade,
  record_type record_type not null,
  field_in_conflict text not null,
  conflicting_record_ids uuid[] not null default '{}',
  details jsonb,
  status conflict_status not null default 'pending',
  resolution jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists conflicts_patient_status_idx on conflicts(patient_id, status);

-- ---------------------------------------------------------------------------
-- SYNC JOBS
-- ---------------------------------------------------------------------------
create table if not exists sync_jobs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status sync_status not null default 'pending',
  records_ingested int default 0,
  new_conflicts_count int default 0,
  error text
);
create index if not exists sync_jobs_conn_idx on sync_jobs(connection_id, started_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function tg_set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists trg_patient_profiles_updated on patient_profiles;
create trigger trg_patient_profiles_updated before update on patient_profiles
  for each row execute function tg_set_updated_at();

drop trigger if exists trg_connections_updated on connections;
create trigger trg_connections_updated before update on connections
  for each row execute function tg_set_updated_at();

drop trigger if exists trg_unified_updated on unified_records;
create trigger trg_unified_updated before update on unified_records
  for each row execute function tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — every table gates on owning user
-- ---------------------------------------------------------------------------
alter table patient_profiles enable row level security;
alter table insurance_policies enable row level security;
alter table providers enable row level security;
alter table connections enable row level security;
alter table raw_records enable row level security;
alter table unified_records enable row level security;
alter table conflicts enable row level security;
alter table sync_jobs enable row level security;

-- patient_profiles
drop policy if exists "own profile" on patient_profiles;
create policy "own profile" on patient_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- insurance + providers (joined via patient)
drop policy if exists "own insurance" on insurance_policies;
create policy "own insurance" on insurance_policies
  for all using (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  ) with check (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  );

drop policy if exists "own providers" on providers;
create policy "own providers" on providers
  for all using (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  ) with check (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  );

-- connections
drop policy if exists "own connections" on connections;
create policy "own connections" on connections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- raw_records
drop policy if exists "own raw records" on raw_records;
create policy "own raw records" on raw_records
  for select using (user_id = auth.uid());

-- unified_records
drop policy if exists "own unified records" on unified_records;
create policy "own unified records" on unified_records
  for select using (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  );

-- conflicts
drop policy if exists "own conflicts" on conflicts;
create policy "own conflicts" on conflicts
  for all using (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  ) with check (
    patient_id in (select id from patient_profiles where user_id = auth.uid())
  );

-- sync_jobs
drop policy if exists "own sync jobs" on sync_jobs;
create policy "own sync jobs" on sync_jobs
  for select using (
    connection_id in (select id from connections where user_id = auth.uid())
  );

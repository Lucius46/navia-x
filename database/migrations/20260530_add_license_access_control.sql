create extension if not exists "pgcrypto";

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'usage_logs'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'usage_logs'
      and column_name = 'log_date'
  ) then
    alter table usage_logs rename to daily_usage_rollups;
  end if;
end $$;

create table if not exists license_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan text not null check (plan in ('trial', 'student', 'pro', 'enterprise', 'lifetime')),
  status text not null default 'active' check (status in ('active', 'disabled', 'expired')),
  max_activations integer not null default 1 check (max_activations > 0),
  used_count integer not null default 0 check (used_count >= 0),
  duration_days integer check (duration_days is null or duration_days > 0),
  usage_limit_per_day integer not null default 50 check (usage_limit_per_day >= 0),
  expires_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists user_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  license_code_id uuid not null references license_codes(id) on delete cascade,
  plan text not null check (plan in ('trial', 'student', 'pro', 'enterprise', 'lifetime')),
  activated_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'disabled', 'expired')),
  unique (user_id, license_code_id)
);

create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  model text,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table users
  add column if not exists plan text not null default 'free';

alter table users
  add column if not exists access_status text not null default 'inactive';

alter table users
  add column if not exists access_expires_at timestamptz;

alter table users
  add column if not exists daily_usage_limit integer not null default 0;

alter table users
  alter column role set default 'user';

update users
set role = case
  when lower(role) = 'tester' then 'user'
  when lower(role) in ('user', 'admin') then lower(role)
  else 'user'
end;

update users
set plan = 'free'
where plan not in ('free', 'trial', 'student', 'pro', 'enterprise', 'lifetime');

update users
set access_status = case
  when access_status in ('inactive', 'active', 'disabled', 'expired') then access_status
  when status = 'active' and coalesce(daily_limit, 0) > 0 then 'active'
  else 'inactive'
end;

update users
set daily_usage_limit = daily_limit
where daily_usage_limit = 0
  and coalesce(daily_limit, 0) > 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table users
      add constraint users_role_check
      check (role in ('user', 'admin'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_plan_check'
  ) then
    alter table users
      add constraint users_plan_check
      check (plan in ('free', 'trial', 'student', 'pro', 'enterprise', 'lifetime'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_access_status_check'
  ) then
    alter table users
      add constraint users_access_status_check
      check (access_status in ('inactive', 'active', 'disabled', 'expired'));
  end if;
end $$;

create index if not exists idx_users_access_status on users(access_status);
create index if not exists idx_users_plan on users(plan);
create index if not exists idx_license_codes_code on license_codes(code);
create index if not exists idx_license_codes_status on license_codes(status);
create index if not exists idx_user_licenses_user_id on user_licenses(user_id);
create index if not exists idx_user_licenses_status on user_licenses(status);
create index if not exists idx_usage_logs_user_created_at on usage_logs(user_id, created_at desc);
create index if not exists idx_usage_logs_action_created_at on usage_logs(action, created_at desc);

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  role text not null default 'tester',
  status text not null default 'active',
  daily_limit integer not null default 20,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  invited_email text,
  status text not null default 'pending',
  max_uses integer not null default 1,
  used_count integer not null default 0,
  expires_at timestamptz,
  claimed_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  invitation_id uuid references invitations(id) on delete set null,
  source_type text not null default 'text',
  mode text not null,
  input_text text not null,
  selected_text text,
  summary text,
  deep_explanation text,
  keywords_json jsonb not null default '[]'::jsonb,
  examples_json jsonb not null default '[]'::jsonb,
  takeaway text,
  model_provider text not null,
  model_name text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  response_time_ms integer not null default 0,
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  log_date date not null,
  requests_count integer not null default 0,
  successful_count integer not null default 0,
  failed_count integer not null default 0,
  total_input_tokens integer not null default 0,
  total_output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  explanation_id uuid references explanations(id) on delete set null,
  endpoint text not null,
  method text not null default 'POST',
  status_code integer not null,
  model_provider text,
  model_name text,
  latency_ms integer not null default 0,
  success boolean not null default false,
  error_message text,
  request_payload jsonb,
  response_excerpt text,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  explanation_id uuid references explanations(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  sentiment text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_status on users(status);
create index if not exists idx_invitations_code on invitations(code);
create index if not exists idx_explanations_user_created_at on explanations(user_id, created_at desc);
create index if not exists idx_explanations_mode on explanations(mode);
create index if not exists idx_usage_logs_log_date on usage_logs(log_date desc);
create index if not exists idx_request_logs_created_at on request_logs(created_at desc);
create index if not exists idx_feedback_user_created_at on feedback(user_id, created_at desc);

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_invitations_updated_at on invitations;
create trigger trg_invitations_updated_at
before update on invitations
for each row execute function set_updated_at();

drop trigger if exists trg_usage_logs_updated_at on usage_logs;
create trigger trg_usage_logs_updated_at
before update on usage_logs
for each row execute function set_updated_at();


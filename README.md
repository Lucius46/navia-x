# LLM Explainer / Navia-X

Next.js frontend + FastAPI backend + Supabase/PostgreSQL project for protected LLM explanation workflows.

This version adds:

- license-code activation before protected LLM usage
- backend-enforced access checks for `POST /api/explain`
- admin license management in `/admin/licenses`
- admin user access management in `/admin/users`
- billing/status view in `/settings/billing`
- backend login route that authenticates against Supabase Auth and then issues an app JWT

## Stack

- Frontend: Next.js
- Backend: FastAPI
- Database: Supabase PostgreSQL
- Auth source: Supabase Auth
- App session: backend-issued JWT

## Main Pages

- `/login`: sign in with existing Supabase Auth email/password
- `/activate`: activate a license code like `NAVIA-XXXX-XXXX-XXXX`
- `/settings/billing`: current plan, access status, expiration, daily usage
- `/admin/licenses`: create, view, disable license codes
- `/admin/users`: view users and update access
- `/`: protected explainer UI

## Main Backend Routes

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/license/activate`
- `GET /api/license/me`
- `POST /api/admin/licenses/create`
- `GET /api/admin/licenses`
- `PATCH /api/admin/licenses/{id}/disable`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/access`
- `POST /api/explain`

## Environment

Backend values go in `backend/.env`:

```bash
APP_NAME="LLM Explainer API"
APP_ENV=development
API_PREFIX=/api

FRONTEND_ORIGIN=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
MOCK_AI_RESPONSES=false

DATABASE_URL=your_supabase_postgres_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

JWT_SECRET=your_strong_random_secret
AUTH_TOKEN_TTL_HOURS=12

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me_admin_password
ADMIN_SESSION_SECRET=your_admin_session_secret_here
```

Frontend values go in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

## Local Setup

### 1. Copy env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### 2. Install backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the SQL migration

Use the migration file:

```bash
database/migrations/20260530_add_license_access_control.sql
```

Run it with `psql`:

```bash
psql "$DATABASE_URL" -f database/migrations/20260530_add_license_access_control.sql
```

Or paste the same SQL into the Supabase SQL editor.

The canonical full schema file is:

```bash
database/schema.sql
```

### 4. Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Health check:

```bash
curl http://localhost:8001/api/health
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

## How Auth Works

1. The user signs in on `/login` with an existing Supabase Auth email/password.
2. FastAPI validates the credentials against Supabase Auth.
3. FastAPI looks up or creates the matching row in `public.users`.
4. FastAPI returns a backend JWT.
5. The frontend sends that JWT in the `Authorization: Bearer ...` header for protected API calls.

## How License Access Works

1. User signs in.
2. User opens `/activate`.
3. User enters a license code.
4. Backend validates:
   - code exists
   - code is active
   - code is not expired
   - `used_count < max_activations`
   - same user has not already activated the same code
5. Backend inserts `user_licenses`, increments `license_codes.used_count`, and updates the `users` access fields.
6. `POST /api/explain` only succeeds when:
   - user is authenticated
   - `access_status = active`
   - `access_expires_at` is null or in the future
   - daily usage is below `daily_usage_limit`

If access is blocked, the API returns:

```text
Please activate a valid license code to use this feature.
```

## Create the First Admin User

### Option A: recommended

1. Create the user in Supabase Auth with email/password.
2. Sign in once through `/login` so the app creates the matching `public.users` row.
3. Promote the row in SQL:

```sql
update users
set role = 'admin'
where lower(email) = lower('admin@example.com');
```

### Option B: if the user row does not exist yet

```sql
insert into users (
  email,
  role,
  plan,
  access_status,
  daily_usage_limit
)
values (
  'admin@example.com',
  'admin',
  'free',
  'inactive',
  0
)
on conflict (email) do update
set role = 'admin';
```

## Generate a License Code

After the admin account is ready:

1. Sign in on `/login`
2. Open `/admin/licenses`
3. Fill in:
   - `plan`
   - `duration_days`
   - `max_activations`
   - `usage_limit_per_day`
   - optional `expires_at`
4. Submit the form

The backend generates secure random codes in this shape:

```text
NAVIA-XXXX-XXXX-XXXX
```

## How Users Activate Access

1. Sign in on `/login`
2. Open `/activate`
3. Enter the license code
4. Click `Activate Access`
5. Confirm the new plan and limits on `/settings/billing`
6. Return to `/` and use the explainer

## Notes About Admin Access Changes

The admin user page supports:

- activating access
- disabling access
- extending access by 30 days
- updating plan and daily usage limit

These updates are written in the backend, not trusted from frontend-only state.

## Security Notes

- frontend never calls the LLM provider directly
- all protected access checks happen in FastAPI
- normal users cannot call admin APIs successfully
- license activation is tied to the authenticated user account
- duplicate activation of the same code by the same user is blocked
- successful protected explanations are logged to `usage_logs`

## Quick Verification Checklist

- migration ran successfully
- users can sign in through `/login`
- normal users cannot open admin routes successfully
- admin can generate a code in `/admin/licenses`
- user can activate a code in `/activate`
- `/settings/billing` shows plan, status, expiry, and usage
- `/api/explain` returns `403` when access is inactive or expired
- `/api/explain` succeeds after activation

## Useful Commands

Backend compile check:

```bash
python3 -m compileall backend/app
```

Frontend lint:

```bash
cd frontend
npm run lint
```

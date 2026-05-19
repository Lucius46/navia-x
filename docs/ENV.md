# Environment Variables

## Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

- `NEXT_PUBLIC_API_BASE_URL`: FastAPI backend base URL. In local development it should point to `http://localhost:8001`.

## Backend

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```bash
APP_NAME=LLM Explainer API
APP_ENV=development
API_PREFIX=/api
FRONTEND_ORIGIN=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
MOCK_AI_RESPONSES=false
DAILY_REQUEST_LIMIT=20
INPUT_CHAR_LIMIT=3000
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INVITE_CODES=BETA-MAY-2026,FOUNDER-ACCESS
```

### Notes

- `OPENAI_API_KEY`: fill this in `backend/.env`. The frontend, extension, and desktop app now all call the backend for explanation requests.
- `OPENAI_BASE_URL`: optional. Use it for OpenAI-compatible providers such as Groq or OpenRouter.
- `OPENAI_MODEL`: default routed model for the MVP.
- `MOCK_AI_RESPONSES`: set `false` for real LLM calls. If it is `false` and `OPENAI_API_KEY` is empty, the explain API will return a backend configuration error.
- `DAILY_REQUEST_LIMIT`: enforces the beta cap of 20 explanations per user per day.
- `DATABASE_URL`: Supabase PostgreSQL connection string.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: reserved for auth, storage and admin operations.
- `INVITE_CODES`: comma-separated invite codes for the beta gate.

### OpenAI-Compatible Free-Tier Examples

For Groq free plan:

```bash
OPENAI_API_KEY=your_groq_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=openai/gpt-oss-20b
MOCK_AI_RESPONSES=false
```

For OpenRouter free router:

```bash
OPENAI_API_KEY=your_openrouter_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openrouter/free
MOCK_AI_RESPONSES=false
```

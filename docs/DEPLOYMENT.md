# Deployment Guide

## Architecture

- Frontend: Next.js on Vercel
- Backend: FastAPI on Render or Railway
- Database: Supabase PostgreSQL
- File storage: Supabase Storage for future PDF uploads

## Local Dry Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Open `http://localhost:8001/docs`.

## Deploy Frontend To Vercel

1. Push the repository to GitHub
2. Import the repo into Vercel
3. Set Root Directory to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com`
5. Deploy

## Deploy Backend To Render

1. Create a new Web Service in Render
2. Point it to the same repository
3. Set Root Directory to `backend`
4. Build command:

```bash
pip install -r requirements.txt
```

5. Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Add environment variables from `backend/.env.example`
7. Set `FRONTEND_ORIGIN` and `CORS_ORIGINS` to your Vercel domain

## Deploy Backend To Railway

1. Create a new project from GitHub repo
2. Choose the `backend` directory as the service root
3. Add the same environment variables as Render
4. Use the same start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Supabase Setup

1. Create a new Supabase project
2. Open SQL Editor and run [`database/schema.sql`](/Users/kimlucius/Documents/LLM-explain/database/schema.sql)
3. Copy:
   - Project URL
   - Anon key
   - Service role key
   - Postgres connection string
4. Paste them into backend environment variables
5. Later, wire auth and storage features against the same project

## Production Hardening Checklist

- Turn `MOCK_AI_RESPONSES` to `false`
- Add a real `OPENAI_API_KEY`
- Replace in-memory repository with PostgreSQL persistence
- Enable rate limiting at the proxy or app layer
- Add request authentication and admin authorization
- Add structured logging and error monitoring

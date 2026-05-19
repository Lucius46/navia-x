# Product Spec

## Product Name

LLM Explainer

## Product Goal

LLM Explainer is a browser-based SaaS MVP that helps users understand difficult content by pasting or selecting text and receiving a structured AI explanation. The first version targets 20–50 beta users and emphasizes clarity, speed, controlled cost, and a polished professional interface.

## Target Users

- Students reading difficult passages, papers and textbooks
- Knowledge workers parsing reports, industry documents and dense writing
- Engineers who want code explanations
- Beta testers validating usefulness, speed and product clarity before public launch

## Core User Flow

1. User opens the web app
2. User enters an invite code
3. User signs in with email
4. User lands on the dashboard
5. User opens the text explanation workspace
6. User pastes text or selects a snippet
7. User chooses an explanation mode
8. User triggers explain with the button or keyboard shortcut
9. Backend routes the request to a model provider
10. Response returns summary, deep explanation, keywords, examples and takeaway
11. History and usage data are saved
12. Admin can review users, logs and model status

## MVP Pages

- Login / invite gate
- Dashboard
- Text explanation workspace
- PDF upload UI
- History
- Personal center / settings
- Admin dashboard

## Explanation Modes

- Simple explanation
- Professional explanation
- Exam understanding
- Research paper understanding
- Code explanation
- Professor mode
- Science mode
- Literature mode

## Admin Scope

- User list
- Daily request volume
- Cost placeholder analytics
- Request logs
- Error logs
- Feedback list
- Model status monitoring

## Constraints

- Frontend must never call OpenAI directly
- API keys stay in environment variables only
- Daily request cap: 20 per beta user
- Single input cap: 3000 characters
- PDF backend parsing is explicitly left as a later TODO
- CORS and basic error handling must be enabled

## Non-Goals For This MVP

- Native mobile apps
- Browser extension packaging
- Google Play / App Store release
- Production-grade billing
- Full Supabase Auth implementation in this first scaffold

## Recommended Next Steps After This Scaffold

1. Replace mock backend storage with Supabase/PostgreSQL persistence
2. Wire Supabase Auth email magic link or passwordless sign-in
3. Connect real OpenAI usage and token accounting
4. Add PDF text extraction and chunked explanation flow
5. Add feedback scoring and experiment dashboards


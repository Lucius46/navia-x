# Beta Test Plan

## Goal

Validate whether 20–50 real testers can quickly understand dense content with LLM Explainer and whether the current UI, explanation quality, latency and history features are strong enough for a public beta.

## Test Cohort

- 10 students
- 10 knowledge workers
- 10 engineers or technical readers
- Optional extra 20 users if initial feedback is stable

## Test Scenarios

1. Paste a difficult paragraph and use simple explanation mode
2. Paste a professional article and use professional mode
3. Paste a paper abstract and use research mode
4. Paste source code and use code explanation mode
5. Open history and review previous runs
6. Try the PDF upload UI and understand the expected next step
7. Switch settings and check whether the interface remains intuitive

## Success Metrics

- 80% of testers understand where to start without onboarding help
- Average response time remains below 4 seconds in beta use
- At least 70% of testers rate the explanation as helpful
- Less than 5% of requests fail
- Less than 10% of testers get blocked by invite or auth confusion

## Data To Track

- Requests per user per day
- Successful vs failed explanations
- Average latency
- Most-used explanation modes
- Feedback rating and comments
- Admin review of error logs

## Feedback Collection

- In-product feedback form tied to explanation record
- Manual Notion or Airtable follow-up for high-signal testers
- Weekly review of logs and usage trends

## Triage Rules

- P0: login blocked, explain endpoint down, data loss
- P1: history broken, request cap broken, severe layout issue
- P2: copy confusion, minor visual issues, edge-case export problems


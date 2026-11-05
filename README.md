# Orbit Workspace (lean core)
Next.js 15 + Supabase (Auth, Postgres, RLS) + OpenAI. **Not yet run or tested** — expect to fix small issues on first run.

## Setup
1. `npm install`
2. Create a Supabase project and run, in order, `supabase/migrations/0001_core.sql` then `0002_comments_notifications.sql`, then `0003_members_invitations.sql`, then `0004_subtasks_dependencies.sql` in the SQL editor (or `supabase db push`).
3. `cp .env.example .env.local`; fill in the Supabase URL + anon key (and `OPENAI_API_KEY` for AI).
4. `npm run dev` → http://localhost:3000, sign up, create an organization.

## Included (now also: task editing (title, description, status, priority, due date, assignee) with membership check and optimistic concurrency, subtasks (one level), task dependencies with DB-enforced cycle prevention, blocked indicator, Reports (status, overdue, workload, 7/30/90d), RLS integration tests, AI chat with read-only tools (search_tasks, list_projects, get_project_status), per-user rate limit, Settings with members, roles (owner/admin/member), invite links, comments, inbox notifications, calendar, list/board toggle with filters, search, unit tests)
Auth + protected routes, org creation (owner role), projects, tasks (status/priority/due date), dashboard from real queries,
activity log, AI plan → preview → approve → verified creation. RLS scopes every table to organization membership.

## Not included yet
Team directory/workload, knowledge area (documents + pgvector), AI write tools beyond plan creation, workspace switcher (users see their first organization), email delivery for invites, background jobs.

## Tests
- `npm test` — unit tests; the RLS integration tests are skipped unless configured.
- Integration (RLS) tests hit a real Supabase project. Use a **throwaway test project** with migrations 0001–0004 applied, then:
  `TEST_SUPABASE_URL=… TEST_SUPABASE_ANON_KEY=… TEST_SUPABASE_SERVICE_ROLE_KEY=… npm test`
  (the service-role key is used only by the tests to create/delete users; the app never uses it). If email confirmation blocks sign-in, the tests create users pre-confirmed.
- These tests were written but not yet run by the author; if one fails, treat it as a possible real policy gap and investigate.

## Status (honest summary)
Written, **not yet executed** by the author: everything in this repo. No `npm install`, build, migration run, test run or deployment was performed in the authoring environment.
Expected first steps: `npm install`, `npx tsc --noEmit` and `npm run build` (fix any small type errors, e.g. Supabase row types are untyped here), apply migrations 0001–0004, run `npm test`, then the RLS integration tests against a test project.
Security note: policies are minimal; review `supabase/migrations/*` (e.g. any org member can edit/delete projects, only admins delete tasks) before real use. Add security headers, e2e tests and a monitored rate limiter before production.

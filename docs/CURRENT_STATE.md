# Current State

> **Last Updated**: 2026-03-08 | **Version**: 0.15.0 | **Branch**: `phase-50/test-infra-and-query-migration`

---

## What Has Been Built

The To Do / productivity application is the active MVP. It is feature-complete for the v1.0 launch target.

### Core Features (Complete)

- **Authentication** — Register, login, logout, JWT refresh tokens, password reset (email flow), email verification, account lockout after 5 failed attempts
- **Multi-device session management** — View and revoke active sessions per device
- **Task management** — Full CRUD, priorities (P1–P5), due dates, bulk operations
- **Task groups** — Organise tasks into groups with configurable WIP limits
- **Subtasks** — Nested subtasks with inline toggle and progress badge
- **Calendar view** — Day / week / month navigation
- **Events** — Full CRUD with RRULE-based recurrence
- **Weekly progress** — Charts and statistics dashboard
- **Eisenhower Matrix** — 4-quadrant urgency/importance classification
- **Energy tagging** — 1–10 energy level scale with smart suggestions
- **Status workflow** — NotStarted → InProgress → Blocked → Completed
- **Admin dashboard** — User management, system statistics, activity logs
- **Theme** — Full light/dark mode (WCAG AAA compliant design system)
- **Version history** — In-app changelog via `/version` route

### Technical Foundation (Complete)

- **Frontend**: React 18 + TypeScript 5.7 + Vite; fully migrated to Tailwind CSS + shadcn/ui; TanStack Query for server state; React Hook Form + Zod for forms
- **Backend**: .NET 8 / C# Web API; EF Core 8 + PostgreSQL 15; JWT auth; Serilog; rate limiting; security headers (OWASP)
- **Design system**: `@life-manager/ui` package with Tailwind design tokens; zero styled-components remaining
- **Shared schema**: `@life-manager/schema` with Zod validation schemas
- **Tests**: 300+ tests passing (Jest + React Testing Library + Playwright + xUnit)
- **CI**: GitHub Actions (PR checks, nightly extended suite, release-please)

---

## What Is Currently Being Built

**Phase 50: Test Infrastructure & Query Migration** (`phase-50/test-infra-and-query-migration`)

- Aligning test suite to current component architecture after Tailwind migration
- Migrating remaining hand-rolled `queryCache.ts` patterns to TanStack Query
- Consolidating query hooks in `hooks/queries/`

---

## What Comes Next (MVP v1.0 Gaps)

These items must be complete before tagging v1.0.0:

### P1 — Must Have

- [x] Task search / filter across all groups — client-side search + keyboard shortcut `/` already in TasksPage
- [x] Empty state / onboarding for new users — dashboard shows getting-started panel when totalTasks === 0
- [x] 404 error page — `pages/errors/NotFoundPage.tsx` + catch-all route in App.tsx
- [x] Data export — `GET /api/v1/auth/export-data` endpoint + "Export my data" button on Profile page
- [x] `.env.example` files — `apps/web/.env.example` and `apps/finance-api/appsettings.Production.example.json`
- [x] PostgreSQL backup + restore scripts — `scripts/backup-db.ps1` and `scripts/restore-db.ps1`
- [x] `GET /api/health` endpoint — returns `{ status, version, timestamp }`, DB connectivity check
- [x] `docs/guides/PRODUCTION-SETUP.md` — step-by-step self-hosted setup guide

### P2 — Should Have

- [ ] Keyboard shortcuts for task operations
- [ ] Due-date browser notifications (Service Worker)
- [ ] Task categories / labels (already spec'd as Phase 14)

---

## Known Technical Debt

| Item | Detail | Plan |
| ---- | ------ | ---- |
| Finance models | `Features/Finance/` contains placeholder models only | Phase 41+ |
| Package name | `@life-manager/*` needs rename to `@life-manager/*` | Work Stream 3 |
| Project name | All references to "Life Manager" in UI and docs | Work Stream 3 |
| Auth service extraction | Auth is currently embedded in monolith | Phase 22–24 |
| Microservices | Single .NET monolith | Phase 25–27 |

---

## Environment

| Service | Port | Notes |
| ------- | ---- | ----- |
| React (Vite) | 5173 | Dev server with HMR |
| .NET API | 5000 | Via `dotnet run` |
| PostgreSQL | 5432 | Docker container |
| Vite proxy | `/api` → `:5000` | Transparent API proxying |

---

## Phase History (Summary)

| Phases | Milestone | Version |
| ------ | --------- | ------- |
| 1–10 | Core Todo app (auth, tasks, groups, subtasks, password reset, email verification, sessions, activity logging) | 0.1–0.10 |
| 11 | Weekly progress dashboard | 0.11.0 |
| 12 | Calendar view | 0.12.0 |
| 13 | Events foundation | 0.13.0 |
| v2 security | Multi-device sessions, account lockout, security headers, rate limiting | — |
| 48–51 | Frontend modernisation (Tailwind + shadcn/ui, TanStack Query, React Hook Form + Zod) | — |
| 55 | Task status workflow + WIP limits | — |
| 56 | Eisenhower Matrix | — |
| 57 | Energy tagging + smart suggestions | — |
| 50 (current) | Test infra alignment + query migration | 0.15.0 |

# Current State

> **Last Updated**: 2026-03-20 | **Version**: 1.0.0 | **Branch**: `develop`

---

## What Has Been Built

The Life Manager productivity application is MVP-complete and ready for v1.0.0 release.

### Core Features (Complete)

- **Authentication** — Register, login, logout, JWT refresh tokens, password reset (email flow), email verification, account lockout after 5 failed attempts
- **Multi-device session management** — View and revoke active sessions per device
- **Task management** — Full CRUD, priorities (P1–P5), due dates, bulk operations, label filtering
- **Task groups** — Organise tasks into groups with configurable WIP limits
- **Task assignment** — Assign tasks to other users within a group; shared task views
- **Subtasks** — Nested subtasks with inline toggle and progress badge
- **Task labels** — User-defined coloured labels; attach to tasks; filter on Tasks page; manage in Profile
- **Task reminders** — Set a `reminderAt` date/time; Service Worker fires browser notification at the scheduled time
- **Calendar view** — Day / week / month navigation
- **Events** — Full CRUD with RRULE-based recurrence
- **Event sharing** — Share events with view/edit permissions; invitation accept/decline flow
- **Weekly progress** — Charts and statistics dashboard
- **Eisenhower Matrix** — 4-quadrant urgency/importance classification
- **Energy tagging** — 1–10 energy level scale with smart suggestions
- **Status workflow** — NotStarted → InProgress → Blocked → Completed
- **Admin dashboard** — User management, system statistics, activity logs
- **Theme** — Full light/dark mode (WCAG AAA compliant design system)
- **Version history** — In-app changelog via `/version` route
- **Keyboard shortcuts** — Global provider with chord support; `?` opens cheat-sheet overlay
- **Health check** — `GET /api/health` with DB connectivity
- **Data export** — `GET /api/v1/auth/export-data` downloads all user data as JSON
- **Production setup** — `.env.example`, backup/restore scripts, `PRODUCTION-SETUP.md`

### Technical Foundation (Complete)

- **Frontend**: React 18 + TypeScript 5.7 + Vite; Tailwind CSS + shadcn/ui; TanStack Query; React Hook Form + Zod
- **Backend**: .NET 8 / C# Web API; EF Core 8 + PostgreSQL 15; JWT auth; Serilog; rate limiting; OWASP security headers
- **Design system**: `@life-manager/ui` package with Tailwind design tokens
- **Shared schema**: `@life-manager/schema` with Zod validation schemas
- **Service Worker**: `apps/web/public/sw.js` — IndexedDB reminder storage, 60s polling, push notifications
- **Tests**: 356 frontend tests passing (Jest + React Testing Library); 26 backend unit tests passing; 5 labels integration tests passing
- **CI**: GitHub Actions (PR checks, nightly extended suite, release-please)

---

## What Is Currently Being Built

**v1.0.0 Release** (`develop` → `main`)

All P1 and P2 features complete. Pending:

- Merge `develop` → `main` via PR
- Create `v1.0.0` annotated tag

---

## What Comes Next

### Post-launch (v1.1+)

- Work Stream 3: Rename remaining `finance-manager` references → `life-manager` in package names and repo
- Work Stream 4: LAN deployment hardening (Docker Compose production profile, nginx reverse proxy)
- Phase 22–24: Auth service extraction (currently embedded in monolith)
- Phase 25–27: Microservices migration
- Future apps: Finance, Fitness, Weather (specified but not built)

---

## Known Technical Debt

| Item | Detail | Plan |
| ---- | ------ | ---- |
| Finance models | `Features/Finance/` contains placeholder models only | Phase 41+ |
| Package naming | `@life-manager/*` packages still reference old naming in some places | WS3 |
| Auth service extraction | Auth is currently embedded in monolith | Phase 22–24 |
| Microservices | Single .NET monolith | Phase 25–27 |
| Integration tests | 25 pre-existing integration test failures (auth token setup issue in test factory) | Backlog |

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
| 58 | Task assignment + event sharing + notifications frontend | 0.15.0 |
| WS1 | AI docs consolidation (CLAUDE.md) | — |
| WS2 | MVP P1 gaps (health, export, 404, onboarding, env files, backup scripts) | — |
| P2a | Keyboard shortcuts + cheat sheet | — |
| P2b | Browser notifications via Service Worker | — |
| P2c | Task labels (coloured, user-defined) | — |
| v1.0.0 | MVP launch | 1.0.0 |

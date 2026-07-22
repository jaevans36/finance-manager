# Current State

> **Last Updated**: 2026-06-21 | **Version**: 1.0.0 | **Branch**: `develop`

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
- **Dev password reset bypass** — `/dev/reset-password` page and `POST /api/v1/dev/reset-password` endpoint, double-gated by environment + config flag; see `docs/guides/DEV-PASSWORD-RESET.md`

### Finance Manager (Complete — Phases 41–47)

- **Accounts** — full CRUD; 12 account types (current, savings, credit, ISA, SIPP, mortgage, loan, etc.); interest rates, credit limits, promotional deals, mortgage start/term/interest-only, minimum/current monthly payments, loan end date
- **Transactions** — view, add, edit, delete; category assignment; free-text search; pagination
- **CSV import** — Barclays, HSBC, Lloyds, Monzo, Starling, NatWest, Generic; duplicate detection; automatic bill-matching on import
- **Budgets** — monthly spending limits per category; progress bars with green/amber/red thresholds
- **Spending Pots** — envelope-style monthly budgets with colour coding
- **Bills** — recurring bill tracking (weekly/monthly/quarterly/annual); due-date reminders; bill-to-account linking; automatic paid-marking via transaction matching; recurring pattern detection from imports
- **Savings Goals** — target amount, monthly contribution, on-track/behind projection
- **Budget Trends** — spending-over-time charts
- **Affordability Engine** — 90-day income detection with confidence level (High/Medium/Low), manual income override, committed costs + discretionary breakdown, safe monthly surplus, suggested debt payment
- **Debt Burndown** — severity-scored debt overview (0–100, Critical/High/Medium/Low); Avalanche/Snowball/Custom paydown projection; freedom date; total interest; payoff order; stacked area waterfall chart
- **AI Insights** (Phase 48) — Spending Velocity (daily burn pace vs budget, projected month-end overspend), Anomaly Detection (category spend spikes, new high-value merchants, potential duplicate charges), Subscription Auditor (recurring-subscription cost roundup with "possibly unused" flagging), Negotiation Helper (personalised negotiation script generated from a merchant's transaction history, copy-to-clipboard). Rule-based/statistical — no external AI API. `apps/finance-api/Features/Insights/`; "AI Insights" tab on the Finance page.
- **User guide** — `docs/guides/FINANCE_MANAGER.md`

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

**Finance Manager — Phase 49 onwards** (MCP Server Integration, T1275+)

Phases 41–48 are complete. The Finance Manager is live as a standalone microservice at `apps/finance-api/` and surfaced in the app under **Finance Manager**. See "Phase History" below for what has been built.

Next: Phase 49 — MCP Server Integration; or multi-currency support (T1352–T1356, ECB exchange rate feed, deferred from Phase 47) — the only item left unbuilt from the original Phase 47 debt-burndown plan. Phase 50 — Household Account Sharing (T1750–T1773, cross-login view-only account sharing feeding Affordability/Debt/AI Insights) is now roadmapped after Phase 49, resolving the "Multi-user scope" open question in the Finance spec.

See `specs/applications/finance/spec.md` and `specs/applications/finance/tasks.md` for full specification and task breakdown.

---

## What Comes Next

### Stocks & Shares Application (v1.1)

- Phase 60: Market Discovery & Watchlist (T1519-T1548)
- Phase 61: Portfolio Tracking (T1549-T1565)
- Phase 62: Stock Detail & Analysis (T1566-T1583)
- Phase 63: Dashboard Widget (T1584-T1595)

### Platform (Parallel / Post-Stocks)

- Phase 64–66: Life Manager MCP Server (`apps/life-mcp/`) — wraps the API for Claude CLI / Obsidian second-brain workflows (T1596–T1667)
- Work Stream 3: Rename remaining `finance-manager` references → `life-manager` in package names and repo
- Work Stream 4: LAN deployment hardening (Docker Compose production profile, nginx reverse proxy)
- Phase 22–24: Auth service extraction (currently embedded in monolith)
- Phase 25–27: Microservices migration

### Future Applications (specified but not yet built)

| App | Spec | Priority | Notes |
|---|---|---|---|
| Finance Manager | `specs/applications/finance/spec.md` | HIGH | CSV import, spending pots, bills, AI insights, MCP tools, household account sharing. UK-specific (ISA/SIPP, tax year). Phases 41–50. |
| Fitness Application | `specs/applications/fitness/spec.md` | P2 | Workout tracking, Fasting Tracker module, Nutrition & Macro Tracker with barcode scanning, habit tracking |
| Recipe Collection | `specs/applications/recipes/spec.md` | P2 | Standalone module. Personal cookbook + data layer for Nutrition, Pantry, Finance. MCP `recipes_*` tools. |
| Pantry & Ingredient Tracker | `specs/applications/pantry/spec.md` | P3 | Shared infrastructure. Inventory, expiry tracking, recipe matching, cost-per-meal, smart shopping lists. |
| Weather | `specs/applications/weather/` | P4 | Basic weather app — spec pending |

---

## Known Technical Debt

| Item | Detail | Plan |
| ---- | ------ | ---- |
| Multi-currency | T1352–T1356 deferred — no ECB exchange rate service or currency toggle yet | Phase 47 remainder |
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
| 55 | Task status workflow + WIP limits (kanban board) | — |
| 56 | Eisenhower Matrix (urgency/importance quadrants) | — |
| 57 | Energy tagging + smart suggestions ("What Can I Do Now?") | — |
| 58 | Task assignment + event sharing + notifications frontend | 0.15.0 |
| WS1 | AI docs consolidation (CLAUDE.md) | — |
| WS2 | MVP P1 gaps (health, export, 404, onboarding, env files, backup scripts) | — |
| P2a | Keyboard shortcuts + cheat sheet | — |
| P2b | Browser notifications via Service Worker | — |
| P2c | Task labels (coloured, user-defined) | — |
| v1.0.0 | MVP launch | 1.0.0 |
| 41 | Finance API microservice — accounts, transactions, CSV import, categories, net worth | — |
| 42 | Budgets + Spending Pots | — |
| 43 | Bills + recurring detection | — |
| 43 additions | Bill-to-account linking, transaction auto-matching on import | — |
| 43b | Financial Affordability Engine (income detection, safe surplus) | — |
| 44–46 | Savings Goals, Budget Trends | — |
| 47 (expanded) | Debt Burndown Dashboard — severity scoring, Avalanche/Snowball/Custom projection, waterfall chart | — |
| 48 | AI Insights — Spending Velocity, Anomaly Detection, Subscription Auditor, Negotiation Helper | — |

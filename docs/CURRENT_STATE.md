# Current State — Finance Manager Platform

> **Last Updated**: 2026-02-25  
> **Version**: 0.15.0  
> **Branch**: `001-todo-app`  
> **Latest Commit**: `9e92c1c`

---

## What Is Built

The To Do application is the only implemented application. It includes:

- User registration/login with JWT auth, email verification, password reset
- Task CRUD with priorities (Low/Medium/High/Critical), due dates, groups, subtasks
- Calendar events with recurrence, colour coding, calendar view
- Weekly progress tracking with statistics and charts
- Admin dashboard with user management and system configuration
- Version history API parsing CHANGELOG.md
- Full design system with light/dark themes (WCAG AAA)
- Rate limiting and OWASP security headers

## What Is Currently Being Built

**Frontend modernisation** has been scoped and specified (Phase 48-54, 132 tasks, T1257-T1388). The plan replaces styled-components with Tailwind CSS + shadcn/ui, adopts TanStack Query for server state, and introduces React Hook Form + Zod for form handling. Implementation has not started.

Most recent completed work:

1. **Design system overhaul** (Phase 13) — completed, committed `0c1edea`
   - Replaced EditTaskModal with TaskDetailModal (view/edit modes)
   - Migrated all emoji to Lucide icons
   - Standardised design tokens across all components
2. **Platform specifications** — completed, committed `0d816e2`
   - 8 feature specs with task breakdowns (T800-T1256, 457 tasks)
   - Applications: Fitness, Weather, Finance
   - Platform: Auth Service, Microservices, Test Automation, DB Abstraction, Project Rename
3. **React Doctor + dead code cleanup** — completed, committed `c1613d2` + `9e92c1c`
   - Installed react-doctor (score: 91/100)
   - Deleted 16 unused files, migrated 21 files to `@finance-manager/ui`
   - Removed 36 unused exports, 11 unused types, 1 duplicate export
4. **Frontend modernisation spec** — completed, committed (pending)
   - Full SpecKit specification and 132-task breakdown for Phases 48-54
   - ADR-016 through ADR-019 for technology decisions

## Next Logical Step

**Phase 48** (Tailwind CSS & shadcn/ui Foundation) — the first phase of the frontend modernisation. This installs Tailwind alongside styled-components and sets up shadcn/ui for new component development. Can run in parallel with Phase 49 (TanStack Query).

Alternatively, Phase 14 (Fitness: Workout Tracking) or Phase 22 (Auth Service Extraction) if feature delivery is prioritised over tech debt.

## Active Constraints

| Constraint | Detail |
|-----------|--------|
| Monolith | All backend features in single `FinanceApi` project |
| Single DB | All entities in one PostgreSQL database |
| JWT symmetric | Using HS256 with shared secret, not RS256/JWKS |
| No OAuth | No third-party login (Google, GitHub, etc.) |
| No CI/CD | GitHub Actions files exist but pipelines not fully configured |
| Finance models exist | Account, Transaction, Category, Budget entities created but no controllers/services |

## Known Technical Debt

- **styled-components throughout** — 62 files import styled-components (planned removal in Phase 48-53)
- `Finance/Models/` has entity stubs but no implementation — will conflict with Phase 41 finance microservice
- `apiClient` base URL falls back to `localhost:5000` but API runs on port `3000` (Vite proxy handles this)
- Some test files in `tests/` directory may need updating after TaskDetailModal refactor
- Empty copilot prompt files in `copilot/chat-modes/` and `copilot/prompts/`
- Hand-rolled `queryCache.ts` — will be replaced by TanStack Query (Phase 49)

## Active Refactoring Directions

1. **Frontend modernisation**: Specified in Phase 48-54. Tailwind CSS + shadcn/ui replacing styled-components, TanStack Query for server state, React Hook Form + Zod for forms.
2. **Monolith → Microservices**: Specified in Phase 25-27, not started. YARP gateway, service isolation, event bus.
3. **Auth extraction**: Specified in Phase 22-24. Will create standalone auth service with OAuth/MFA.
4. **Project rename**: Finance Manager → Life Manager (Phase 38-40). Awaiting decision on timing.

## Trade-offs in Effect

| Decision | Trade-off |
|----------|-----------|
| Feature folders over layer folders | Some cross-cutting code duplicated across features |
| styled-components over CSS Modules | Runtime CSS generation, larger bundle, but full theme support. **Superseded by ADR-016**: migrating to Tailwind CSS + shadcn/ui |
| EF Core InMemory for tests | Fast tests but doesn't catch DB-specific issues (constraints, indexes) |
| Single branch (`001-todo-app`) | All work on one branch — will need branching strategy before team scaling |
| PostgreSQL only | Simple setup but no multi-engine support yet (Phase 36-37) |

## Environment

| Service | Port | Notes |
|---------|------|-------|
| React (Vite) | 5173 | Dev server with HMR |
| .NET API | 3000 | Via `dotnet run` |
| PostgreSQL | 5432 | Docker container |
| Vite proxy | `/api` → `:3000` | Transparent API proxying |

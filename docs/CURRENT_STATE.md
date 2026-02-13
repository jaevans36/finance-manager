# Current State — Finance Manager Platform

> **Last Updated**: 2026-02-13  
> **Version**: 0.15.0  
> **Branch**: `001-todo-app`  
> **Latest Commit**: `0d816e2`

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

**No active feature in development.** The most recent work was:

1. **Design system overhaul** (Phase 13) — completed, committed `0c1edea`
   - Replaced EditTaskModal with TaskDetailModal (view/edit modes)
   - Migrated all emoji to Lucide icons
   - Standardised design tokens across all components
2. **Platform specifications** — completed, committed `0d816e2`
   - 8 feature specs with task breakdowns (T800-T1256, 457 tasks)
   - Applications: Fitness, Weather, Finance
   - Platform: Auth Service, Microservices, Test Automation, DB Abstraction, Project Rename

## Next Logical Step

Phase 14 (Fitness: Workout Tracking Foundation) or Phase 22 (Auth Service Extraction) depending on priority decision. The auth service extraction is a prerequisite for the microservices migration.

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

- `Finance/Models/` has entity stubs but no implementation — will conflict with Phase 41 finance microservice
- `apiClient` base URL falls back to `localhost:5000` but API runs on port `3000` (Vite proxy handles this)
- Some test files in `tests/` directory may need updating after TaskDetailModal refactor
- Empty copilot prompt files in `copilot/chat-modes/` and `copilot/prompts/`
- `@finance-manager/ui` has minimal components — most UI still in app-level `components/ui/`

## Active Refactoring Directions

1. **Monolith → Microservices**: Specified in Phase 25-27, not started. YARP gateway, service isolation, event bus.
2. **Auth extraction**: Specified in Phase 22-24. Will create standalone auth service with OAuth/MFA.
3. **Design system centralisation**: Ongoing. Moving app-level components into `@finance-manager/ui` package.
4. **Project rename**: Finance Manager → Life Manager (Phase 38-40). Awaiting decision on timing.

## Trade-offs in Effect

| Decision | Trade-off |
|----------|-----------|
| Feature folders over layer folders | Some cross-cutting code duplicated across features |
| styled-components over CSS Modules | Runtime CSS generation, larger bundle, but full theme support |
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

# Life Manager — AI Context

> **Single source of truth for all AI agents working on this repository.**
> Current name: Life Manager (renamed from Finance Manager; rename complete).
> Read this file first. For deeper context, follow the links in "Key File Map" below.

---

## Project Identity

- **Name**: Life Manager (formerly Finance Manager — rename complete)
- **Type**: Multi-application personal productivity platform (monorepo)
- **Repository**: `jaevans36/finance-manager`
- **Stack**: .NET 8 API + React/TypeScript frontend + PostgreSQL
- **Language**: British English throughout all code, comments, and documentation
- **Current version**: 1.0.0 (MVP launched) | Next: Phase 60-63 Stocks & Shares application

---

## Core Principles

1. **Security-First** — Authentication and authorisation mandatory for all data access. No hardcoded secrets; use environment variables. Input validation at every layer.
2. **Data Integrity** — ACID-compliant transactions. Audit trails on all data modifications. No `any` type in TypeScript — ever.
3. **Test-Driven Development** — Write tests before or alongside implementation. No feature ships without passing tests. 300+ tests must remain green.
4. **API-First Design** — Define OpenAPI contracts before implementation. All functionality accessible via RESTful API. Consistent error response format.
5. **Compliance & Audit Trail** — All user actions logged with attribution and timestamps. Privacy controls mandatory for personal data.
6. **Living Documentation** — Documentation is updated as part of implementation, never as a separate follow-up. Code and docs ship together. See "Documentation Requirements" below.

---

## Technology Stack

### Backend (`apps/life-api/`)
- .NET 8.0 / C# 12 / ASP.NET Core Web API
- Entity Framework Core 8 + PostgreSQL 15 (Docker)
- JWT Bearer auth (HS256) + BCrypt.Net password hashing
- Serilog logging | Swashbuckle (Swagger) | StyleCop

### Frontend (`apps/web/`)
- React 18 / TypeScript 5.7+ / Vite
- Tailwind CSS + shadcn/ui (migration from styled-components complete)
- TanStack Query (server state) | React Hook Form + Zod (forms)
- React Router v6 | Axios via centralised `apiClient` | Lucide React | Recharts

### Shared Packages (`packages/`)
- `@life-manager/ui` — design tokens, shared components, themes
- `@life-manager/schema` — Zod validation schemas, shared TypeScript types

---

## Coding Standards

### TypeScript / React
- **Never use `any`** — use `unknown` + type guards in catch blocks
- **Never use `React.FC`** — use plain function declarations or arrow functions with typed props
- **Always use `apiClient`** from `services/api-client.ts` — never import axios directly
- New components use Tailwind + shadcn/ui; use `cn()` from `@/lib/utils` for class merging
- Dark mode via `dark:` Tailwind prefix — no ThemeProvider needed

### C# / .NET
- Feature-based folder structure: `Features/{FeatureName}/{Controllers,Services,Models}/`
- Never duplicate `[Route]` attributes — check existing controllers before creating new ones
- Add new auth endpoints to existing `AuthController`, not new controllers

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`
- Reference task IDs: `feat: add task search (T301)`
- PRs ≤ 500 lines; split larger phases into sequential PRs
- Branch pattern: `phase-XX/description` → squash-merge to `develop` → release to `main`

---

## Development Workflow

### Scripts (always use these, not raw commands)
```powershell
.\start-dev.ps1      # Start Docker + API + frontend
.\stop-dev.ps1       # Stop all services
.\restart-dev.ps1    # Quick restart
.\reset-db.ps1       # Reset dev database + migrations
.\run-tests.ps1      # Run all test suites
.\view-logs.ps1      # View application logs
```

### Database backup (critical — read before suggesting a DB reset)

```powershell
.\scripts\backup-db.ps1                  # Manual backup now (stores in %USERPROFILE%\life-manager-backups\)
.\scripts\restore-db.ps1 -Latest         # Restore most recent backup
.\scripts\restore-db.ps1                 # List backups and choose one
.\scripts\setup-backup-schedule.ps1      # Register daily 02:00 Windows Scheduled Task
.\scripts\safe-db-reset.ps1              # Backup first, THEN docker-compose down -v
.\scripts\reset-user-password.ps1 -Email "..." -NewPassword "..."  # Reset a user's password
# Dev UI bypass: enable DevFeatures:AllowDirectPasswordReset + VITE_ENABLE_DEV_RESET, visit /dev/reset-password. See docs/guides/DEV-PASSWORD-RESET.md
```

> **NEVER suggest `docker-compose down -v` directly.** That destroys the Docker volume and all user data with no warning. Always use `.\scripts\safe-db-reset.ps1` instead — it backs up first. See `docs/guides/BACKUP-RESTORE.md` for full restore procedures.

### Before coding
1. Check `docs/CURRENT_STATE.md` — what is actively being built
2. Search for existing implementations before creating new files (`grep_search` first)
3. Follow established folder conventions — match existing code structure

### Documentation Requirements

#### During development (after every meaningful commit)

| What changed | What to update |
|---|---|
| New API endpoint | `CHANGELOG.md`; if it exposes user data, check `specs/platform/mcp-server.md` Future Extensions and add the MCP tool if not yet listed |
| Test count changes | `docs/testing/TEST-INVENTORY.md` — update counts immediately |
| New environment variable | `appsettings.Development.json` example values + `docs/guides/LAN_DEPLOYMENT.md` |
| Architecture decision | New ADR entry in `docs/ARCHITECTURAL_DECISIONS.md` |
| Breaking change | Document in `CHANGELOG.md` with migration steps before merging |
| New feature complete | Mark task `[x]` in the relevant tasks.md at the moment of completion |

#### After completing a phase
1. Mark all phase tasks complete `[x]` in the relevant tasks.md
2. Create `docs/phases/phase-XX-name/complete.md` (see existing examples for template)
3. Update `docs/testing/TEST-INVENTORY.md` with new total test counts
4. Update `docs/CURRENT_STATE.md` — move completed phase into "What Has Been Built"; advance "What Is Currently Being Built"
5. Update `specs/platform/SPEC-INDEX.md` if new phases, applications, or platform features were added
6. Update `CLAUDE.md` task ID table if new task ID blocks were allocated during the phase
7. If the phase built new data-bearing features, verify `specs/platform/mcp-server.md` Future Extensions has the corresponding MCP tool listed
8. Bump version in `VERSION.json`, `package.json`, `.csproj`, and `CHANGELOG.md`
9. Tag release: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`

### Session handover (end of every session)
Provide a structured summary: what changed, current build/test status, what's next, any decisions made. See `.github/copilot-instructions.md` for the full handover format template.

---

## AI Agent Guidelines

### What to read first (in order)
1. `CLAUDE.md` (this file) — orientation
2. `docs/CURRENT_STATE.md` — what is actively in progress
3. `docs/ARCHITECTURAL_DECISIONS.md` — ADR-style design decisions
4. Relevant spec file in `specs/applications/` or `specs/platform/`

### Task management
- Task IDs: T001–T924 (Todo + Fitness), T925–T1154 (Platform), T1155–T1289 (Finance — Phases 41–49), T1290–T1357 (Finance — Phase 43 additions/43b/47, allocated out of numeric order — see `specs/applications/finance/tasks.md`), T1257–T1388 (Platform frontend modernisation, Phases 51–54 — numerically overlaps the Finance range above; the two were allocated independently and don't collide in practice since each lives in its own spec file), T1389–T1503 (Todo productivity), T1504–T1518 (Fitness habits), T1519–T1595 (Stocks), T1596–T1667 (MCP Server — Phases 64–66), T1668–T1683 (Stocks MCP tools — Phase 67), T1684–T1749 (reserved but unreconciled — `specs/platform/mcp-server-tasks.md` calls this Phase 68 "Finance MCP Tools"; this table previously called it "Fitness/Weather MCP tools"; confirm which before allocating from it), T1750–T1773 (Finance — Phase 50, Household Account Sharing), T1774–T1784 (Finance — Phase 51, Financial Planning Gaps: planned savings/sinking funds/budget suggestions — note this "Phase 51" is a Finance-spec phase number and is unrelated to the Platform frontend modernisation "Phases 51–54" referenced above; the two live in separate spec files and don't collide in practice)
- Mark tasks `[x]` complete immediately after implementation
- Reference task IDs in commits and PRs

### Testing rules
- Update `docs/testing/TEST-INVENTORY.md` whenever tests are added/removed
- All 300+ tests must pass before merging to `develop`
- Backend: xUnit | Frontend: Jest + React Testing Library | E2E: Playwright

### Agent skills (Anvil)
- `.agents/skills/frontend-design/SKILL.md` — UI design principles and aesthetic guidance

---

## Key File Map

| What you need | Where to find it |
|--------------|-----------------|
| Current state / what's in progress | `docs/CURRENT_STATE.md` |
| Architecture decisions | `docs/ARCHITECTURAL_DECISIONS.md` |
| Full architecture overview | `docs/ARCHITECTURE.md` |
| Branching strategy | `docs/BRANCHING-STRATEGY.md` |
| Version management | `docs/VERSION-MANAGEMENT.md` |
| LAN deployment guide | `docs/guides/LAN_DEPLOYMENT.md` |
| Design system usage | `docs/guides/DESIGN_SYSTEM_USAGE.md` |
| Testing strategy & inventory | `docs/testing/` |
| Todo app spec & tasks | `specs/applications/todo/` |
| Platform specs (auth, microservices) | `specs/platform/` |
| Phase completion docs | `docs/phases/` |
| Dev scripts | `scripts/` |
| Shared UI package | `packages/ui/` |
| Shared schema package | `packages/schema/` |

# Life Manager — AI Context

> **Single source of truth for all AI agents working on this repository.**
> Current name: Life Manager (rename to Life Manager in progress).
> Read this file first. For deeper context, follow the links in "Key File Map" below.

---

## Project Identity

- **Name**: Life Manager → "Life Manager" (rename pending — see Work Stream 3 plan)
- **Type**: Multi-application personal productivity platform (monorepo)
- **Repository**: `jaevans36/finance-manager`
- **Stack**: .NET 8 API + React/TypeScript frontend + PostgreSQL
- **Language**: British English throughout all code, comments, and documentation
- **Current version**: 0.15.0 | Phase 50 (test infra & query migration) in progress

---

## Core Principles

1. **Security-First** — Authentication and authorisation mandatory for all data access. No hardcoded secrets; use environment variables. Input validation at every layer.
2. **Data Integrity** — ACID-compliant transactions. Audit trails on all data modifications. No `any` type in TypeScript — ever.
3. **Test-Driven Development** — Write tests before or alongside implementation. No feature ships without passing tests. 300+ tests must remain green.
4. **API-First Design** — Define OpenAPI contracts before implementation. All functionality accessible via RESTful API. Consistent error response format.
5. **Compliance & Audit Trail** — All user actions logged with attribution and timestamps. Privacy controls mandatory for personal data.

---

## Technology Stack

### Backend (`apps/finance-api/`)
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

### Before coding
1. Check `docs/CURRENT_STATE.md` — what is actively being built
2. Search for existing implementations before creating new files (`grep_search` first)
3. Follow established folder conventions — match existing code structure

### After completing a phase
1. Mark tasks complete in the relevant `specs/applications/*/tasks.md`
2. Create `docs/phases/phase-XX-name/complete.md` (see existing examples for template)
3. Update `docs/testing/TEST-INVENTORY.md` with new test counts
4. Bump version in `VERSION.json`, `package.json`, `.csproj`, and `CHANGELOG.md`
5. Tag release: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`

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
- Task IDs are in `specs/applications/todo/tasks.md` (T001–T1388 allocated)
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

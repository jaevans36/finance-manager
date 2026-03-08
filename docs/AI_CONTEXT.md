# AI Context — Life Manager Platform

> **Start here**: Read `CLAUDE.md` at the project root first. This file provides deeper architectural detail.
> **Last Updated**: 2026-03-08 | **Version**: 0.15.0 | **Branch**: `phase-50/test-infra-and-query-migration`

---

## 1. Platform Identity

- **Name**: Life Manager (rename to "Life Manager" pending — Work Stream 3)
- **Type**: Multi-application personal productivity platform
- **Repository**: `jaevans36/finance-manager`
- **Monorepo**: pnpm workspaces (`apps/*`, `packages/*`)
- **Language**: British English throughout all code and documentation

---

## 2. Technology Stack

### Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | .NET 8.0 | 8.0.x |
| Language | C# | 12 |
| ORM | Entity Framework Core | 8.0.11 |
| Database | PostgreSQL | 15 (Alpine, Docker) |
| Auth | JWT Bearer (symmetric HS256) | — |
| Password Hashing | BCrypt.Net-Next | 4.0.3 |
| Logging | Serilog (console + rolling file) | 10.0.0 |
| API Docs | Swashbuckle (Swagger) | 6.6.2 |
| Code Style | StyleCop.Analyzers | 1.1.118 |

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.2+ |
| Language | TypeScript | 5.7+ |
| Build | Vite | 6.0+ |
| Routing | react-router-dom | 6.21+ |
| Styling | Tailwind CSS + shadcn/ui | 3.4+ |
| Server State | TanStack Query | 5.0+ |
| Forms | React Hook Form + Zod | 7.0+ / 3.0+ |
| HTTP | Axios (via centralised `apiClient`) | 1.6+ |
| Icons | lucide-react | 0.555+ |
| Charts | Recharts | 3.6+ |
| DnD | @dnd-kit | — |

### Shared Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@life-manager/ui` | `packages/ui/` | Design tokens, shared components, themes |
| `@life-manager/schema` | `packages/schema/` | Zod validation schemas, shared types |

### Testing

| Layer | Tool | Purpose |
|-------|------|---------|
| Backend Unit | xUnit + Moq + FluentAssertions | Service-level tests |
| Backend Integration | xUnit + WebApplicationFactory | Controller/API tests |
| Frontend Unit | Jest + Testing Library | Component tests |
| Frontend E2E | Playwright (Chromium) | User flow tests |

---

## 3. Architecture

### Backend Structure (Feature-Based)

```
apps/finance-api/
├── Program.cs                    ← DI, middleware pipeline, app config
├── Middleware/                    ← SecurityHeaders, RateLimit, ErrorLogging
├── Data/FinanceDbContext.cs       ← EF Core context
├── Migrations/                    ← EF Core migrations
└── Features/
    ├── Auth/                      ← Registration, login, JWT, sessions
    ├── Tasks/                     ← Task CRUD, groups, subtasks, classification
    ├── Events/                    ← Calendar events with recurrence
    ├── Statistics/                ← Aggregated task/event stats
    ├── Admin/                     ← User management, system config
    ├── Common/                    ← Sessions, password reset, email verification, activity logs
    ├── Finance/                   ← Account/Transaction models (placeholder — Phase 41+)
    └── Version/                   ← CHANGELOG parsing, version API
```

### Frontend Structure

```
apps/web/src/
├── components/                    ← Feature-organised components (Tailwind + shadcn/ui)
├── contexts/                      ← AuthContext, ToastContext
├── hooks/
│   ├── forms/                     ← React Hook Form hooks (useLoginForm, useCreateTaskForm, etc.)
│   └── queries/                   ← TanStack Query hooks (useTasks, useEvents, etc.)
├── pages/                         ← Route-level components (lazy-loaded)
├── services/                      ← API service layer (all use apiClient)
├── styles/                        ← Global CSS, Tailwind config
├── types/                         ← TypeScript interfaces
└── utils/                         ← Helpers (error, cache)
```

### Data Flow

```
User → React Page → Query Hook (TanStack) → Service Layer → apiClient (Axios)
                                                                 ↓ JWT from localStorage
                                              /api/v1/* → Controller → Service → EF Core → PostgreSQL
```

### API Versioning

- Main API: `api/v1/{resource}`
- Admin API: `api/admin/{resource}`
- Health: `api/health`
- Version: `api/version/*`

### Middleware Pipeline (Order)

1. SecurityHeadersMiddleware (OWASP headers)
2. RateLimitMiddleware (60/min, 1000/hr sliding window)
3. ErrorLoggingMiddleware (global exception handler)
4. Serilog request logging
5. Swagger (dev only)
6. CORS (`http://localhost:5173`)
7. Response caching
8. Authentication → Authorisation
9. MapControllers

---

## 4. Coding Conventions

### C# Backend

- Feature-based folder structure: `Features/{Feature}/Controllers|DTOs|Models|Services/`
- Interface-based DI: `IService` → `Service`, all registered `AddScoped`
- Async/await throughout all service and controller methods
- EF Core Fluent API for entity configuration in `OnModelCreating`
- Nullable reference types enabled; StyleCop enforced
- Controllers decorated with `[ApiController]`, `[Route("api/v1/...")]`, `[Authorize]`
- DTOs for all request/response shapes — no entity exposure to API

### TypeScript Frontend

- **NEVER** use `React.FC` — use `export const Component = ({ prop }: Props) => { ... }`
- **NEVER** use `any` — use `unknown` + type guards in catch blocks
- All API calls through `apiClient` from `services/api-client.ts`
- New components: Tailwind utility classes + shadcn/ui components + `cn()` from `@/lib/utils`
- Dark mode via `dark:` prefix — no ThemeProvider needed
- All pages lazy-loaded with `React.lazy()` + `Suspense`
- Protected routes via `<ProtectedRoute>` and `<AdminRoute>`

### Git

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`
- Max 500 lines per PR — split large phases into sequential PRs
- Task references in commits: `feat: implement login (T035)`
- See `docs/BRANCHING-STRATEGY.md` for full GitFlow details

---

## 5. Active Applications

| Application | Status | Phases | Tasks |
| ----------- | ------ | ------ | ----- |
| To Do | ✅ Live (v0.15.0) | 1-57 | T001-T799 |
| Fitness | Specified | 14-21 | T800-T924 |
| Weather | Specified | 32-35 | T1055-T1104 |
| Finance | Specified | 41-47 | T1155-T1256 |

## 6. Platform Infrastructure (Specified, Not Yet Started)

| Feature | Phases | Tasks |
| ------- | ------ | ----- |
| Auth Service | 22-24 | T925-T972 |
| Microservices | 25-27 | T973-T1008 |
| Test Automation | 28-31 | T1009-T1054 |
| DB Abstraction | 36-37 | T1105-T1126 |
| Project Rename | 38-40 | T1127-T1154 |

---

## 7. Key File References

| Purpose | File |
|---------|------|
| **Primary AI context** | `CLAUDE.md` (root) |
| Current state | `docs/CURRENT_STATE.md` |
| Architecture decisions | `docs/ARCHITECTURAL_DECISIONS.md` |
| Version | `VERSION.json` |
| Changelog | `CHANGELOG.md` |
| Branching strategy | `docs/BRANCHING-STRATEGY.md` |
| Spec index | `specs/platform/SPEC-INDEX.md` |
| To Do tasks | `specs/applications/todo/tasks.md` |
| Design system guide | `docs/guides/DESIGN_SYSTEM_USAGE.md` |
| API client | `apps/web/src/services/api-client.ts` |
| App entry | `apps/web/src/App.tsx` |
| Backend entry | `apps/finance-api/Program.cs` |
| DB context | `apps/finance-api/Data/FinanceDbContext.cs` |
| Docker | `docker-compose.yml` |
| Dev scripts | `scripts/README.md` |

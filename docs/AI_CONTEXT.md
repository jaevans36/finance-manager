# AI Context — Finance Manager Platform

> **Purpose**: Deterministic context file for any AI model working on this repository.  
> **Last Updated**: 2026-02-25  
> **Version**: 0.15.0  
> **Branch**: `001-todo-app`

---

## 1. Platform Identity

- **Name**: Finance Manager (planned rename to "Life Manager")
- **Type**: Multi-application personal productivity platform
- **Repository**: `jaevans36/finance-manager`
- **Monorepo**: pnpm workspaces (`apps/*`, `packages/*`)
- **Language**: British English throughout all code and documentation

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
| Language | TypeScript | 5.3+ |
| Build | Vite | 6.0+ |
| Routing | react-router-dom | 6.21+ |
| Styling | styled-components | 6.1+ |
| Styling (planned) | Tailwind CSS + shadcn/ui | 3.4+ / latest |
| Server State (planned) | TanStack Query | 5.0+ |
| Forms (planned) | React Hook Form + Zod | 7.0+ / 3.0+ |
| Data Tables (planned) | TanStack Table | 8.0+ |
| HTTP | Axios (via centralised `apiClient`) | 1.6+ |
| Icons | lucide-react | 0.555+ |
| Charts | Recharts | 3.6+ |
| DnD | @dnd-kit | — |

### Shared Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@finance-manager/ui` | `packages/ui/` | Design tokens, shared components, themes |
| `@finance-manager/schema` | `packages/schema/` | Zod validation schemas, shared types |

### Testing

| Layer | Tool | Purpose |
|-------|------|---------|
| Backend Unit | xUnit + Moq + FluentAssertions | Service-level tests |
| Backend Integration | xUnit + WebApplicationFactory + EF InMemory | Controller/API tests |
| Frontend Unit | Jest + Testing Library | Component tests |
| Frontend E2E | Playwright (Chromium) | User flow tests |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Container | Docker Compose (PostgreSQL only) |
| Package Manager | pnpm ≥9.0 |
| Node | ≥18.0 |
| Dev Scripts | PowerShell (`scripts/*.ps1`) |
| CI | GitHub Actions |

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
    ├── Tasks/                     ← Task CRUD, groups, subtasks
    ├── Events/                    ← Calendar events
    ├── Statistics/                ← Aggregated task/event stats
    ├── Admin/                     ← User management, system config
    ├── Common/                    ← Shared: sessions, password reset, email verification, activity logs
    ├── Finance/                   ← Account/Transaction models (placeholder)
    └── Version/                   ← CHANGELOG parsing, version API
```

### Frontend Structure

```
apps/web/src/
├── components/                    ← Feature-organised components
├── contexts/                      ← AuthContext, ToastContext
├── hooks/                         ← Custom React hooks (+ planned query/form hooks)
├── pages/                         ← Route-level components (lazy-loaded)
├── services/                      ← API service layer (all use apiClient)
├── styles/                        ← Theme, layout tokens, typography, global CSS
├── types/                         ← TypeScript interfaces
└── utils/                         ← Helpers (error, cache)
```

### Data Flow

```
User → React Page → Service Layer → apiClient (Axios) → /api/v1/* → Controller → Service → EF Core → PostgreSQL
                                          ↑ JWT token from localStorage
```

### API Versioning

- Main API: `api/v1/{resource}`
- Admin API: `api/admin/{resource}`
- Health: `api/v1/health`
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

## 4. Coding Conventions

### C# Backend

- Feature-based folder structure: `Features/{Feature}/Controllers|DTOs|Models|Services/`
- Interface-based DI: `IService` → `Service`, all registered `AddScoped`
- Async/await throughout all service and controller methods
- EF Core Fluent API for entity configuration in `OnModelCreating`
- Nullable reference types enabled
- StyleCop enforced
- Controllers decorated with `[ApiController]`, `[Route("api/v1/...")]`, `[Authorize]`
- DTOs for all request/response shapes — no entity exposure to API

### TypeScript Frontend

- **NEVER** use `React.FC` or `React.FunctionComponent`
- **NEVER** use `any` type — use `unknown` + type guards
- Components: `export const Component = ({ prop }: Props) => { ... }`
- All API calls through `apiClient` from `services/api-client.ts`
- All pages lazy-loaded with `React.lazy()` + `Suspense`
- Design tokens from `@finance-manager/ui/styles` — never hardcode values
- Theme-aware colours: `${({ theme }) => theme.colors.*}` — never hardcode hex
- Spacing scale: 4px base (`xs`=4, `sm`=8, `md`=12, `lg`=16, `xl`=20, `2xl`=24, `3xl`=32, `4xl`=40, `5xl`=48)
- Error boundaries wrap major sections
- Protected routes via `<ProtectedRoute>` and `<AdminRoute>` components

### Git

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`
- Max 500 lines per PR
- Branch: feature branches off `001-todo-app`
- Task references in commits: `feat: implement login (T035)`

### Testing

- Backend: Arrange-Act-Assert pattern, FluentAssertions, Moq for DI mocks
- Frontend: render → query → assert with Testing Library
- E2E: Playwright spec files per user flow, Chromium only
- Coverage tool: coverlet (backend), jest --coverage (frontend)

## 5. Specification System (SpecKit)

- Specs live in `specs/`
- Platform specs: `specs/platform/`
- App specs: `specs/applications/{app-name}/`
- User stories: P1-P5 priority, Given/When/Then acceptance scenarios
- Tasks: `[TID] [P?] [Story] Description - Xh` format with checkboxes
- Task IDs: Sequential across all features (T001-T1388 allocated)
- Phases: Numbered 1-54 across all planned features
- Index: `specs/platform/SPEC-INDEX.md`

## 6. Design System

- Package: `@finance-manager/ui` at `packages/ui/`
- **Current**: styled-components based — tokens via JS objects, themes via ThemeProvider
- **Planned migration**: Tailwind CSS + shadcn/ui (Phase 48-53) — tokens via CSS variables, themes via `dark:` class
- Tokens: `spacing`, `typography`, `borderRadius`, `shadows`, `transitions`
- Themes: `lightTheme`, `darkTheme` — both WCAG AAA compliant
- Icons: Lucide React only — no emoji in UI
- Components: Button, Card, Input, Modal, Badge, Alert, Heading1-3, Skeleton
- Documentation route: `/design-system`
- Guide: `docs/guides/DESIGN_SYSTEM_USAGE.md`
- Modernisation spec: `specs/platform/frontend-modernisation.md`

## 7. Active Applications

| Application | Status | Phases | Tasks |
|-------------|--------|--------|-------|
| To Do | Implemented (v0.15.0) | 1-13 | T001-T799 |
| Fitness | Specified | 14-21 | T800-T924 |
| Weather | Specified | 32-35 | T1055-T1104 |
| Finance | Specified | 41-47 | T1155-T1256 |

## 8. Platform Infrastructure (Specified)

| Feature | Phases | Tasks |
|---------|--------|-------|
| Auth Service | 22-24 | T925-T972 |
| Microservices | 25-27 | T973-T1008 |
| Test Automation | 28-31 | T1009-T1054 |
| DB Abstraction | 36-37 | T1105-T1126 |
| Project Rename | 38-40 | T1127-T1154 |
| Frontend Modernisation | 48-54 | T1257-T1388 |

## 9. Key File References

| Purpose | File |
|---------|------|
| AI instructions | `.github/copilot-instructions.md` |
| Version | `VERSION.json` |
| Changelog | `CHANGELOG.md` |
| Spec index | `specs/platform/SPEC-INDEX.md` |
| To Do tasks | `specs/001-todo-app/tasks.md` |
| Design tokens | `packages/ui/src/styles/layout.ts` |
| Theme definition | `packages/ui/src/styles/theme.ts` |
| API client | `apps/web/src/services/api-client.ts` |
| App entry | `apps/web/src/App.tsx` |
| Backend entry | `apps/finance-api/Program.cs` |
| DB context | `apps/finance-api/Data/FinanceDbContext.cs` |
| Docker | `docker-compose.yml` |
| Dev scripts | `scripts/README.md` |

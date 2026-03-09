# Life Manager Architecture

**Last Updated**: 2026-01-14  
**Version**: 2.0

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Feature-Based Organisation](#feature-based-organisation)
5. [Development Workflow](#development-workflow)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Architecture](#deployment-architecture)

---

## Overview

Life Manager is a personal productivity and finance management platform built as a monorepo with clear separation between frontend and backend concerns. The application prioritises maintainability, scalability, and developer experience through consistent architectural patterns.

### Core Principles

1. **Feature-Based Organisation** - Code organised by business features, not technical layers
2. **Type Safety** - TypeScript throughout frontend, C# for backend (no `any` types allowed)
3. **Test Coverage** - Comprehensive testing at unit, integration, and E2E levels
4. **Documentation** - All architectural decisions documented and maintained
5. **Developer Experience** - PowerShell scripts automate common workflows

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.7.2 | Type safety |
| Vite | 6.4.1 | Build tool & dev server |
| React Router | 6.x | Client-side routing |
| Styled Components | 6.1.13 | Component styling |
| Axios | 1.7.9 | HTTP client |
| Recharts | 2.15.0 | Data visualisation |
| Lucide React | 0.468.0 | Icon library |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| .NET Core | 8.0 | Runtime framework |
| ASP.NET Core | 8.0 | Web API framework |
| Entity Framework Core | 8.0.11 | ORM |
| PostgreSQL | 16+ | Database |
| BCrypt.Net | 0.1.0 | Password hashing |
| FluentValidation | 11.11.0 | Input validation |

### Development Tools

| Tool | Purpose |
|------|---------|
| Docker Compose | Local database |
| PowerShell | Development scripts |
| Jest | Frontend unit tests |
| Playwright | E2E tests |
| xUnit | Backend unit tests |
| ESLint | Code linting |
| Prettier | Code formatting |

---

## Project Structure

### Monorepo Layout

```
Life Manager/
├── apps/
│   ├── finance-api/          # C# .NET Web API (primary backend)
│   ├── finance-api-tests/    # xUnit tests for backend
│   └── web/                  # React TypeScript frontend
│       ├── src/
│       ├── e2e/              # Playwright E2E tests
│       └── tests/            # Jest unit & integration tests
├── docs/                     # Project documentation
│   ├── development/          # Development guides
│   ├── testing/              # Testing documentation
│   └── api/                  # API documentation
├── scripts/                  # PowerShell automation scripts
└── specs/                    # Feature specifications
    ├── 001-todo-app/         # Current feature tasks
    ├── applications/         # Application specs
    └── platform/             # Platform architecture
```

---

## Feature-Based Organisation

### Why Feature-Based?

Traditional applications organise code by technical concerns (controllers, services, models). This creates problems:
- ❌ Related code scattered across multiple directories
- ❌ Difficult to understand feature boundaries
- ❌ Hard to delete features cleanly
- ❌ Encourages tight coupling between features

Feature-based organisation solves these issues:
- ✅ All feature code co-located
- ✅ Clear boundaries and responsibilities
- ✅ Easy to add/remove features
- ✅ Natural separation of concerns

### Backend Structure

**Location**: `apps/finance-api/Features/`

```
Features/
├── Auth/                          # Authentication & authorisation
│   ├── Controllers/
│   │   └── AuthController.cs      # Login, register, logout endpoints
│   ├── Services/
│   │   ├── AuthService.cs         # Business logic
│   │   └── TokenService.cs        # JWT token management
│   ├── DTOs/
│   │   ├── LoginRequest.cs
│   │   ├── RegisterRequest.cs
│   │   └── AuthResponse.cs
│   └── Validators/
│       └── RegisterRequestValidator.cs
│
├── Tasks/                         # Task management
│   ├── Controllers/
│   │   └── TasksController.cs     # CRUD endpoints
│   ├── Services/
│   │   └── TaskService.cs         # Business logic
│   ├── DTOs/
│   │   ├── CreateTaskRequest.cs
│   │   ├── UpdateTaskRequest.cs
│   │   └── TaskResponse.cs
│   └── Validators/
│
├── TaskGroups/                    # Task grouping/categorisation
│   ├── Controllers/
│   ├── Services/
│   ├── DTOs/
│   └── Validators/
│
└── Statistics/                    # Analytics & reporting
    ├── Controllers/
    │   └── StatisticsController.cs
    ├── Services/
    │   └── StatisticsService.cs
    └── DTOs/
```

**Naming Conventions**:
- Controllers: `{Feature}Controller.cs` (e.g., `AuthController.cs`)
- Services: `{Feature}Service.cs` (e.g., `TaskService.cs`)
- DTOs: Descriptive names ending in `Request`/`Response` (e.g., `CreateTaskRequest.cs`)
- One controller per route prefix (e.g., `/api/v1/auth` → `AuthController`)

### Frontend Structure

**Location**: `apps/web/src/pages/`

```
pages/
├── auth/                          # Authentication feature
│   ├── LoginPage.tsx              # /login
│   ├── RegisterPage.tsx           # /register
│   ├── ForgotPasswordPage.tsx     # /forgot-password
│   ├── ResetPasswordPage.tsx      # /reset-password/:token
│   ├── VerifyEmailPage.tsx        # /verify-email/:token
│   └── ResendVerificationPage.tsx # /resend-verification
│
├── dashboard/                     # Main dashboard
│   ├── DashboardPage.tsx          # /dashboard (main component)
│   └── components/                # Dashboard-specific components
│       ├── DashboardHeader.tsx
│       ├── DashboardLayout.tsx
│       └── index.ts
│
├── calendar/                      # Calendar view
│   ├── CalendarPage.tsx           # /calendar
│   └── components/
│       ├── EmptyCalendarState.tsx
│       ├── KeyboardShortcutsHint.tsx
│       └── index.ts
│
├── weekly-progress/               # Weekly progress analytics
│   ├── WeeklyProgressPage.tsx     # /weekly-progress
│   └── components/                # Progress-specific components
│       ├── ChartCard.tsx
│       ├── ErrorDisplay.tsx
│       └── index.ts               # Barrel export
│
└── profile/                       # User profile
    └── ProfilePage.tsx            # /profile
```

**Naming Conventions**:
- Folders: `kebab-case` (e.g., `weekly-progress`, `auth`)
- Page components: `PascalCase.tsx` (e.g., `WeeklyProgressPage.tsx`)
- Sub-components: `PascalCase.tsx` (e.g., `DashboardHeader.tsx`)
- Components folder: Created only when components are extracted from page

**When to Create `components/` Subfolder**:

✅ **Create `components/` when**:
- Page file exceeds ~500 lines
- Multiple reusable sections identified
- Components have complex logic worth isolating
- Team needs to work on page sections independently

❌ **Don't create `components/` when**:
- Page is simple and self-contained (<300 lines)
- No clear component boundaries
- Would create single-use components with no reusability

**Import Path Updates After Folder Move**:
When moving a page into a feature folder (e.g., `pages/LoginPage.tsx` → `pages/auth/LoginPage.tsx`):
- All relative imports need an extra `../`
- Example: `'../services/authService'` → `'../../services/authService'`
- Update `App.tsx` lazy imports to new path

### Shared Code

**Location**: `apps/web/src/`

```
src/
├── components/           # Shared UI components (used across features)
│   ├── ui/              # Base UI library (Button, Card, etc.)
│   ├── auth/            # Auth-related shared components (LoginForm, etc.)
│   └── charts/          # Chart components (BarChart, PieChart)
│
├── services/            # API client services
│   ├── api-client.ts    # Axios instance with interceptors
│   ├── authService.ts   # Auth API calls
│   ├── taskService.ts   # Task API calls
│   └── README.md        # Service patterns & conventions
│
├── contexts/            # React contexts (global state)
│   ├── AuthContext.tsx  # Authentication state
│   └── ToastContext.tsx # Toast notifications
│
├── types/               # TypeScript type definitions
│   ├── auth.ts
│   ├── task.ts
│   └── statistics.ts
│
└── utils/               # Utility functions
    ├── dateHelpers.ts
    └── errorHelpers.ts
```

---

## Development Workflow

### Local Development

All development tasks use PowerShell scripts in the `scripts/` directory:

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `start-dev.ps1` | Full startup (Docker + API + Frontend) | First time, or database stopped |
| `restart-dev.ps1` | Restart servers only | Code changes, quick iteration |
| `stop-dev.ps1` | Stop all services | End of day |
| `reset-db.ps1` | Reset development database | Schema changes, fresh data |
| `reset-test-db.ps1` | Reset test database | Test data corruption |
| `run-tests.ps1` | Run all test suites | Before commits |
| `view-logs.ps1` | View application logs | Debugging |

**Development URLs**:
- Frontend (Vite): http://localhost:5173
- Backend (C# .NET): http://localhost:5000
- Swagger UI: http://localhost:5000/swagger
- PostgreSQL: localhost:5432

### Git Workflow

**Branch Strategy**:
- `main` - Production-ready code
- `001-todo-app` - Current feature branch (Todo App)
- Feature branches off `001-todo-app` for sub-features

**Commit Convention** (Conventional Commits):
```
type(scope): description

feat: add calendar view with keyboard navigation
fix: resolve import path errors in auth pages
refactor: organise pages into feature-based folders
test: add E2E tests for calendar filtering
docs: update architecture documentation
```

**Commit Guidelines**:
- Maximum 500 lines changed per commit (for easier review)
- Update documentation in same commit as code changes
- Mark tasks complete in `specs/001-todo-app/tasks.md`

---

## Testing Strategy

### Test Pyramid

```
        /\
       /E2E\       ~30 tests (10%)     Full user workflows
      /____\
     /      \
    /  INT  \     ~80 tests (30%)     Service integration
   /________\
  /          \
 /    UNIT   \   ~130 tests (60%)    Pure functions
/____________\
```

**Current Coverage**: 235 tests (100% pass rate)

### Test Locations

| Type | Location | Command |
|------|----------|---------|
| Backend Unit | `apps/finance-api-tests/FinanceApi.UnitTests/` | `dotnet test` |
| Frontend Unit | `apps/web/tests/` | `pnpm test` |
| Integration | `apps/web/tests/integration/` | `pnpm test:integration` |
| E2E | `apps/web/e2e/` | `pnpm test:e2e` |

### Testing Documentation

Comprehensive testing guides available:
- [TEST-INVENTORY.md](testing/TEST-INVENTORY.md) - Test coverage matrix
- [TEST-WRITING-GUIDE.md](testing/TEST-WRITING-GUIDE.md) - How to write tests
- [NIGHTLY-TESTS.md](testing/NIGHTLY-TESTS.md) - Extended test suite

---

## Deployment Architecture

### Production Stack (Planned)

```
┌─────────────────────────────────────────┐
│   Cloudflare (CDN + DDoS Protection)    │
└───────────────┬─────────────────────────┘
                │
    ┌───────────▼──────────────┐
    │    Nginx Reverse Proxy   │
    │    (SSL Termination)     │
    └───────────┬──────────────┘
                │
       ┌────────┴─────────┐
       │                  │
┌──────▼──────┐   ┌──────▼──────────┐
│  React SPA  │   │ .NET Web API    │
│  (Vite)     │   │ (Kestrel)       │
│  Port 5173  │   │ Port 5000       │
└─────────────┘   └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  PostgreSQL 16  │
                  │  (Docker)       │
                  └─────────────────┘
```

### Hosting Options (Under Evaluation)

1. **Self-Hosted** (Cloudflare Tunnel)
   - Cost: Free (Cloudflare) + hardware
   - Control: Full control
   - Scalability: Limited

2. **Hetzner Cloud VPS** (CPX11)
   - Cost: £3.85/month
   - Control: Full VPS access
   - Scalability: Manual

3. **Railway** (PaaS)
   - Cost: ~$10/month
   - Control: Limited
   - Scalability: Automatic

See [specs/applications/todo/enhancements.md](../specs/applications/todo/enhancements.md) Phase 5 for detailed deployment specifications.

---

## Key Documentation

### For New Developers
1. [README.md](../README.md) - Project overview
2. [QUICKSTART.md](../QUICKSTART.md) - Setup instructions
3. This document (ARCHITECTURE.md) - Architectural decisions
4. [pages-structure.md](development/pages-structure.md) - Frontend structure details

### For Feature Development
1. [specs/001-todo-app/tasks.md](../specs/001-todo-app/tasks.md) - Task list
2. [TEST-WRITING-GUIDE.md](testing/TEST-WRITING-GUIDE.md) - How to test
3. [API documentation](api/) - Backend API contracts

### For DevOps
1. [CI-CD.md](CI-CD.md) - Continuous integration
2. [LOGGING.md](LOGGING.md) - Log management
3. [error-logging-monitoring.md](error-logging-monitoring.md) - Error tracking

---

## Architectural Decision Records

### ADR-001: Feature-Based Organisation
**Date**: 2026-01-14  
**Status**: Accepted

**Context**: Application was growing with pages scattered in flat `pages/` directory, making it difficult to understand feature boundaries and locate related code.

**Decision**: Adopt feature-based folder structure for both frontend pages and backend API.

**Consequences**:
- ✅ Easier to understand feature scope
- ✅ Clearer ownership and boundaries
- ✅ Better scalability as features grow
- ⚠️ Requires import path updates when moving files
- ⚠️ Developers need to understand when to create `components/` subfolder

**Implementation**: Commit `77a220a` - Reorganised all pages into feature folders

### ADR-002: PowerShell Development Scripts
**Date**: 2025-12-10  
**Status**: Accepted

**Context**: Development workflow required running multiple commands in specific order, causing setup friction and inconsistency.

**Decision**: Create PowerShell scripts to automate common workflows (start, restart, stop, reset).

**Consequences**:
- ✅ Consistent development environment
- ✅ Reduced setup time for new developers
- ✅ Fewer human errors in workflow
- ⚠️ Windows-only (requires PowerShell)

### ADR-003: TypeScript Strict Mode
**Date**: 2025-11-15  
**Status**: Accepted

**Context**: Need to ensure type safety throughout application.

**Decision**: Enable TypeScript strict mode and prohibit `any` type usage.

**Consequences**:
- ✅ Catch errors at compile time
- ✅ Better IDE support and autocomplete
- ✅ Self-documenting code
- ⚠️ Slightly more verbose code
- ⚠️ Learning curve for TypeScript newcomers

---

## Contact & Support

For questions about architecture:
- See [docs/](.) for detailed documentation
- Check [specs/](../specs/) for feature specifications
- Review [tests/](../apps/web/tests/) for usage examples

This document is maintained by the development team and updated with each major architectural change.

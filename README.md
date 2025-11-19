# Finance Manager - To Do App

[![CI](https://github.com/jaevans36/finance-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/jaevans36/finance-manager/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-119%20passing-brightgreen)](https://github.com/jaevans36/finance-manager)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/jaevans36/finance-manager)

Personal finance manager with To Do app foundation, built with a modern full-stack TypeScript architecture.

## 🏗️ Project Status

**Current Phase**: Todo App v2.0 - Phase 1 Backend Complete ✅  
**Test Coverage**: 119 tests passing (100% pass rate)  
**CI/CD**: GitHub Actions configured and running  
**Next Phase**: Phase 1 Testing & Frontend

### ✅ Completed

- **Phase 1: Setup**
  - Monorepo structure with pnpm workspaces
  - TypeScript configuration for all packages
  - ESLint and Prettier setup
  - Jest testing framework configured

- **Phase 2: Foundational Infrastructure** 
  - PostgreSQL + Prisma ORM setup with User and Task models
  - Shared TypeScript types and Zod validation schemas
  - Express.js API server with middleware (auth, logging, error handling)
  - React 18 + Vite frontend with routing and API client
  - JWT utilities and bcrypt password hashing
  - Protected routes and auth context

- **Phase v2.0.1: Security & Foundation (Backend)** ✨ NEW
  - Password reset flow with email tokens
  - Email verification system
  - Multi-device session management
  - Comprehensive activity logging (17 event types)
  - Password strength validation
  - Account lockout after 5 failed attempts
  - Email notifications (nodemailer)
  - 13 new API endpoints
  - Updated auth routes with session tracking

### 📋 Next Steps

See `specs/001-todo-app/spec-v2-enhancements.md` for v2.0 enhancements.

**Immediate Next Steps**:
- Write tests for Phase 1 security features
- Build frontend components (password reset, email verification, session management)
- Update existing tests for new features
- Continue to Phase 2: Organization & Productivity

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Validation**: Zod schemas
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Language**: TypeScript 5.x
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library

### Monorepo Structure
```
apps/
├── api/          # Express REST API
└── web/          # React frontend
packages/
├── schema/       # Shared types & validation
└── ui/           # Shared UI components
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- pnpm 8.x or higher
- Docker Desktop (for PostgreSQL database)

### Installation

```powershell
# Clone and install dependencies
git clone <repository-url>
cd "Finance Manager"
pnpm install
```

### Database Setup

```powershell
# Start PostgreSQL database using Docker
docker-compose up -d

# Run database migrations
cd apps/api
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# Optional: Open Prisma Studio to view/edit data
pnpm db:studio
```

**Database Management:**
```powershell
# Reset development database (WARNING: deletes all data)
.\reset-db.ps1

# Reset test database (safe to run anytime)
.\reset-test-db.ps1

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v

# View database logs
docker logs finance-manager-db
```

### Development

**Quick Start (recommended):**
```powershell
# First time setup - starts database, runs migrations, and starts servers
.\start-dev.ps1

# Quick restart (when database is already running)
.\restart-dev.ps1

# Stop all services
.\stop-dev.ps1
```

**Manual Commands:**
```powershell
# Start both API and web in parallel
pnpm dev

# Or run individually:
pnpm dev:api    # API server on http://localhost:3000
pnpm dev:web    # Web app on http://localhost:5173
```

### Testing

**Test Runner Scripts:**
```powershell
# Run all tests (119 tests) - recommended
.\run-tests.ps1

# Run specific test suites
.\run-tests.ps1 -Backend    # Backend tests only
.\run-tests.ps1 -Frontend   # Frontend tests only
.\run-tests.ps1 -E2E        # E2E tests only (requires services running)

# Watch mode for TDD
.\run-tests.ps1 -Backend -Watch
.\run-tests.ps1 -Frontend -Watch

# Coverage reports
.\run-tests.ps1 -Coverage
```

**Direct pnpm Commands:**
```powershell
pnpm test              # All tests
pnpm test:api          # Backend (44 tests)
pnpm test:web          # Frontend (71 tests)
pnpm test:e2e          # E2E (4 tests)
```

**Test Coverage:**
- ✅ **Backend**: 44 tests (16 auth + 28 tasks)
- ✅ **Frontend**: 71 tests (TaskItem, TaskList, CreateForm, EditModal)
- ✅ **E2E**: 4 tests (user journey, validation, auth errors, protected routes)
- 📊 **Total**: 119 tests with 100% pass rate

See `specs/testing-strategy.md` for detailed testing documentation.

## 📁 Project Structure

```
Finance Manager/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── config/     # Environment & database config
│   │   │   ├── middleware/ # Express middleware
│   │   │   ├── routes/     # API routes (to be added)
│   │   │   ├── services/   # Business logic (to be added)
│   │   │   ├── utils/      # JWT & password utilities
│   │   │   └── server.ts   # Express app entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── tests/
│   │
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── contexts/    # Auth context
│       │   ├── pages/       # Page components (to be added)
│       │   ├── services/    # API client
│       │   ├── styles/      # Global styles
│       │   ├── App.tsx      # Main app component
│       │   └── main.tsx     # Entry point
│       └── tests/
│
├── packages/
│   ├── schema/              # Shared types & validation
│   │   └── src/
│   │       ├── types/       # TypeScript interfaces
│   │       └── validation/  # Zod schemas
│   │
│   └── ui/                  # Shared UI components
│       └── src/
│
└── specs/
    └── 001-todo-app/        # Feature specification
        ├── spec.md          # User stories
        ├── plan.md          # Technical plan
        ├── tasks.md         # Task breakdown (130 tasks)
        ├── data-model.md    # Database schema
        ├── quickstart.md    # Development guide
        └── contracts/       # API contracts
            └── api-spec.yaml
```

## 🔐 Environment Variables

Create `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_manager_dev"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration ✅
- `POST /api/v1/auth/login` - User login ✅
- `POST /api/v1/auth/logout` - User logout ✅
- `POST /api/v1/auth/refresh` - Refresh access token ✅
- `GET /api/v1/auth/me` - Get current user ✅

### Password Reset ✨ NEW
- `POST /api/v1/password-reset/request` - Request reset email
- `POST /api/v1/password-reset/reset` - Reset password with token
- `GET /api/v1/password-reset/verify/:token` - Validate reset token

### Email Verification ✨ NEW
- `GET /api/v1/email-verification/verify/:token` - Verify email
- `POST /api/v1/email-verification/resend` - Resend verification
- `GET /api/v1/email-verification/status` - Check status

### Session Management ✨ NEW
- `GET /api/v1/sessions` - List all user sessions
- `DELETE /api/v1/sessions/:sessionId` - Logout from device
- `POST /api/v1/sessions/terminate-others` - Logout all other devices

### Activity Logs ✨ NEW
- `GET /api/v1/activity-logs` - Get paginated logs
- `GET /api/v1/activity-logs/summary` - Get activity summary
- `GET /api/v1/activity-logs/security` - Get security events

### Tasks
- `GET /api/v1/tasks` - List user's tasks ✅
- `POST /api/v1/tasks` - Create task ✅
- `GET /api/v1/tasks/:id` - Get task by ID ✅
- `PUT /api/v1/tasks/:id` - Update task ✅
- `PATCH /api/v1/tasks/:id/complete` - Toggle completion ✅
- `DELETE /api/v1/tasks/:id` - Delete task ✅

See [docs/api-phase1-routes.md](docs/api-phase1-routes.md) for complete API documentation.

## 📝 Logging & Monitoring

Finance Manager includes a comprehensive logging system using Winston:

**View Logs:**
```powershell
# View application logs (live)
.\view-logs.ps1 -Follow

# View errors only
.\view-logs.ps1 -LogType error

# Search logs
.\view-logs.ps1 -Search "userId"

# Or use VS Code tasks: Ctrl+Shift+P → "Tasks: Run Task" → "View Application Logs"
```

**Log Files:**
- `apps/api/logs/application-YYYY-MM-DD.log` - All logs (14 day retention)
- `apps/api/logs/error-YYYY-MM-DD.log` - Errors only (30 day retention)
- `apps/api/logs/http-YYYY-MM-DD.log` - HTTP requests (7 day retention)

See [docs/LOGGING.md](docs/LOGGING.md) for complete documentation.

## 🧪 Testing Strategy

- **Unit Tests**: Jest for individual functions and components
- **Integration Tests**: API endpoint testing with Supertest
- **Component Tests**: React Testing Library for UI components
- **End-to-End**: Playwright for complete user flow testing

## 🔄 CI/CD Pipeline

GitHub Actions runs automatically on every push and pull request:

**Automated Checks:**
- ✅ Backend tests (44 tests with PostgreSQL)
- ✅ Frontend tests (71 tests with jsdom)
- ✅ E2E tests (4 tests with Chromium)
- ✅ Linting (ESLint for API and Web)
- ✅ Type checking (TypeScript)
- ✅ Build verification

**View Pipeline:** [GitHub Actions](https://github.com/jaevans36/finance-manager/actions)

The CI pipeline ensures all tests pass before merging code, maintaining code quality and preventing regressions.

## 📖 Documentation

### Original Todo App
- **Feature Specification**: `specs/001-todo-app/spec.md`
- **Implementation Plan**: `specs/001-todo-app/plan.md`
- **Task Breakdown**: `specs/001-todo-app/tasks.md`
- **Data Model**: `specs/001-todo-app/data-model.md`
- **API Contracts**: `specs/001-todo-app/contracts/api-spec.yaml`
- **Quick Start Guide**: `specs/001-todo-app/quickstart.md`

### v2.0 Enhancements ✨
- **v2.0 Specification**: `specs/001-todo-app/spec-v2-enhancements.md`
- **Phase 1 API Routes**: `docs/api-phase1-routes.md`
- **Phase 1 Completion Summary**: `docs/phase1-complete.md`
- **Phase 1 Testing Guide**: `docs/phase1-testing-guide.md`
- **Session Management**: `docs/phase1-session-management.md`
- **Implementation Progress**: `docs/v2-implementation-summary.md`

## 🎯 Implementation Strategy

This project follows a specification-driven development approach using the Speckit workflow:

1. **MVP First** (Recommended): Complete Phases 1-4 for basic authentication + task management
2. **Incremental Delivery**: Add one user story at a time, test independently, then deploy
3. **Parallel Team**: After Foundation phase, split user stories across developers

Each phase builds on the previous, ensuring a working application at every checkpoint.

## 📄 License

Private project - All rights reserved

## 👥 Contributors

- Development Team

---

**Last Updated**: November 19, 2025  
**Branch**: `001-todo-app`  
**Phase**: Todo App v2.0 - Phase 1 Backend Complete ✅  
**Commits**: 5 (latest: 5595ad0)

# Finance Manager - To Do App

Personal finance manager with To Do app foundation, built with a modern full-stack TypeScript architecture.

## 🏗️ Project Status

**Current Phase**: Foundational Infrastructure Complete (Phase 2) ✅
**Next Phase**: User Authentication Implementation (Phase 3)

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

### 📋 Next Steps

See `specs/001-todo-app/tasks.md` for the full 130-task implementation plan.

**Immediate Next Steps (Phase 3 - User Authentication)**:
- T033-T041: Build authentication API endpoints (register, login, logout, refresh)
- T042-T050: Create authentication UI (register/login forms)
- T051-T053: Write authentication tests

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

```powershell
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

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

## 📝 API Endpoints (Planned)

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Tasks
- `GET /api/v1/tasks` - List user's tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task by ID
- `PUT /api/v1/tasks/:id` - Update task
- `PATCH /api/v1/tasks/:id/complete` - Toggle completion
- `DELETE /api/v1/tasks/:id` - Delete task

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
- **End-to-End**: Manual testing with quickstart.md scenarios

## 📖 Documentation

- **Feature Specification**: `specs/001-todo-app/spec.md`
- **Implementation Plan**: `specs/001-todo-app/plan.md`
- **Task Breakdown**: `specs/001-todo-app/tasks.md`
- **Data Model**: `specs/001-todo-app/data-model.md`
- **API Contracts**: `specs/001-todo-app/contracts/api-spec.yaml`
- **Quick Start Guide**: `specs/001-todo-app/quickstart.md`

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

**Last Updated**: November 14, 2025
**Branch**: `001-todo-app`
**Phase**: 2 of 8 Complete

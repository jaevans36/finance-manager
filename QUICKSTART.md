# Quick Start Guide — Life Manager

## Prerequisites

- .NET 8 SDK (`dotnet --version` → `8.x`)
- Node.js 20+ and pnpm 8+ (`node --version`, `pnpm --version`)
- Docker Desktop (running)
- `dotnet-ef` global tool: `dotnet tool install --global dotnet-ef`

---

## First-Time Setup

```powershell
# From the repo root — starts Docker, DB, both APIs, and the web app:
.\scripts\start-dev.ps1
```

The script will:
1. Check Docker is running (starts Docker Desktop if needed)
2. Build and start postgres, life-api, finance-api and web as containers
   (`docker-compose.yml` + `docker-compose.dev.yml`)

Everything runs in Docker — no native `dotnet`/`node` processes on the host, and
`docker compose down` (via `pnpm stop`) cleanly tears down only this project's
containers. Both APIs apply pending migrations automatically on startup, and
each container live-reloads on source changes (`dotnet watch` / Vite's dev
server) via a bind mount — no rebuild needed for a source edit, only for a new
NuGet/npm package (`pnpm start` always rebuilds, so a plain re-run covers it).

---

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Life API | http://localhost:5000 | Core API — auth, todos, fitness |
| Finance API | http://localhost:5002 | Finance microservice — accounts, transactions |
| Web app | http://localhost:5173 | React/Vite frontend |
| PostgreSQL | localhost:5432 | Database (Docker) |

### Swagger / API Docs

| API | Swagger UI |
|-----|-----------|
| Life API | http://localhost:5000/swagger |
| Finance API | http://localhost:5002/swagger |

---

## Daily Workflow

```powershell
# Full startup (DB + all servers):
.\scripts\start-dev.ps1

# Quick restart (servers only, DB already running):
.\scripts\restart-dev.ps1

# Stop everything:
.\scripts\stop-dev.ps1
```

All servers have hot-reload — changes reflect automatically without restarting.

---

## VS Code Tasks

Press `Ctrl+Shift+P` → **Tasks: Run Task**:

| Task | Action |
|------|--------|
| Start Development Environment | Full startup |
| Restart Development Servers | Quick restart |
| Stop Development Environment | Stop all services |
| Run Database Migrations | Apply pending EF Core migrations |
| View Application Logs | Tail the log files |

---

## Manual Setup (without the script)

```powershell
# Everything (DB + all three apps, live-reloading):
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Just the database, if you want to run an app natively instead:
docker compose up -d postgres
cd apps/life-api    ; dotnet watch run --launch-profile http
cd apps/finance-api ; dotnet watch run --launch-profile http
cd apps/web         ; pnpm dev
```

---

## Database

### Migrations

Both APIs auto-migrate on startup. To run manually:

```powershell
# Life API
cd apps/life-api
dotnet ef database update

# Finance API
cd apps/finance-api
dotnet ef database update
```

### Reset (destroys all data)

```powershell
.\scripts\reset-db.ps1
```

### Shell access

```powershell
docker exec -it life-manager-db psql -U postgres -d life_manager_dev
```

---

## Environment Variables

The APIs use `appsettings.Development.json` for local dev — no `.env` file needed.

Key values (already set in config files):

| Variable | Default | Used by |
|----------|---------|---------|
| DB connection | `Host=localhost;Port=5432;Database=life_manager_dev` | Both APIs |
| JWT Secret | `your-secret-key-change-in-production` | Both APIs (must match) |
| `VITE_FINANCE_API_URL` | `http://localhost:5002` | Web app |

---

## Troubleshooting

### "Can't reach database server"
PostgreSQL container not running:
```powershell
.\scripts\restart-dev.ps1
```

### "Docker daemon is not running"
1. Open Docker Desktop and wait for it to fully start (~30 s)
2. Run `.\scripts\start-dev.ps1` again

### "Port 5000 / 5002 / 5173 is already in use"
Almost always a previous dev stack that wasn't stopped cleanly (or a different
project using the same port):
```powershell
.\scripts\stop-dev.ps1
# still stuck? see what's actually holding the port:
Get-NetTCPConnection -LocalPort 5002 | Select-Object OwningProcess
```

### Migrations not found
```powershell
# Install the EF Core CLI tool if not already installed:
dotnet tool install --global dotnet-ef

# Apply migrations manually:
cd apps/finance-api
dotnet ef database update
```

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/life-api/README.md` | Life API developer docs |
| `apps/finance-api/README.md` | Finance API developer docs |
| `docs/guides/FINANCE_MANAGER.md` | Finance Manager user guide |
| `docs/CURRENT_STATE.md` | What's in progress |
| `CLAUDE.md` | AI agent context |
- `GET /api/v1/tasks/overdue` - Get overdue tasks

## Project Structure
```
Life Manager/
├── apps/
│   ├── api/              # Backend Express API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   └── server.ts
│   │   ├── prisma/       # Database schema
│   │   └── .env          # Environment config
│   │
│   └── web/              # Frontend React app
│       └── src/
│           ├── components/ # React components
│           ├── pages/      # Page components
│           └── services/   # API clients
│
├── docker-compose.yml    # PostgreSQL container
├── start-dev.ps1         # Full startup script
├── restart-dev.ps1       # Quick restart
└── stop-dev.ps1          # Stop all services
```

## Common Commands Reference

```powershell
# Install dependencies
pnpm install

# Run tests
pnpm test

# Check TypeScript errors
pnpm typecheck

# Lint code
pnpm lint

# Build for production
pnpm build

# Run production build
pnpm start
```

## Next Steps

1. ✅ Start development environment: `.\start-dev.ps1`
2. ✅ Open web app: http://localhost:5173
3. ✅ Register a new account
4. ✅ Create your first task!

---

**Need Help?** Check the main README.md or API documentation in `specs/001-todo-app/`

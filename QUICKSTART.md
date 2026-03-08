# 🚀 Quick Start Guide - Life Manager

## Prerequisites Checklist
- ✅ Node.js 20.x or higher
- ✅ pnpm 8.x or higher  
- ✅ Docker Desktop installed and running

## First Time Setup

### Option 1: Automated Setup (Recommended)
Run the startup script which handles everything:

```powershell
.\start-dev.ps1
```

This script will:
1. ✅ Check if Docker is running (starts it if needed)
2. ✅ Start PostgreSQL database container
3. ✅ Wait for database to be healthy
4. ✅ Run database migrations
5. ✅ Generate Prisma Client
6. ✅ Start both API and Web servers

### Option 2: Manual Setup
If you prefer to run commands individually:

```powershell
# 1. Start Docker Desktop (if not running)
# Open Docker Desktop application manually

# 2. Start PostgreSQL database
docker-compose up -d

# 3. Run database migrations (C# .NET API)
cd apps/finance-api
dotnet ef database update

# 4. Start development servers
cd ../..
.\scripts\start-dev.ps1
```

## Daily Development Workflow

### Starting Work
```powershell
# If database stopped, use full startup
.\start-dev.ps1

# If database still running, quick restart servers only
.\restart-dev.ps1
```

### While Developing
- **API Server**: http://localhost:3000
- **Web App**: http://localhost:5173
- **Database**: localhost:5432

Both servers have hot-reload enabled - your changes will automatically refresh.

### Stopping Work
```powershell
# Stop all services (database + servers)
.\stop-dev.ps1
```

## VS Code Tasks

You can also use built-in VS Code tasks:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Choose from:
   - **Start Development Environment** - Full startup
   - **Restart Development Servers** - Quick restart
   - **Stop Development Environment** - Stop all
   - **Open Prisma Studio** - Database GUI
   - **Run Database Migrations** - Apply schema changes

## Troubleshooting

### "Can't reach database server"
**Problem**: PostgreSQL container not running  
**Solution**: 
```powershell
docker-compose up -d
# Wait 10 seconds, then restart servers
.\restart-dev.ps1
```

### "Docker daemon is not running"  
**Problem**: Docker Desktop not started  
**Solution**: 
1. Open Docker Desktop application
2. Wait for it to fully start (30-60 seconds)
3. Run `.\start-dev.ps1` again

### "Port 3000 is already in use"
**Problem**: Another process using the port  
**Solution**:
```powershell
# Find and kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or change the port in apps/api/.env
PORT=3001
```

### "Prisma Client not generated"
**Problem**: Prisma Client needs to be regenerated  
**Solution**:
```powershell
cd apps/api
pnpm db:generate
```

## Database Management

### View/Edit Data
```powershell
cd apps/api
pnpm db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Create New Migration
```powershell
cd apps/api
# 1. Edit prisma/schema.prisma
# 2. Run migration
pnpm db:migrate
```

### Reset Database (⚠️ Destroys all data)
```powershell
cd apps/api
pnpm prisma migrate reset
```

### Database Shell Access
```powershell
docker exec -it life-manager-db psql -U postgres -d finance_manager_dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Tasks
- `GET /api/v1/tasks` - List user's tasks (with pagination)
- `GET /api/v1/tasks/:id` - Get single task
- `POST /api/v1/tasks` - Create new task
- `PUT /api/v1/tasks/:id` - Update task
- `PATCH /api/v1/tasks/:id/complete` - Toggle completion
- `DELETE /api/v1/tasks/:id` - Delete task
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

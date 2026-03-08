# Production Setup Guide — Life Manager (Self-Hosted LAN)

> This guide walks through deploying Life Manager on a self-hosted machine on your local network.
> For detailed reverse-proxy / Caddy configuration, see [LAN_DEPLOYMENT.md](LAN_DEPLOYMENT.md).

---

## Prerequisites

| Tool | Required version | Check |
| ---- | --------------- | ----- |
| .NET SDK | 8.0+ | `dotnet --version` |
| Node.js | 18+ | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Docker Desktop | Latest | `docker --version` |
| PostgreSQL client | 15 (optional — for backup scripts) | `pg_dump --version` |

---

## Step 1 — Clone and Install

```powershell
git clone https://github.com/jaevans36/finance-manager "Life Manager"
cd "Life Manager"
pnpm install
```

---

## Step 2 — Configure the Backend

**2a. Copy the settings template:**
```powershell
Copy-Item apps\finance-api\appsettings.Production.example.json apps\finance-api\appsettings.Production.json
```

**2b. Edit `apps/finance-api/appsettings.Production.json`:**

| Setting | What to change |
| ------- | -------------- |
| `ConnectionStrings.DefaultConnection` | Point to your PostgreSQL instance |
| `Jwt.Secret` | Replace with a random 64+ character string |

Generate a secure JWT secret:
```powershell
# PowerShell — generates a 64-byte random base64 string
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**2c. Never commit `appsettings.Production.json`** — it contains secrets. It is listed in `.gitignore`.

---

## Step 3 — Start the Database

```powershell
docker-compose up -d
```

This starts PostgreSQL on port 5432 using the configuration in `docker-compose.yml`.

---

## Step 4 — Apply Database Migrations

```powershell
cd apps\finance-api
dotnet ef database update
cd ..\..
```

---

## Step 5 — Build the Frontend

**5a. Create the frontend environment file:**
```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
```

Edit `apps/web/.env.local` and set `VITE_API_URL` to the address of your backend server:
```
VITE_API_URL=http://your-server-hostname:5000
```

**5b. Build:**
```powershell
cd apps\web
pnpm build
cd ..\..
```

Output will be in `apps/web/dist/`.

---

## Step 6 — Start the Backend API

```powershell
cd apps\finance-api
dotnet run --environment Production
```

Or use the development script for a quick start (runs migrations automatically):
```powershell
.\start-dev.ps1
```

---

## Step 7 — Serve the Frontend

The built frontend in `apps/web/dist/` can be served by:
- **Caddy** (recommended) — see [LAN_DEPLOYMENT.md](LAN_DEPLOYMENT.md) for full config
- **IIS** — copy `dist/` to an IIS site root; add `web.config` for SPA routing
- **nginx** — point root at `dist/`, add `try_files $uri /index.html`

Quick test with `serve`:
```powershell
npx serve apps\web\dist -p 4173
```

---

## Step 8 — Verify

| Check | URL |
| ----- | --- |
| API health | `http://localhost:5000/api/health` |
| API docs (dev only) | `http://localhost:5000/swagger` |
| Frontend | `http://localhost:5173` (dev) or your served URL |

The health endpoint returns:
```json
{ "status": "healthy", "version": "0.15.0", "timestamp": "..." }
```

---

## Step 9 — Set Up Automated Backups

Run backups manually any time:
```powershell
.\scripts\backup-db.ps1
```

To run nightly backups automatically, add a Windows Scheduled Task:
```powershell
$action = New-ScheduledTaskAction -Execute "powershell" -Argument "-NonInteractive -File `"C:\Life Manager\scripts\backup-db.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
Register-ScheduledTask -TaskName "LifeManager-DailyBackup" -Action $action -Trigger $trigger -RunLevel Highest
```

Backups are saved to `scripts/../backups/` by default. Retain at least 7 days of backups.

---

## Step 10 — Firewall (LAN only)

Allow the API and frontend ports through Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "Life Manager API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "Life Manager Web" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

---

## Updating to a New Version

```powershell
git pull
pnpm install
cd apps\finance-api
dotnet ef database update
cd ..\..
cd apps\web
pnpm build
cd ..\..
# Restart API
```

---

## Restoring from Backup

```powershell
.\scripts\restore-db.ps1 -BackupFile ".\backups\life-manager-2026-03-08_02-00-00.sql"
```

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| API won't start | Check `apps/finance-api/appsettings.Production.json` exists and `Jwt.Secret` is set |
| Database connection failed | Ensure `docker-compose up -d` is running; check connection string |
| Frontend shows blank page | Ensure `VITE_API_URL` in `.env.local` points to the correct API host |
| 401 Unauthorized everywhere | JWT secret mismatch between `.env.local` (not applicable) and `appsettings.Production.json` |
| pg_dump not found | Install [PostgreSQL client tools](https://www.postgresql.org/download/windows/) and add to PATH |

For more detail, see [LAN_DEPLOYMENT.md](LAN_DEPLOYMENT.md).

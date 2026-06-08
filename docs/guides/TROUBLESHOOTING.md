# Troubleshooting — Local Dev Environment

Quick fixes for the most common problems. All commands run from the project root.

---

## Site can't be reached (localhost:5173)

The dev servers aren't running. Start them:

```powershell
.\scripts\start-dev.ps1
```

Leave that terminal open — it keeps everything alive.

---

## APIs won't connect to the database

**Symptom:** `password authentication failed` or `connection refused` in the start-dev.ps1 output.

**Fix:** Use the safe reset script — it backs up your data first, then resets the broken volume:

```powershell
.\scripts\safe-db-reset.ps1
```

After it completes, restore your data if you had any:

```powershell
.\scripts\restore-db.ps1 -Latest
.\scripts\start-dev.ps1
```

> **Never run `docker-compose down -v` directly** — it deletes the Docker volume and destroys all data with no warning. Use `safe-db-reset.ps1` instead: it makes a backup first.

**Why this happens:** PostgreSQL 15 defaults to SCRAM-SHA-256 auth on a fresh volume. The `docker-compose.yml` is configured with `POSTGRES_HOST_AUTH_METHOD: md5` to prevent this, but if the compose file was changed or the volume predates the setting, a reset is needed.

---

## Lost data after a reset

If data was lost because `docker-compose down -v` was run without a prior backup, check for any existing backups first:

```powershell
Get-ChildItem "$env:USERPROFILE\life-manager-backups" -Filter "*.zip" | Sort-Object LastWriteTime -Descending
```

If a backup exists:

```powershell
.\scripts\restore-db.ps1 -Latest
.\scripts\start-dev.ps1
```

If no backups exist, register a new account. Set up the daily backup schedule now so this won't happen again:

```powershell
.\scripts\setup-backup-schedule.ps1
```

See [BACKUP-RESTORE.md](BACKUP-RESTORE.md) for the full backup and restore guide.

---

## Forgot password

With Docker running and the app started:

```powershell
.\scripts\reset-user-password.ps1 -Email "you@example.com" -NewPassword "NewPass1!"
```

Password must be 8+ characters with at least one uppercase letter and one digit.

---

## Port 5432 already in use

Something else (another Docker container, a previous run) is holding port 5432.

```powershell
# Find what's using it
netstat -ano | findstr ":5432" | findstr "LISTENING"

# Stop and restart cleanly (without deleting the volume)
docker-compose down
docker-compose up -d
```

---

## Finance API keeps restarting

The finance-api container depends on postgres being healthy. If postgres hasn't finished initialising yet it will restart a few times — this is normal. Watch the logs:

```powershell
docker logs finance-api --follow
```

It should stabilise within 30 seconds of postgres becoming healthy.

---

## Key facts about this dev setup

| Thing | Detail |
| ----- | ------ |
| Database | Docker container `life-manager-db` (PostgreSQL 15) |
| DB credentials | `postgres` / `password` |
| Data lives in | Docker named volume `postgres_data` |
| Backups stored in | `%USERPROFILE%\life-manager-backups\` (outside Docker) |
| `down -v` destroys | All local user data — use `safe-db-reset.ps1` instead |
| Life API | Runs on host via `dotnet run`, port 5000 |
| Finance API | Runs in Docker, port 5002 |
| Frontend | Runs on host via `pnpm dev`, port 5173 |

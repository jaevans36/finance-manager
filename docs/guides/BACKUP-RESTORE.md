# Database Backup & Restore

This guide covers how backups work, how to set up the daily schedule, and how to restore in every recovery scenario.

---

## How it works

The backup system uses `pg_dump` inside the running Docker container — no local PostgreSQL installation needed. Each backup is:

- A full SQL dump of the `life_manager_dev` database (all schemas: tasks, finance, etc.)
- Compressed to a `.zip` file
- Stored in `%USERPROFILE%\life-manager-backups\` (your Windows user folder, not the project directory)
- Named by timestamp: `life-manager-2026-06-08-0200.zip`
- Automatically pruned after 7 days (configurable)

The backup folder is inside your Windows user profile, so it is:
- Protected by Windows NTFS permissions — only your account and local admins can read it
- Separate from the Docker volume, so `docker-compose down -v` cannot touch it
- Persistent across Docker restarts, project moves, and reinstalls

> **External backups:** If you copy backups to USB or cloud storage, use BitLocker for the drive or 7-Zip (AES-256) to encrypt the `.zip` files before moving them.

---

## Quick reference

| Task | Command |
|------|---------|
| Run a backup now | `.\scripts\backup-db.ps1` |
| Schedule daily backups | `.\scripts\setup-backup-schedule.ps1` |
| Restore most recent backup | `.\scripts\restore-db.ps1 -Latest` |
| Restore and choose which backup | `.\scripts\restore-db.ps1` |
| Reset database safely (backup first) | `.\scripts\safe-db-reset.ps1` |
| View backup log | `Get-Content "$env:USERPROFILE\life-manager-backups\backup.log"` |
| Change retention period | `.\scripts\backup-db.ps1 -RetainDays 14` |

---

## Setup — schedule daily backups

Run once to register a Windows Scheduled Task that backs up at 2 AM every day:

```powershell
.\scripts\setup-backup-schedule.ps1
```

Or choose a different time (e.g. midnight):

```powershell
.\scripts\setup-backup-schedule.ps1 -Time 23:00
```

The task uses `StartWhenAvailable`, so if your PC is off at 2 AM it will run at the next opportunity after it wakes up.

**Verify the schedule is working:** check the log file the morning after setup:

```powershell
Get-Content "$env:USERPROFILE\life-manager-backups\backup.log"
```

A healthy log looks like:

```
2026-06-08 02:00:14  OK   life-manager-2026-06-08-0200.zip  48 KB
2026-06-09 02:00:11  OK   life-manager-2026-06-09-0200.zip  49 KB
```

To remove the schedule:

```powershell
.\scripts\setup-backup-schedule.ps1 -Remove
```

---

## Scenario 1 — Restore from an accidental data wipe

If you ran `docker-compose down -v` and lost your data:

```powershell
# 1. Start a fresh empty database
docker-compose up -d

# 2. Restore the most recent backup
.\scripts\restore-db.ps1 -Latest

# 3. Start the app
.\scripts\start-dev.ps1
```

Your account and all data will be back. No need to re-register.

---

## Scenario 2 — Database connection is broken and needs a reset

Use `safe-db-reset.ps1` instead of `docker-compose down -v`. It backs up first:

```powershell
.\scripts\safe-db-reset.ps1
```

This script:
1. Backs up the current database (you keep the data)
2. Runs `docker-compose down -v` (resets the broken volume)
3. Runs `docker-compose up -d` (starts a fresh container)

After it completes, restore if needed:

```powershell
.\scripts\restore-db.ps1 -Latest
.\scripts\start-dev.ps1
```

---

## Scenario 3 — Restore to a specific point in time

```powershell
.\scripts\restore-db.ps1
```

This lists available backups and lets you choose:

```
Available backups:
  [0] life-manager-2026-06-09-0200.zip  49 KB  2026-06-09 02:00
  [1] life-manager-2026-06-08-0200.zip  48 KB  2026-06-08 02:00
  [2] life-manager-2026-06-07-0200.zip  47 KB  2026-06-07 02:00

Enter backup number to restore (or press Enter to cancel): 1
```

---

## Scenario 4 — Restore on a new machine

Copy `%USERPROFILE%\life-manager-backups\` from the old machine to the same path on the new one, then follow Scenario 1.

---

## Backup retention

By default, 7 days of backups are kept. The oldest are pruned automatically each time `backup-db.ps1` runs.

| Backups kept | Command |
|---|---|
| 7 days (default) | `.\scripts\backup-db.ps1` |
| 14 days | `.\scripts\backup-db.ps1 -RetainDays 14` |
| Custom location | `.\scripts\backup-db.ps1 -BackupDir "D:\my-backups"` |

To permanently change the default, edit the `param(...)` block at the top of `scripts/backup-db.ps1`.

---

## What the backup contains

The backup is a full `pg_dump` of the `life_manager_dev` database with `--clean --if-exists`:

- All schemas: `public` (tasks, events, users) and `finance` (accounts, transactions, budgets, bills, goals, category rules)
- All user data, categories, and settings
- The dump includes `DROP IF EXISTS` statements before each `CREATE`, so it can be restored safely onto both an empty database and an existing one

What it does **not** contain:
- Application code (in Git)
- Environment variables / secrets (not needed for restore)
- The Docker image itself (pulled from Docker Hub)

---

## Troubleshooting backups

**"life-manager-db is not running"**
Start Docker Desktop and run `docker-compose up -d`, then retry the backup.

**"pg_dump returned no output"**
The container may be starting up. Wait 30 seconds and retry. Check container health: `docker ps`.

**Backup file is very small (< 5 KB)**
The database may be empty (e.g. fresh install). This is normal — a backup of an empty database is a few KB.

**Scheduled task is not running**
Check the Windows Task Scheduler: `taskschd.msc` → Task Scheduler Library → search for `LifeManagerDailyBackup`. Look at the Last Run Result column. Code `0x0` = success; any other code = failure. Check the log file for details.

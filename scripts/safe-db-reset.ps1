# Safe alternative to `docker-compose down -v`.
# Backs up the database first, then resets the Docker volume.
# Use this instead of raw `docker-compose down -v` to avoid data loss.
#
# Usage: .\scripts\safe-db-reset.ps1

$ErrorActionPreference = 'Stop'

Write-Host "Life Manager — Safe Database Reset" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Back up the current database to $env:USERPROFILE\life-manager-backups\"
Write-Host "  2. Stop Docker containers and DELETE the postgres volume"
Write-Host "  3. Restart a fresh empty database"
Write-Host ""
Write-Host "Your data will be preserved in the backup." -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Type 'yes' to proceed"
if ($confirm -ne "yes") {
    Write-Host "Reset cancelled." -ForegroundColor Yellow
    exit 0
}

# ── Step 1: Back up ───────────────────────────────────────────────────────────
$backupScript = Join-Path $PSScriptRoot "backup-db.ps1"

$running = docker ps --filter "name=life-manager-db" --filter "status=running" --format "{{.Names}}" 2>$null
if ($running -eq "life-manager-db") {
    Write-Host ""
    Write-Host "Step 1/3 — Backing up database..." -ForegroundColor Yellow
    & $backupScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[X] Backup failed — reset aborted to protect your data." -ForegroundColor Red
        Write-Host "    Fix the backup issue before retrying." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "Step 1/3 — Database not running, skipping backup (no data to lose)." -ForegroundColor Gray
}

# ── Step 2: Stop + delete volume ─────────────────────────────────────────────
Write-Host ""
Write-Host "Step 2/3 — Stopping containers and removing volume..." -ForegroundColor Yellow

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

docker-compose down -v 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# ── Step 3: Start fresh ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "Step 3/3 — Starting fresh database..." -ForegroundColor Yellow

docker-compose up -d 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "[OK] Database reset complete." -ForegroundColor Green
Write-Host ""
Write-Host "Your backup is at: $env:USERPROFILE\life-manager-backups\" -ForegroundColor Cyan
Write-Host "To restore it:     .\scripts\restore-db.ps1 -Latest" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: .\scripts\start-dev.ps1  (then register a new account, or restore from backup)" -ForegroundColor Yellow

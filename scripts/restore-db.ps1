# Restores the Life Manager database from a backup produced by backup-db.ps1.
# Uses docker cp + psql inside the container — no local PostgreSQL tools needed.
#
# Usage:
#   .\scripts\restore-db.ps1 -Latest                          # restore most recent backup
#   .\scripts\restore-db.ps1 -BackupFile "path\to\file.zip"  # restore a specific backup
#   .\scripts\restore-db.ps1                                  # list backups and choose

param(
    [string]$BackupFile = "",
    [switch]$Latest,
    [string]$BackupDir = "$env:USERPROFILE\life-manager-backups"
)

$ErrorActionPreference = 'Stop'

# ── List available backups ────────────────────────────────────────────────────
function Get-Backups {
    if (-not (Test-Path $BackupDir)) { return @() }
    return @(Get-ChildItem $BackupDir -Filter "life-manager-*.zip" | Sort-Object LastWriteTime -Descending)
}

# ── Resolve which backup to use ───────────────────────────────────────────────
$backups = Get-Backups

if ($backups.Count -eq 0) {
    Write-Host "[X] No backups found in $BackupDir" -ForegroundColor Red
    Write-Host "    Run .\scripts\backup-db.ps1 first." -ForegroundColor Yellow
    exit 1
}

if ($Latest) {
    $chosen = $backups[0].FullName
}
elseif ($BackupFile -ne "") {
    $chosen = $BackupFile
    if (-not (Test-Path $chosen)) {
        Write-Host "[X] Backup file not found: $chosen" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Available backups:" -ForegroundColor Cyan
    for ($i = 0; $i -lt [Math]::Min($backups.Count, 10); $i++) {
        $b = $backups[$i]
        $kb = [math]::Round($b.Length / 1KB, 1)
        Write-Host "  [$i] $($b.Name)  $kb KB  $($b.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
    }
    Write-Host ""
    $idx = Read-Host "Enter backup number to restore (or press Enter to cancel)"
    if ($idx -eq "") {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
    if ($idx -notmatch '^\d+$' -or [int]$idx -ge $backups.Count) {
        Write-Host "[X] Invalid selection." -ForegroundColor Red
        exit 1
    }
    $chosen = $backups[[int]$idx].FullName
}

Write-Host ""
Write-Host "Restore file : $([System.IO.Path]::GetFileName($chosen))" -ForegroundColor Yellow
Write-Host "Target DB    : life_manager_dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This overwrites all existing data in life_manager_dev." -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Type 'yes' to confirm"
if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

# ── Container check ───────────────────────────────────────────────────────────
$running = docker ps --filter "name=life-manager-db" --filter "status=running" --format "{{.Names}}" 2>$null
if ($running -ne "life-manager-db") {
    Write-Host "[X] life-manager-db is not running. Start it with: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# ── Extract zip ───────────────────────────────────────────────────────────────
$tempDir = Join-Path $env:TEMP "lm-restore-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir | Out-Null
Expand-Archive -Path $chosen -DestinationPath $tempDir -Force

$sqlFile = Get-ChildItem $tempDir -Filter "*.sql" | Select-Object -First 1
if ($null -eq $sqlFile) {
    Write-Host "[X] No .sql file found inside the zip." -ForegroundColor Red
    Remove-Item $tempDir -Recurse -Force
    exit 1
}

# ── Copy SQL into container ───────────────────────────────────────────────────
Write-Host "Copying backup into container..." -ForegroundColor Yellow
docker cp $sqlFile.FullName "life-manager-db:/tmp/lm-restore.sql" 2>&1 | Out-Null

# ── Terminate existing connections ────────────────────────────────────────────
$terminateSql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'life_manager_dev' AND pid <> pg_backend_pid();"
docker exec -e PGPASSWORD=password life-manager-db psql -U postgres -d postgres -c $terminateSql 2>&1 | Out-Null

# ── Restore ───────────────────────────────────────────────────────────────────
Write-Host "Restoring..." -ForegroundColor Yellow
docker exec -e PGPASSWORD=password life-manager-db `
    psql -U postgres -d life_manager_dev -f /tmp/lm-restore.sql -v ON_ERROR_STOP=0 2>&1 |
    Where-Object { $_ -match "^(ERROR|FATAL)" } |
    ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }

$restoreExit = $LASTEXITCODE

# ── Clean up ──────────────────────────────────────────────────────────────────
docker exec life-manager-db rm /tmp/lm-restore.sql 2>&1 | Out-Null
Remove-Item $tempDir -Recurse -Force

# ── Result ────────────────────────────────────────────────────────────────────
if ($restoreExit -eq 0) {
    Write-Host ""
    Write-Host "[OK] Restore complete from: $([System.IO.Path]::GetFileName($chosen))" -ForegroundColor Green
    Write-Host ""
    Write-Host "Restart the app to pick up the restored data:" -ForegroundColor Cyan
    Write-Host "  .\scripts\restart-dev.ps1" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[!] Restore finished with warnings (exit $restoreExit)." -ForegroundColor Yellow
    Write-Host "    Review any ERROR lines above. The database may be partially restored." -ForegroundColor Yellow
    Write-Host "    Restart the app and check whether your data is present." -ForegroundColor Yellow
}

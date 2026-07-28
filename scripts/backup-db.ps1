# Backs up the Life Manager PostgreSQL database using pg_dump inside Docker.
# Saves a compressed (.zip) backup to %USERPROFILE%\life-manager-backups\ and
# prunes backups older than RetainDays.
#
# Usage:
#   .\scripts\backup-db.ps1
#   .\scripts\backup-db.ps1 -RetainDays 14
#   .\scripts\backup-db.ps1 -BackupDir "D:\my-backups"

param(
    [string]$BackupDir = "$env:USERPROFILE\life-manager-backups",
    [int]$RetainDays   = 7
)

$ErrorActionPreference = 'Stop'

# ── Container check ───────────────────────────────────────────────────────────
$running = docker ps --filter "name=life-manager-db" --filter "status=running" --format "{{.Names}}" 2>$null
if ($running -ne "life-manager-db") {
    Write-Host "[X] life-manager-db is not running. Start Docker then: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# ── Ensure backup directory ───────────────────────────────────────────────────
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Created backup directory: $BackupDir" -ForegroundColor Gray
}

# ── Generate filenames ────────────────────────────────────────────────────────
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$sqlFile   = Join-Path $BackupDir "life-manager-$timestamp.sql"
$zipFile   = Join-Path $BackupDir "life-manager-$timestamp.zip"
$logFile   = Join-Path $BackupDir "backup.log"

# ── pg_dump via docker exec ───────────────────────────────────────────────────
Write-Host "Backing up life_manager_dev..." -ForegroundColor Yellow

$dumpLines = docker exec `
    -e PGPASSWORD=password `
    life-manager-db `
    pg_dump -U postgres -d life_manager_dev --clean --if-exists --encoding=UTF8

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] pg_dump failed (exit $LASTEXITCODE). Is the container healthy?" -ForegroundColor Red
    exit 1
}

if ($null -eq $dumpLines -or $dumpLines.Count -eq 0) {
    Write-Host "[X] pg_dump returned no output — backup aborted." -ForegroundColor Red
    exit 1
}

# Write SQL file (UTF-8, no BOM)
[System.IO.File]::WriteAllLines($sqlFile, $dumpLines, [System.Text.UTF8Encoding]::new($false))

$rawKB = [math]::Round((Get-Item $sqlFile).Length / 1KB, 1)

# ── Compress ──────────────────────────────────────────────────────────────────
Compress-Archive -Path $sqlFile -DestinationPath $zipFile -CompressionLevel Optimal -Force
Remove-Item $sqlFile

$zipKB = [math]::Round((Get-Item $zipFile).Length / 1KB, 1)
Write-Host "[OK] $([System.IO.Path]::GetFileName($zipFile))  ($zipKB KB, was $rawKB KB uncompressed)" -ForegroundColor Green

# ── Prune old backups ─────────────────────────────────────────────────────────
$cutoff = (Get-Date).AddDays(-$RetainDays)
$old = Get-ChildItem $BackupDir -Filter "life-manager-*.zip" | Where-Object { $_.LastWriteTime -lt $cutoff }
if ($old.Count -gt 0) {
    $old | Remove-Item
    Write-Host "Pruned $($old.Count) backup(s) older than $RetainDays days." -ForegroundColor Gray
}

# ── List kept backups ─────────────────────────────────────────────────────────
$kept = Get-ChildItem $BackupDir -Filter "life-manager-*.zip" | Sort-Object LastWriteTime
Write-Host ""
Write-Host "Stored backups ($($kept.Count) of $RetainDays max):" -ForegroundColor Cyan
$kept | ForEach-Object {
    $kb = [math]::Round($_.Length / 1KB, 1)
    Write-Host "  $($_.Name)  $kb KB  $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
}
Write-Host ""
Write-Host "To restore: .\scripts\restore-db.ps1 -Latest" -ForegroundColor DarkGray

# ── Append to log ─────────────────────────────────────────────────────────────
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  OK   $([System.IO.Path]::GetFileName($zipFile))  $zipKB KB"
Add-Content $logFile $logEntry

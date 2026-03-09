# Backup UAT Database
# Creates a full SQL dump of the UAT database for disaster recovery
#
# Usage:
#   .\scripts\backup-uat-db.ps1
#
# Backups are stored in: backups/uat/ with date-stamped filenames
# Retention: 7 days (older backups are automatically deleted)
#
# See: docs/guides/ENVIRONMENTS_AND_RELEASES.md

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Projects\Finance Manager"
$BackupDir = "$ProjectRoot\backups\uat"
$RetentionDays = 7
$LogFile = "$ProjectRoot\logs\db-backup.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry -ForegroundColor $(switch ($Level) {
        "INFO"    { "White" }
        "OK"      { "Green" }
        "WARN"    { "Yellow" }
        "ERROR"   { "Red" }
        default   { "White" }
    })
    $logDir = Split-Path $LogFile
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $logEntry
}

Write-Host ""
Write-Host "UAT Database Backup" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

Write-Log "Starting UAT database backup"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Log "Created backup directory: $BackupDir"
}

# Check Docker is running
$containerStatus = docker ps --filter "name=life-manager-db" --format "{{.Status}}" 2>&1
if (-not $containerStatus -or $containerStatus -notlike "*Up*") {
    Write-Log "Database container is not running" "ERROR"
    exit 1
}

# Check UAT database exists
$uatExists = docker exec life-manager-db psql -U postgres -lqt 2>&1 | Select-String "finance_manager_uat"
if (-not $uatExists) {
    Write-Log "UAT database (finance_manager_uat) does not exist" "ERROR"
    exit 1
}

# Create backup
$datestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = "uat_backup_$datestamp.sql"
$backupPath = "$BackupDir\$backupFile"
$containerDumpPath = "/tmp/$backupFile"

Write-Log "Dumping UAT database to $backupFile..."
docker exec life-manager-db pg_dump -U postgres -d finance_manager_uat -F p -f $containerDumpPath 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Database dump failed" "ERROR"
    exit 1
}

# Copy from container to host
docker cp "life-manager-db:$containerDumpPath" $backupPath 2>&1
docker exec life-manager-db rm -f $containerDumpPath 2>&1 | Out-Null

if (-not (Test-Path $backupPath)) {
    Write-Log "Backup file not found after copy" "ERROR"
    exit 1
}

$backupSize = (Get-Item $backupPath).Length / 1KB
Write-Log "Backup created: $backupFile ($([math]::Round($backupSize, 1)) KB)" "OK"

# Update 'latest' symlink (copy)
$latestPath = "$BackupDir\latest.sql"
Copy-Item $backupPath $latestPath -Force
Write-Log "Updated latest.sql" "OK"

# Clean up old backups
Write-Log "Cleaning up backups older than $RetentionDays days..."
$cutoff = (Get-Date).AddDays(-$RetentionDays)
$oldBackups = Get-ChildItem "$BackupDir\uat_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $cutoff }
if ($oldBackups) {
    $oldBackups | Remove-Item -Force
    Write-Log "Removed $($oldBackups.Count) old backup(s)" "OK"
} else {
    Write-Log "No old backups to remove" "INFO"
}

# List current backups
$backups = Get-ChildItem "$BackupDir\uat_backup_*.sql" | Sort-Object LastWriteTime -Descending
Write-Log "Current backups ($($backups.Count)):"
$backups | ForEach-Object {
    Write-Log "  $($_.Name) — $([math]::Round($_.Length / 1KB, 1)) KB — $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))"
}

Write-Log "UAT database backup complete"
Write-Host ""
Write-Host "[OK] Backup saved to: $backupPath" -ForegroundColor Green
Write-Host ""

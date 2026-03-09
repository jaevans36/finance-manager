# Sync Dev Database from UAT
# Copies the UAT database (finance_manager_uat) to Dev (finance_manager_dev)
# Run manually or via Windows Scheduled Task for nightly refresh
#
# Usage:
#   .\scripts\sync-db.ps1                    # Interactive (with confirmation)
#   .\scripts\sync-db.ps1 -SkipConfirmation  # Non-interactive (for scheduled tasks)
#
# See: docs/guides/ENVIRONMENTS_AND_RELEASES.md

param(
    [switch]$SkipConfirmation
)

$ErrorActionPreference = "Stop"
$LogFile = "C:\Projects\Finance Manager\logs\db-sync.log"

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
    # Ensure logs directory exists
    $logDir = Split-Path $LogFile
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $logEntry
}

Write-Host ""
Write-Host "Database Sync: UAT -> Dev" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Confirmation
if (-not $SkipConfirmation) {
    Write-Host "[WARNING] This will REPLACE the Dev database with a copy of UAT!" -ForegroundColor Red
    Write-Host "  Source:  finance_manager_uat" -ForegroundColor Yellow
    Write-Host "  Target:  finance_manager_dev (will be dropped and recreated)" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Type 'yes' to confirm"
    if ($confirmation -ne "yes") {
        Write-Host "Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
}

Write-Log "Starting UAT -> Dev database sync"

# Step 1: Check Docker is running
Write-Log "Checking Docker and database container..."
$containerStatus = docker ps --filter "name=life-manager-db" --format "{{.Status}}" 2>&1
if (-not $containerStatus -or $containerStatus -notlike "*Up*") {
    Write-Log "Database container is not running. Start it with .\scripts\start-dev.ps1" "ERROR"
    exit 1
}
Write-Log "Database container is running" "OK"

# Step 2: Check UAT database exists
Write-Log "Checking UAT database exists..."
$uatExists = docker exec life-manager-db psql -U postgres -lqt 2>&1 | Select-String "finance_manager_uat"
if (-not $uatExists) {
    Write-Log "UAT database (finance_manager_uat) does not exist. Create it first." "ERROR"
    Write-Log "Run: docker exec life-manager-db psql -U postgres -c 'CREATE DATABASE finance_manager_uat;'" "INFO"
    Write-Log "Then apply migrations with ASPNETCORE_ENVIRONMENT=Uat" "INFO"
    exit 1
}
Write-Log "UAT database found" "OK"

# Step 3: Dump UAT database
Write-Log "Dumping UAT database..."
$dumpFile = "/tmp/uat_dump.sql"
$dumpResult = docker exec life-manager-db pg_dump -U postgres -d finance_manager_uat -F c -f $dumpFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Failed to dump UAT database: $dumpResult" "ERROR"
    exit 1
}
Write-Log "UAT database dumped successfully" "OK"

# Step 4: Drop Dev database
Write-Log "Dropping Dev database..."
docker exec life-manager-db psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'finance_manager_dev' AND pid <> pg_backend_pid();" 2>&1 | Out-Null
docker exec life-manager-db psql -U postgres -c "DROP DATABASE IF EXISTS finance_manager_dev;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Failed to drop Dev database" "ERROR"
    exit 1
}
Write-Log "Dev database dropped" "OK"

# Step 5: Create Dev database and restore
Write-Log "Creating Dev database and restoring from UAT dump..."
docker exec life-manager-db psql -U postgres -c "CREATE DATABASE finance_manager_dev;" 2>&1
docker exec life-manager-db pg_restore -U postgres -d finance_manager_dev $dumpFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "pg_restore completed with warnings (this is often normal for custom format dumps)" "WARN"
}
Write-Log "Dev database restored from UAT" "OK"

# Step 6: Clean up dump file
docker exec life-manager-db rm -f $dumpFile 2>&1 | Out-Null

# Step 7: Verify
Write-Log "Verifying Dev database..."
$tableCount = docker exec life-manager-db psql -U postgres -d finance_manager_dev -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
$tableCount = $tableCount.Trim()
Write-Log "Dev database has $tableCount tables" "OK"

Write-Log "Database sync complete: UAT -> Dev"
Write-Host ""
Write-Host "[OK] Dev database is now a copy of UAT ($tableCount tables)" -ForegroundColor Green
Write-Host ""

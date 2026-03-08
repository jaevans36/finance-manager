# Deploy to UAT Environment
# Builds and deploys the application to the UAT (LAN) environment
#
# Usage:
#   .\scripts\deploy-uat.ps1              # Full deployment
#   .\scripts\deploy-uat.ps1 -Rollback    # Rollback to previous version
#   .\scripts\deploy-uat.ps1 -SkipTests   # Skip test suite (use with caution)
#
# Prerequisites:
#   - Docker running with life-manager-db container
#   - UAT database (finance_manager_uat) exists with migrations applied
#   - Caddy installed and configured (see docs/guides/ENVIRONMENTS_AND_RELEASES.md)
#
# See: docs/guides/ENVIRONMENTS_AND_RELEASES.md

param(
    [switch]$Rollback,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Projects\Finance Manager"
$DeployDir = "$ProjectRoot\deploy"
$BackupDir = "$DeployDir\backups"
$ApiDeployDir = "$DeployDir\api"
$WebDeployDir = "$ProjectRoot\apps\web\dist"
$LogFile = "$ProjectRoot\logs\deployments.log"
$CaddyConfig = "$ProjectRoot\Caddyfile"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry -ForegroundColor $(switch ($Level) {
        "INFO"    { "Cyan" }
        "OK"      { "Green" }
        "WARN"    { "Yellow" }
        "ERROR"   { "Red" }
        "STEP"    { "White" }
        default   { "White" }
    })
    $logDir = Split-Path $LogFile
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $logEntry
}

function Stop-UatServices {
    Write-Log "Stopping UAT services..." "STEP"
    
    # Stop API if running
    $apiProcess = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*FinanceApi*"
    }
    if ($apiProcess) {
        $apiProcess | Stop-Process -Force
        Write-Log "API process stopped" "OK"
    }
    
    # Stop Caddy if running
    $caddyProcess = Get-Process -Name "caddy" -ErrorAction SilentlyContinue
    if ($caddyProcess) {
        $caddyProcess | Stop-Process -Force
        Write-Log "Caddy process stopped" "OK"
    }
}

function Start-UatServices {
    Write-Log "Starting UAT services..." "STEP"
    
    # Start API
    $env:ASPNETCORE_ENVIRONMENT = "Uat"
    $env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=finance_manager_uat;Username=postgres;Password=password"
    Start-Process -FilePath "dotnet" -ArgumentList "$ApiDeployDir\FinanceApi.dll", "--urls", "http://localhost:5000" -WindowStyle Hidden
    Write-Log "API started on http://localhost:5000" "OK"
    
    # Start Caddy
    if (Test-Path $CaddyConfig) {
        Start-Process -FilePath "caddy" -ArgumentList "run", "--config", $CaddyConfig -WindowStyle Hidden
        Write-Log "Caddy started" "OK"
    } else {
        Write-Log "Caddyfile not found at $CaddyConfig — skipping Caddy start" "WARN"
    }
}

# ============================================================
# ROLLBACK MODE
# ============================================================
if ($Rollback) {
    Write-Host ""
    Write-Host "UAT Rollback" -ForegroundColor Red
    Write-Host "============" -ForegroundColor Red
    Write-Host ""
    Write-Log "=== ROLLBACK INITIATED ==="
    
    if (-not (Test-Path "$BackupDir\api")) {
        Write-Log "No backup found at $BackupDir\api — cannot rollback" "ERROR"
        exit 1
    }
    
    Stop-UatServices
    
    # Restore API
    Write-Log "Restoring API from backup..." "STEP"
    if (Test-Path $ApiDeployDir) { Remove-Item $ApiDeployDir -Recurse -Force }
    Copy-Item "$BackupDir\api" $ApiDeployDir -Recurse
    Write-Log "API restored from backup" "OK"
    
    # Restore frontend
    if (Test-Path "$BackupDir\web") {
        Write-Log "Restoring frontend from backup..." "STEP"
        if (Test-Path $WebDeployDir) { Remove-Item $WebDeployDir -Recurse -Force }
        Copy-Item "$BackupDir\web" $WebDeployDir -Recurse
        Write-Log "Frontend restored from backup" "OK"
    }
    
    Start-UatServices
    
    # Health check
    Start-Sleep -Seconds 5
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/api/version/current" -TimeoutSec 10
        Write-Log "Health check passed — version $($health.version)" "OK"
    } catch {
        Write-Log "Health check failed after rollback — manual intervention may be needed" "ERROR"
    }
    
    Write-Log "=== ROLLBACK COMPLETE ==="
    Write-Host ""
    Write-Host "[OK] Rollback complete" -ForegroundColor Green
    exit 0
}

# ============================================================
# DEPLOYMENT MODE
# ============================================================
Write-Host ""
Write-Host "UAT Deployment" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Write-Log "=== DEPLOYMENT STARTED ==="
Write-Log "Branch: $(git -C $ProjectRoot rev-parse --abbrev-ref HEAD)"
Write-Log "Commit: $(git -C $ProjectRoot rev-parse --short HEAD)"

Set-Location $ProjectRoot

# Step 1: Ensure we're on develop branch
Write-Log "Step 1: Checking branch..." "STEP"
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "develop") {
    Write-Log "WARNING: Not on 'develop' branch (currently on '$branch')" "WARN"
    $continue = Read-Host "Deploy from '$branch' anyway? (yes/no)"
    if ($continue -ne "yes") {
        Write-Log "Deployment cancelled — not on develop branch" "WARN"
        exit 0
    }
}
Write-Log "Branch: $branch" "OK"

# Step 2: Pull latest
Write-Log "Step 2: Pulling latest changes..." "STEP"
git pull origin $branch 2>&1
Write-Log "Latest changes pulled" "OK"

# Step 3: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Log "Step 3: Running test suite..." "STEP"
    
    # Backend tests
    Write-Log "Running backend tests..." "STEP"
    $backendResult = dotnet test "$ProjectRoot\apps\finance-api-tests" --no-restore 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Backend tests FAILED — aborting deployment" "ERROR"
        Write-Log $backendResult "ERROR"
        exit 1
    }
    Write-Log "Backend tests passed" "OK"
    
    # Frontend tests
    Write-Log "Running frontend tests..." "STEP"
    Set-Location "$ProjectRoot\apps\web"
    $frontendResult = pnpm test --run 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Frontend tests FAILED — aborting deployment" "ERROR"
        exit 1
    }
    Write-Log "Frontend tests passed" "OK"
    Set-Location $ProjectRoot
} else {
    Write-Log "Step 3: Tests SKIPPED (--SkipTests flag)" "WARN"
}

# Step 4: Backup current deployment
Write-Log "Step 4: Backing up current deployment..." "STEP"
if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

if (Test-Path $ApiDeployDir) {
    if (Test-Path "$BackupDir\api") { Remove-Item "$BackupDir\api" -Recurse -Force }
    Copy-Item $ApiDeployDir "$BackupDir\api" -Recurse
    Write-Log "API backup created" "OK"
}

if (Test-Path $WebDeployDir) {
    if (Test-Path "$BackupDir\web") { Remove-Item "$BackupDir\web" -Recurse -Force }
    Copy-Item $WebDeployDir "$BackupDir\web" -Recurse
    Write-Log "Frontend backup created" "OK"
}

# Record current migration state
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=finance_manager_uat;Username=postgres;Password=password"
Set-Location "$ProjectRoot\apps\finance-api"
$currentMigration = dotnet ef migrations list --no-build 2>&1 | Select-Object -Last 1
Set-Location $ProjectRoot
$currentMigration | Out-File "$BackupDir\migration-state.txt" -Force
Write-Log "Migration state recorded: $currentMigration" "OK"

# Step 5: Build API
Write-Log "Step 5: Building .NET API (Release)..." "STEP"
Set-Location "$ProjectRoot\apps\finance-api"
dotnet publish -c Release -o $ApiDeployDir --no-restore 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "API build FAILED — aborting deployment" "ERROR"
    exit 1
}
Write-Log "API build complete" "OK"
Set-Location $ProjectRoot

# Step 6: Build frontend
Write-Log "Step 6: Building React frontend..." "STEP"
Set-Location "$ProjectRoot\apps\web"
pnpm build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Frontend build FAILED — aborting deployment" "ERROR"
    exit 1
}
Write-Log "Frontend build complete" "OK"
Set-Location $ProjectRoot

# Step 7: Apply database migrations
Write-Log "Step 7: Applying database migrations to UAT..." "STEP"
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=finance_manager_uat;Username=postgres;Password=password"
Set-Location "$ProjectRoot\apps\finance-api"
$migrationResult = dotnet ef database update 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Migration FAILED — consider rollback" "ERROR"
    Write-Log $migrationResult "ERROR"
    Set-Location $ProjectRoot
    exit 1
}
Write-Log "Migrations applied successfully" "OK"
Set-Location $ProjectRoot

# Step 8: Stop old services and start new ones
Stop-UatServices
Start-Sleep -Seconds 2
Start-UatServices

# Step 9: Health check
Write-Log "Step 9: Running health check..." "STEP"
$retries = 0
$healthy = $false
while ($retries -lt 10 -and -not $healthy) {
    Start-Sleep -Seconds 3
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/api/version/current" -TimeoutSec 5
        $healthy = $true
        Write-Log "Health check passed — version $($health.version)" "OK"
    } catch {
        $retries++
        Write-Log "Health check attempt $retries/10..." "WARN"
    }
}

if (-not $healthy) {
    Write-Log "Health check FAILED after 10 attempts — consider rollback with .\scripts\deploy-uat.ps1 -Rollback" "ERROR"
    exit 1
}

# Summary
$duration = (Get-Date) - $startTime
Write-Log "=== DEPLOYMENT COMPLETE ($('{0:mm\:ss}' -f $duration)) ==="

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  UAT Deployment Successful" -ForegroundColor Green
Write-Host "  Duration: $('{0:mm\:ss}' -f $duration)" -ForegroundColor Green
Write-Host "  Branch:   $branch" -ForegroundColor Green
Write-Host "  Commit:   $(git rev-parse --short HEAD)" -ForegroundColor Green
Write-Host "  URL:      http://finance.local" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "To rollback: .\scripts\deploy-uat.ps1 -Rollback" -ForegroundColor Yellow
Write-Host ""

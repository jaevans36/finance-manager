# Deploy to UAT Environment (LAN — https://life-manager)
#
# Usage:
#   .\scripts\deploy-uat.ps1              # Full deployment (tests + build + deploy)
#   .\scripts\deploy-uat.ps1 -SkipTests   # Skip test suite (use with caution)

param([switch]$SkipTests)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Projects\Finance Manager"
$LogFile = "$ProjectRoot\logs\deployments.log"
$ComposeFile = "docker-compose.production.yml"
$EnvFile = ".env.production"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    $colour = switch ($Level) { "OK" { "Green" } "WARN" { "Yellow" } "ERROR" { "Red" } "STEP" { "White" } default { "Cyan" } }
    Write-Host $logEntry -ForegroundColor $colour
    $logDir = Split-Path $LogFile
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Add-Content -Path $LogFile -Value $logEntry
}

Write-Host ""
Write-Host "UAT Deployment -- Life Manager" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Set-Location $ProjectRoot
Write-Log "=== DEPLOYMENT STARTED ==="
Write-Log "Branch: $(git rev-parse --abbrev-ref HEAD)"
Write-Log "Commit: $(git rev-parse --short HEAD)"

# Step 1: Branch check
Write-Log "Step 1: Checking branch..." "STEP"
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "develop") {
    Write-Log "WARNING: Not on 'develop' (on '$branch')" "WARN"
    $ans = Read-Host "Deploy from '$branch' anyway? (yes/no)"
    if ($ans -ne "yes") { Write-Log "Cancelled" "WARN"; exit 0 }
}
Write-Log "Branch: $branch" "OK"

# Step 2: Pull latest
Write-Log "Step 2: Pulling latest changes..." "STEP"
git pull origin $branch 2>&1
Write-Log "Up to date" "OK"

# Step 3: Prerequisites
Write-Log "Step 3: Checking prerequisites..." "STEP"
if (-not (Test-Path "$ProjectRoot\$EnvFile")) { Write-Log ".env.production not found" "ERROR"; exit 1 }
if (-not (Test-Path "$ProjectRoot\certs\life-manager.pem")) { Write-Log "TLS cert not found -- see docs/guides/HTTPS-SETUP.md" "ERROR"; exit 1 }
Write-Log "Prerequisites OK" "OK"

# Step 4: Tests
if (-not $SkipTests) {
    Write-Log "Step 4: Running test suite..." "STEP"
    $testProj = "$ProjectRoot\apps\finance-api-tests"
    if (Test-Path $testProj) {
        dotnet test $testProj --no-restore --verbosity minimal 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Log "Backend tests FAILED -- aborting" "ERROR"; exit 1 }
        Write-Log "Backend tests passed" "OK"
    } else {
        Write-Log "No backend test project -- skipping" "WARN"
    }
    Set-Location "$ProjectRoot\apps\web"
    pnpm test --run 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Log "Frontend tests FAILED -- aborting" "ERROR"; Set-Location $ProjectRoot; exit 1 }
    Write-Log "Frontend tests passed" "OK"
    Set-Location $ProjectRoot
} else {
    Write-Log "Step 4: Tests SKIPPED" "WARN"
}

# Step 5: Build and deploy
Write-Log "Step 5: Building and deploying Docker stack..." "STEP"
Write-Log "(EF migrations run automatically on API container start)" "INFO"
docker compose -f $ComposeFile --env-file $EnvFile up -d --build 2>&1
if ($LASTEXITCODE -ne 0) { Write-Log "Docker Compose FAILED" "ERROR"; exit 1 }
Write-Log "Docker stack deployed" "OK"

# Step 6: Health check
Write-Log "Step 6: Running health check..." "STEP"
$retries = 0; $healthy = $false
while ($retries -lt 15 -and -not $healthy) {
    Start-Sleep -Seconds 4
    try {
        $h = Invoke-RestMethod -Uri "https://life-manager/api/health" -TimeoutSec 5 -SkipCertificateCheck
        if ($h.status -eq "healthy") { $healthy = $true; Write-Log "Health check passed" "OK" }
    } catch { $retries++; Write-Log "Waiting... ($retries/15)" "WARN" }
}
if (-not $healthy) { Write-Log "Health check FAILED -- docker compose -f $ComposeFile logs api" "ERROR"; exit 1 }

$duration = (Get-Date) - $startTime
Write-Log "=== DEPLOYMENT COMPLETE ($('{0:mm\:ss}' -f $duration)) ==="
Write-Host ""
Write-Host "  UAT deployment successful -- https://life-manager" -ForegroundColor Green
Write-Host "  Branch: $branch | Commit: $(git rev-parse --short HEAD)" -ForegroundColor Green
Write-Host ""

# Reset TEST database
# This is safe to run anytime - it only affects the test database

Write-Host "Test Database Reset" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Projects\Finance Manager"

# Check if database is running
Write-Host "Checking database status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=finance-manager-db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "[X] Database container is not running" -ForegroundColor Red
    Write-Host "Run .\start-dev.ps1 first to start the database" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Database is running" -ForegroundColor Green

# Reset the test database
Write-Host ""
Write-Host "Resetting test database schema..." -ForegroundColor Yellow
Set-Location "apps/api"

$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/finance_manager_test"
pnpm prisma migrate reset --force --skip-seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Test database reset complete" -ForegroundColor Green
} else {
    Write-Host "[X] Test database reset failed" -ForegroundColor Red
    Set-Location "C:\Projects\Finance Manager"
    exit 1
}

Set-Location "C:\Projects\Finance Manager"

Write-Host ""
Write-Host "[OK] Test database is ready for testing" -ForegroundColor Green
Write-Host ""

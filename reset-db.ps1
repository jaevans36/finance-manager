# Reset database for development
# WARNING: This will DELETE ALL DATA in the development database

param(
    [switch]$Force
)

Write-Host "Database Reset Utility" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

if (-not $Force) {
    Write-Host "[WARNING] This will DELETE ALL DATA in your development database!" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to continue? Type 'yes' to confirm"
    
    if ($confirmation -ne "yes") {
        Write-Host "Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
}

Set-Location "C:\Projects\Finance Manager"

# Check if database is running
Write-Host ""
Write-Host "Checking database status..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=finance-manager-db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "[X] Database container is not running" -ForegroundColor Red
    Write-Host "Run .\start-dev.ps1 first to start the database" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Database is running" -ForegroundColor Green

# Step 1: Reset the database using Prisma
Write-Host ""
Write-Host "Step 1: Resetting database schema..." -ForegroundColor Yellow
Set-Location "apps/api"

# Reset the database (drops all tables and recreates them)
pnpm prisma migrate reset --force --skip-seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database schema reset complete" -ForegroundColor Green
} else {
    Write-Host "[X] Database reset failed" -ForegroundColor Red
    Set-Location "C:\Projects\Finance Manager"
    exit 1
}

# Step 2: Generate Prisma Client (in case it needs updating)
Write-Host ""
Write-Host "Step 2: Regenerating Prisma Client..." -ForegroundColor Yellow
pnpm db:generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Prisma Client regenerated" -ForegroundColor Green
} else {
    Write-Host "[X] Prisma Client generation failed" -ForegroundColor Red
    Set-Location "C:\Projects\Finance Manager"
    exit 1
}

Set-Location "C:\Projects\Finance Manager"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "[OK] Database reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your development database is now empty and ready to use." -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Create a new user via API: POST http://localhost:3000/api/v1/auth/register" -ForegroundColor White
Write-Host "  - Or use the web interface: http://localhost:5173/register" -ForegroundColor White
Write-Host ""

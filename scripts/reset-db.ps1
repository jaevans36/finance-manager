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
$containerStatus = docker ps --filter "name=life-manager-db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "[X] Database container is not running" -ForegroundColor Red
    Write-Host "Run .\start-dev.ps1 first to start the database" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Database is running" -ForegroundColor Green

# Step 1: Drop and recreate database using EF Core
Write-Host ""
Write-Host "Step 1: Dropping database..." -ForegroundColor Yellow
Set-Location "apps/finance-api"

# Drop the database
dotnet ef database drop --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database dropped" -ForegroundColor Green
}
else {
    Write-Host "[!] Database drop warning (may not exist yet)" -ForegroundColor Yellow
}

# Step 2: Apply migrations to recreate schema
Write-Host ""
Write-Host "Step 2: Applying migrations..." -ForegroundColor Yellow
dotnet ef database update

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database schema created" -ForegroundColor Green
}
else {
    Write-Host "[X] Database migration failed" -ForegroundColor Red
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
Write-Host "  - Create a new user via API: POST http://localhost:5000/api/auth/register" -ForegroundColor White
Write-Host "  - Test with Swagger UI: http://localhost:5000/swagger" -ForegroundColor White
Write-Host "  - Or use the web interface: http://localhost:5173/register" -ForegroundColor White
Write-Host ""

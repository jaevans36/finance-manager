# Finance Manager - Development Startup Script
# This script starts all required services for development

Write-Host "Finance Manager - Starting Development Environment" -ForegroundColor Cyan
Write-Host ""

# Change to project root
Set-Location "C:\Projects\Finance Manager"

# Step 1: Check if Docker Desktop is running
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Docker is not running. Starting Docker Desktop..." -ForegroundColor Red
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Write-Host "Waiting 30 seconds for Docker to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    } else {
        Write-Host "[OK] Docker is running" -ForegroundColor Green
    }
} catch {
    Write-Host "[X] Docker Desktop not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Step 2: Start PostgreSQL database
Write-Host ""
Write-Host "Step 2: Starting PostgreSQL database..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database to be healthy
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $containerStatus = docker ps --filter "name=finance-manager-db" --format "{{.Status}}"
    if ($containerStatus -like "*healthy*") {
        Write-Host "[OK] Database is ready" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $attempt++
}

if ($attempt -eq $maxAttempts) {
    Write-Host "[X] Database failed to start" -ForegroundColor Red
    exit 1
}

# Step 3: Check if migrations are needed
Write-Host ""
Write-Host "Step 3: Checking database migrations..." -ForegroundColor Yellow
Set-Location "apps/api"
$migrationStatus = pnpm prisma migrate status 2>&1
if ($migrationStatus -like "*Database schema is up to date*") {
    Write-Host "[OK] Database migrations are up to date" -ForegroundColor Green
} else {
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    pnpm db:migrate --name auto-migration
}

# Step 4: Generate Prisma Client
Write-Host ""
Write-Host "Step 4: Generating Prisma Client..." -ForegroundColor Yellow
pnpm db:generate
Write-Host "[OK] Prisma Client generated" -ForegroundColor Green

Set-Location "C:\Projects\Finance Manager"

# Step 5: Start development servers
Write-Host ""
Write-Host "Step 5: Starting development servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Development environment is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "   API:      http://localhost:3000" -ForegroundColor White
Write-Host "   Web:      http://localhost:5173" -ForegroundColor White
Write-Host "   Database: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start the development servers
pnpm dev

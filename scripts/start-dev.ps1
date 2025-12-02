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

    # Step 2: Start PostgreSQL container
    Write-Host ""
    Write-Host "Step 2: Starting PostgreSQL database..." -ForegroundColor Yellow
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Failed to start database" -ForegroundColor Red
        exit 1
    }
    
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

    # Step 3: Check C# .NET API migrations
    Write-Host ""
    Write-Host "Step 3: Checking .NET API migrations..." -ForegroundColor Yellow
    Set-Location "apps/finance-api"
    $efMigrations = dotnet ef migrations list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] EF Core migrations ready" -ForegroundColor Green
    }
    else {
        Write-Host "[!] No migrations found" -ForegroundColor Yellow
        Write-Host "    Run 'dotnet ef migrations add InitialMigration' in apps/finance-api" -ForegroundColor Gray
    }

    Set-Location "C:\Projects\Finance Manager"

    # Step 4: Start development servers
    Write-Host ""
    Write-Host "Step 4: Starting development servers..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "Development environment is starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "   API (C# .NET):          http://localhost:5000" -ForegroundColor White
    Write-Host "   Web (React):            http://localhost:5173" -ForegroundColor White
    Write-Host "   Database (PostgreSQL):  localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Cyan
    Write-Host "   Swagger UI:             http://localhost:5000/swagger" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host ""

    # Start all development servers in parallel
    $jobs = @()

    # Start C# .NET API
    $jobs += Start-Job -ScriptBlock {
        Set-Location "C:\Projects\Finance Manager\apps\finance-api"
        dotnet watch run
    }

    # Start React Web App  
    $jobs += Start-Job -ScriptBlock {
        Set-Location "C:\Projects\Finance Manager\apps\web"
        pnpm dev
    }

    # Monitor jobs and display output
    try {
        while ($true) {
            foreach ($job in $jobs) {
                $output = Receive-Job $job
                if ($output) {
                    Write-Host $output
                }
            }
            Start-Sleep -Milliseconds 100
        }
    }
    finally {
        Write-Host ""
        Write-Host "Stopping all services..." -ForegroundColor Yellow
        $jobs | Stop-Job
        $jobs | Remove-Job
    }
}
catch {
    Write-Host ""
    Write-Host "[X] Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

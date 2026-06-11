# Life Manager - Development Startup Script
# This script starts all required services for development

Write-Host "Life Manager - Starting Development Environment" -ForegroundColor Cyan
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

    # Step 2: Clear any stale processes holding the dev ports
    Write-Host ""
    Write-Host "Step 2: Clearing any stale processes on dev ports..." -ForegroundColor Yellow
    @(5000, 5001, 5002, 5003, 5173) | ForEach-Object {
        $port = $_
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess |
            ForEach-Object {
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                Write-Host "   Cleared stale process on port $port" -ForegroundColor Gray
            }
    }
    Write-Host "[OK] Ports clear" -ForegroundColor Green

    # Step 3: Start PostgreSQL container
    Write-Host ""
    Write-Host "Step 3: Starting PostgreSQL database..." -ForegroundColor Yellow
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Failed to start database" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        $containerStatus = docker ps --filter "name=life-manager-db" --format "{{.Status}}"
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

    # Step 4: Check migrations for both APIs
    Write-Host ""
    Write-Host "Step 4: Checking .NET API migrations..." -ForegroundColor Yellow

    $dotnetEfPath = "$env:USERPROFILE\.dotnet\tools\dotnet-ef.exe"

    Set-Location "apps/life-api"
    if (Test-Path $dotnetEfPath) {
        & $dotnetEfPath migrations list 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Host "[OK] life-api migrations ready" -ForegroundColor Green }
        else { Write-Host "[!] life-api: run 'dotnet ef migrations add <Name>' in apps/life-api" -ForegroundColor Yellow }
    } else {
        Write-Host "[OK] life-api migrations check skipped (dotnet-ef not found)" -ForegroundColor Gray
    }
    Set-Location "C:\Projects\Finance Manager"

    Set-Location "apps/finance-api"
    if (Test-Path $dotnetEfPath) {
        & $dotnetEfPath migrations list 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Host "[OK] finance-api migrations ready" -ForegroundColor Green }
        else { Write-Host "[!] finance-api: run 'dotnet ef migrations add <Name>' in apps/finance-api" -ForegroundColor Yellow }
    } else {
        Write-Host "[OK] finance-api migrations check skipped (dotnet-ef not found)" -ForegroundColor Gray
    }
    Set-Location "C:\Projects\Finance Manager"

    # Step 5: Start development servers
    Write-Host ""
    Write-Host "Step 5: Starting development servers..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "Development environment is starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "   Life API (.NET):        http://localhost:5000" -ForegroundColor White
    Write-Host "   Finance API (.NET):     http://localhost:5002" -ForegroundColor White
    Write-Host "   Web (React/Vite):       http://localhost:5173" -ForegroundColor White
    Write-Host "   Database (PostgreSQL):  localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "Swagger / API Docs:" -ForegroundColor Cyan
    Write-Host "   Life API:               http://localhost:5000/swagger" -ForegroundColor White
    Write-Host "   Finance API:            http://localhost:5002/swagger" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host ""

    # Start all development servers in parallel
    $jobs = @()

    # Start Life API (.NET)
    $jobs += Start-Job -Name "life-api" -ScriptBlock {
        Set-Location "C:\Projects\Finance Manager\apps\life-api"
        dotnet watch run --launch-profile http
    }

    # Start Finance API (.NET)
    $jobs += Start-Job -Name "finance-api" -ScriptBlock {
        Set-Location "C:\Projects\Finance Manager\apps\finance-api"
        dotnet watch run --launch-profile http
    }

    # Start React Web App
    $jobs += Start-Job -Name "web" -ScriptBlock {
        Set-Location "C:\Projects\Finance Manager\apps\web"
        $env:PATH = "$env:APPDATA\npm;$env:PATH"
        pnpm dev
    }

    # Monitor jobs and display output
    try {
        while ($true) {
            foreach ($job in $jobs) {
                $output = Receive-Job $job
                if ($output) {
                    $prefix = "[$($job.Name)] "
                    $output | ForEach-Object { Write-Host "$prefix$_" }
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

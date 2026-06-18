# Life Manager - Quick Restart of Development Environment

Write-Host "Life Manager - Restarting Development Environment" -ForegroundColor Cyan
Write-Host ""
Set-Location "C:\Projects\Finance Manager"

# -- Step 1: Check Docker is running ------------------------------------------
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
$dockerReady = $false
$dockerAttempts = 0
while (-not $dockerReady -and $dockerAttempts -lt 60) {
    $pipe = Get-ChildItem -Path "\\.\pipe\" | Where-Object { $_.Name -like "dockerDesktopLinuxEngine" }
    if ($pipe) {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
    }
    if ($dockerAttempts -eq 0) { Write-Host "   Waiting for Docker engine" -NoNewline -ForegroundColor Yellow }
    Write-Host "." -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    $dockerAttempts++
}
if (-not $dockerReady) {
    Write-Host ""
    Write-Host "[X] Docker engine is not ready after $($dockerAttempts * 2)s." -ForegroundColor Red
    Write-Host "    Check Docker Desktop in the system tray - wait for the whale icon" -ForegroundColor Yellow
    Write-Host "    to stop animating, then re-run this script." -ForegroundColor Yellow
    exit 1
}
Write-Host " ready" -ForegroundColor Green
Write-Host "[OK] Docker is ready" -ForegroundColor Green

# -- Step 2: Ensure postgres is running ---------------------------------------
Write-Host ""
Write-Host "Step 2: Starting database..." -ForegroundColor Yellow
docker-compose up -d postgres 2>&1 | Out-Null

Write-Host "   Waiting for database to be healthy" -NoNewline -ForegroundColor Yellow
$maxAttempts = 40
$attempt = 0
$dbReady = $false
while ($attempt -lt $maxAttempts) {
    $status = docker ps --filter "name=life-manager-db" --format "{{.Status}}" 2>&1
    if ($status -like "*healthy*") {
        $dbReady = $true
        Write-Host " done ($($attempt)s)" -ForegroundColor Green
        break
    }
    Write-Host "." -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    $attempt++
}
if (-not $dbReady) {
    Write-Host ""
    Write-Host "[X] Database did not become healthy after ${maxAttempts}s" -ForegroundColor Red
    Write-Host "    Check:  docker ps" -ForegroundColor Yellow
    Write-Host "    Logs:   docker logs life-manager-db" -ForegroundColor Yellow
    exit 1
}

# -- Step 3: Free ports held by old processes ----------------------------------
Write-Host ""
Write-Host "Step 3: Stopping old processes..." -ForegroundColor Yellow
@(5000, 5001, 5002, 5003, 5173) | ForEach-Object {
    $port = $_
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess |
        ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            Write-Host "   Cleared port $port" -ForegroundColor Gray
        }
}
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node"   -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "[OK] Ports clear" -ForegroundColor Green

# -- Step 4: Start development servers ----------------------------------------
Write-Host ""
Write-Host "Step 4: Starting development servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   life-api     http://localhost:5000   (Swagger: /swagger)" -ForegroundColor DarkGray
Write-Host "   finance-api  http://localhost:5002   (Swagger: /swagger)" -ForegroundColor DarkGray
Write-Host "   web          http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor DarkGray
Write-Host ""

$jobs = @()
$jobs += Start-Job -Name "life-api" -ScriptBlock {
    Set-Location "C:\Projects\Finance Manager\apps\life-api"
    dotnet watch run --launch-profile http
}
$jobs += Start-Job -Name "finance-api" -ScriptBlock {
    Set-Location "C:\Projects\Finance Manager\apps\finance-api"
    dotnet watch run --launch-profile http
}
$jobs += Start-Job -Name "web" -ScriptBlock {
    Set-Location "C:\Projects\Finance Manager\apps\web"
    $env:PATH = "$env:APPDATA\npm;$env:PATH"
    pnpm dev
}

$colors = @{ "life-api" = "Cyan"; "finance-api" = "Green"; "web" = "Yellow" }
$ready = @{}
$bannerShown = $false

try {
    while ($true) {
        foreach ($job in $jobs) {
            $lines = Receive-Job $job
            if (-not $lines) { continue }
            $color = if ($colors[$job.Name]) { $colors[$job.Name] } else { "Gray" }
            foreach ($line in $lines) {
                Write-Host "[$($job.Name)] $line" -ForegroundColor $color

                # .NET API ready signal
                if (-not $ready[$job.Name] -and $line -like "*Now listening on*") {
                    $ready[$job.Name] = $true
                    Write-Host "  --> $($job.Name) is ready" -ForegroundColor Green
                }
                # Vite ready signal
                if (-not $ready[$job.Name] -and ($line -like "*Local:*http*" -or $line -like "*ready in*")) {
                    $ready[$job.Name] = $true
                    Write-Host "  --> $($job.Name) is ready" -ForegroundColor Green
                }
            }
        }

        if (-not $bannerShown -and $ready.Count -eq $jobs.Count) {
            $bannerShown = $true
            Write-Host ""
            Write-Host "==========================================" -ForegroundColor Green
            Write-Host "  All services ready!" -ForegroundColor Green
            Write-Host "  App:          http://localhost:5173" -ForegroundColor White
            Write-Host "  Finance API:  http://localhost:5002/swagger" -ForegroundColor White
            Write-Host "==========================================" -ForegroundColor Green
            Write-Host ""
        }

        Start-Sleep -Milliseconds 200
    }
}
finally {
    $jobs | Stop-Job
    $jobs | Remove-Job
}

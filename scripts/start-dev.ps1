# Life Manager - Development Startup Script
#
# Runs postgres, life-api, finance-api and web as containers
# (docker-compose.yml + docker-compose.dev.yml, all live-reloading via
# dotnet watch / Vite's dev server). Adding a new NuGet or npm package needs
# a rebuild to pick up the restore - the file-watchers only catch source
# changes, not new dependencies. This script always passes --build, so a
# plain re-run after adding a package is enough.

Write-Host "Life Manager - Starting Development Environment" -ForegroundColor Cyan
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

# -- Step 2: Build + start the dev stack ---------------------------------------
Write-Host ""
Write-Host "Step 2: Starting dev stack (postgres, life-api, finance-api, web)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   life-api     http://localhost:5000   (health: /api/health)" -ForegroundColor DarkGray
Write-Host "   finance-api  http://localhost:5002   (Swagger: /swagger)" -ForegroundColor DarkGray
Write-Host "   web          http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press Ctrl+C to stop (or run: pnpm stop)" -ForegroundColor DarkGray
Write-Host ""

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

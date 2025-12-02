# Stop all Finance Manager services

Write-Host "Stopping Finance Manager services..." -ForegroundColor Yellow
Set-Location "C:\Projects\Finance Manager"

# Stop Node.js processes (API and Web)
Write-Host "Stopping Node.js services..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] Node.js services stopped" -ForegroundColor Green

# Stop .NET processes (Finance API)
Write-Host "Stopping .NET Finance API..." -ForegroundColor Cyan
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*finance-api*" } | Stop-Process -Force
# Fallback: stop all dotnet watch processes
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*watch*" } | Stop-Process -Force
Write-Host "[OK] .NET services stopped" -ForegroundColor Green

# Stop Docker containers
Write-Host "Stopping database..." -ForegroundColor Cyan
docker-compose down
Write-Host "[OK] Database stopped" -ForegroundColor Green

Write-Host ""
Write-Host "[OK] All services stopped" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run: .\start-dev.ps1" -ForegroundColor Yellow

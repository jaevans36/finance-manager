# Stop all Finance Manager services

Write-Host "Stopping Finance Manager services..." -ForegroundColor Yellow
Set-Location "C:\Projects\Finance Manager"

# Stop Docker containers
Write-Host "Stopping database..." -ForegroundColor Cyan
docker-compose down

Write-Host "[OK] All services stopped" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run: .\start-dev.ps1" -ForegroundColor Yellow

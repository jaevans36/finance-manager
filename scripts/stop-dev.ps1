# Stop all Life Manager dev services
#
# Only tears down this project's containers (docker compose down is scoped
# to the compose project) - unlike the old process-based approach, this
# can't touch an unrelated .NET/Node process running on the machine.

Write-Host "Stopping Life Manager services..." -ForegroundColor Yellow
Set-Location "C:\Projects\Finance Manager"

docker compose -f docker-compose.yml -f docker-compose.dev.yml down

Write-Host ""
Write-Host "[OK] All services stopped" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run: .\scripts\start-dev.ps1" -ForegroundColor Yellow

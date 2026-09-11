# Life Manager - Quick Restart of Development Environment

Write-Host "Life Manager - Restarting Development Environment" -ForegroundColor Cyan
Write-Host ""
Set-Location "C:\Projects\Finance Manager"

Write-Host "Stopping current stack..." -ForegroundColor Yellow
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

Write-Host ""
Write-Host "Starting dev stack (postgres, life-api, finance-api, web)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   life-api     http://localhost:5000   (health: /api/health)" -ForegroundColor DarkGray
Write-Host "   finance-api  http://localhost:5002   (Swagger: /swagger)" -ForegroundColor DarkGray
Write-Host "   web          http://localhost:5173" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press Ctrl+C to stop (or run: pnpm stop)" -ForegroundColor DarkGray
Write-Host ""

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

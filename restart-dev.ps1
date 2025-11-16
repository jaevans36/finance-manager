# Quick restart of development servers
# Use this when database is already running

Write-Host "Restarting development servers..." -ForegroundColor Cyan
Set-Location "C:\Projects\Finance Manager"

Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor Yellow
Write-Host "   API:  http://localhost:3000" -ForegroundColor White
Write-Host "   Web:  http://localhost:5173" -ForegroundColor White
Write-Host ""

pnpm dev

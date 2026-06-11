# Stop all Life Manager services

Write-Host "Stopping Life Manager services..." -ForegroundColor Yellow
Set-Location "C:\Projects\Finance Manager"

# Kill anything holding the known API and dev-server ports
Write-Host "Freeing ports..." -ForegroundColor Cyan
@(5000, 5001, 5002, 5003, 5173) | ForEach-Object {
    $port = $_
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess |
        ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
}

# Kill remaining dotnet and node processes
Write-Host "Stopping .NET and Node.js processes..." -ForegroundColor Cyan
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node"   -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "[OK] API and web services stopped" -ForegroundColor Green

# Stop Docker containers
Write-Host "Stopping database..." -ForegroundColor Cyan
docker-compose down
Write-Host "[OK] Database stopped" -ForegroundColor Green

Write-Host ""
Write-Host "[OK] All services stopped" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run: .\scripts\start-dev.ps1" -ForegroundColor Yellow

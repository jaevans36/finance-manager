# Quick restart of development servers
# Use this when database is already running

Write-Host "Restarting development servers..." -ForegroundColor Cyan
Set-Location "C:\Projects\Finance Manager"

# Kill any processes holding the known API and dev-server ports
Write-Host "Freeing ports..." -ForegroundColor Yellow
@(5000, 5001, 5002, 5003, 5173) | ForEach-Object {
    $port = $_
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess |
        ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
}

# Kill any remaining dotnet and node processes as a fallback
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node"   -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Give the OS a moment to release port bindings
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor Yellow
Write-Host "   Life API (.NET):        http://localhost:5000" -ForegroundColor White
Write-Host "   Finance API (.NET):     http://localhost:5002" -ForegroundColor White
Write-Host "   Web (React/Vite):       http://localhost:5173" -ForegroundColor White
Write-Host "   Life API Swagger:       http://localhost:5000/swagger" -ForegroundColor White
Write-Host "   Finance API Swagger:    http://localhost:5002/swagger" -ForegroundColor White
Write-Host ""

# Start all servers in parallel
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
    $jobs | Stop-Job
    $jobs | Remove-Job
}

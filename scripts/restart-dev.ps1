# Quick restart of development servers
# Use this when database is already running

Write-Host "Restarting development servers..." -ForegroundColor Cyan
Set-Location "C:\Projects\Finance Manager"

# Stop Node.js and .NET processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*watch*" } | Stop-Process -Force

Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor Yellow
Write-Host "   API (C# .NET):          http://localhost:5000" -ForegroundColor White
Write-Host "   Swagger UI:             http://localhost:5000/swagger" -ForegroundColor White
Write-Host "   Web (React):            http://localhost:5173" -ForegroundColor White
Write-Host ""

# Start all servers in parallel
$jobs = @()

$jobs += Start-Job -ScriptBlock {
    Set-Location "C:\Projects\Finance Manager\apps\finance-api"
    dotnet watch run
}

$jobs += Start-Job -ScriptBlock {
    Set-Location "C:\Projects\Finance Manager\apps\web"
    $env:PATH = "$env:APPDATA\npm;$env:PATH"
    pnpm dev
}

try {
    while ($true) {
        foreach ($job in $jobs) {
            $output = Receive-Job $job
            if ($output) {
                Write-Host $output
            }
        }
        Start-Sleep -Milliseconds 100
    }
}
finally {
    $jobs | Stop-Job
    $jobs | Remove-Job
}

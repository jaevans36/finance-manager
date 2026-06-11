# Quick restart of development servers

Write-Host "Life Manager - Restarting Development Environment" -ForegroundColor Cyan
Write-Host ""
Set-Location "C:\Projects\Finance Manager"

# Step 1: Ensure Docker and PostgreSQL are up
Write-Host "Step 1: Checking database..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Docker is not running. Starting Docker Desktop..." -ForegroundColor Red
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Write-Host "Waiting 30 seconds for Docker to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
} catch {
    Write-Host "[X] Docker check failed: $($_.Exception.Message)" -ForegroundColor Red
}

docker-compose up -d 2>&1 | Out-Null

$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $containerStatus = docker ps --filter "name=life-manager-db" --format "{{.Status}}"
    if ($containerStatus -like "*healthy*") {
        Write-Host "[OK] Database is ready" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $attempt++
}
if ($attempt -eq $maxAttempts) {
    Write-Host "[X] Database failed to start — aborting restart" -ForegroundColor Red
    exit 1
}

# Step 2: Free ports held by old processes
Write-Host ""
Write-Host "Step 2: Freeing ports..." -ForegroundColor Yellow
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

# Step 3: Start all servers
Write-Host ""
Write-Host "Step 3: Starting development servers..." -ForegroundColor Yellow
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

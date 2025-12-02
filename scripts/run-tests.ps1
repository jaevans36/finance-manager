# Run all tests (backend, frontend, and E2E)

param(
    [switch]$Watch,
    [switch]$Coverage,
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$E2E
)

Write-Host "Finance Manager - Test Runner" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Projects\Finance Manager"

$testsFailed = $false

# If no specific test type specified, run all
$runAll = -not ($Backend -or $Frontend -or $E2E)

# Backend Tests (.NET)
if ($Backend -or $runAll) {
    Write-Host "Running Backend Tests (.NET)..." -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    
    # Unit Tests
    Write-Host "Running Unit Tests..." -ForegroundColor Cyan
    Set-Location "apps/finance-api-tests/FinanceApi.UnitTests"
    
    if ($Coverage) {
        dotnet test --collect:"XPlat Code Coverage" --settings ../coverlet.runsettings
    }
    else {
        dotnet test --verbosity minimal
    }
    
    if ($LASTEXITCODE -ne 0) {
        $testsFailed = $true
        Write-Host "[X] Unit tests failed" -ForegroundColor Red
    }
    else {
        Write-Host "[OK] Unit tests passed" -ForegroundColor Green
    }
    
    # Integration Tests
    Write-Host ""
    Write-Host "Running Integration Tests..." -ForegroundColor Cyan
    Set-Location "../FinanceApi.IntegrationTests"
    
    if ($Coverage) {
        dotnet test --collect:"XPlat Code Coverage" --settings ../coverlet.runsettings
    }
    else {
        dotnet test --verbosity minimal
    }
    
    if ($LASTEXITCODE -ne 0) {
        $testsFailed = $true
        Write-Host "[X] Integration tests failed" -ForegroundColor Red
    }
    else {
        Write-Host "[OK] Integration tests passed" -ForegroundColor Green
    }
    
    Write-Host ""
    Set-Location "C:\Projects\Finance Manager"
}

# Frontend Tests
if ($Frontend -or $runAll) {
    Write-Host "Running Frontend Tests..." -ForegroundColor Yellow
    Write-Host "=========================" -ForegroundColor Yellow
    Set-Location "apps/web"
    
    if ($Watch) {
        pnpm test:watch
    }
    elseif ($Coverage) {
        pnpm test -- --coverage
    }
    else {
        pnpm test
    }
    
    if ($LASTEXITCODE -ne 0) {
        $testsFailed = $true
        Write-Host "[X] Frontend tests failed" -ForegroundColor Red
    }
    else {
        Write-Host "[OK] Frontend tests passed" -ForegroundColor Green
    }
    Write-Host ""
    Set-Location "C:\Projects\Finance Manager"
}

# E2E Tests
if ($E2E -or $runAll) {
    Write-Host "Running E2E Tests..." -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    
    # Check if services are running
    $apiRunning = $false
    $webRunning = $false
    
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $apiRunning = $true
    }
    catch {
        $apiRunning = $false
    }
    
    try {
        $webResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $webRunning = $true
    }
    catch {
        $webRunning = $false
    }
    
    if (-not $apiRunning -or -not $webRunning) {
        Write-Host "[WARNING] Services are not running!" -ForegroundColor Yellow
        Write-Host "API (localhost:5000): $(if ($apiRunning) { '[OK]' } else { '[X] NOT RUNNING' })" -ForegroundColor $(if ($apiRunning) { 'Green' } else { 'Red' })
        Write-Host "Web (localhost:5173): $(if ($webRunning) { '[OK]' } else { '[X] NOT RUNNING' })" -ForegroundColor $(if ($webRunning) { 'Green' } else { 'Red' })
        Write-Host ""
        Write-Host "Please run .\start-dev.ps1 in another terminal first" -ForegroundColor Yellow
        $testsFailed = $true
    } else {
        Set-Location "apps/web"
        pnpm test:e2e
        
        if ($LASTEXITCODE -ne 0) {
            $testsFailed = $true
            Write-Host "[X] E2E tests failed" -ForegroundColor Red
        } else {
            Write-Host "[OK] E2E tests passed" -ForegroundColor Green
        }
        Set-Location "C:\Projects\Finance Manager"
    }
    Write-Host ""
}

# Summary
Write-Host "==============================" -ForegroundColor Cyan
if ($testsFailed) {
    Write-Host "[X] Some tests failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] All tests passed!" -ForegroundColor Green
    exit 0
}

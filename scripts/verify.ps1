# Verify - runs the same checks as CI (.github/workflows/ci.yml), locally.
# Intended to be run before pushing so a red CI run is never the first time you find out.

Write-Host "Life Manager - Verify (mirrors CI)" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$failed = $false

function Step($name, [scriptblock]$action) {
    Write-Host "-> $name" -ForegroundColor Yellow
    & $action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] $name failed" -ForegroundColor Red
        $script:failed = $true
    }
    else {
        Write-Host "[OK] $name" -ForegroundColor Green
    }
    Write-Host ""
}

# -- Lint & type check (mirrors the `lint` CI job) -----------------------------
Step "Lint (frontend, ESLint)" { pnpm lint }
Step "Type check (frontend, tsc)" { pnpm typecheck }
Step "Build life-api (dotnet build)" {
    dotnet build apps/life-api/LifeApi.csproj --configuration Release
}
Step "Build finance-api (dotnet build)" {
    dotnet build apps/finance-api/FinanceApi.csproj --configuration Release
}

# -- Backend tests (mirrors the `backend-tests` CI job, both APIs) -------------
& "$PSScriptRoot\run-tests.ps1" -Backend
if ($LASTEXITCODE -ne 0) { $failed = $true }

# -- Frontend tests (mirrors the `frontend-tests` CI job) ----------------------
Step "Frontend tests (Jest)" {
    Set-Location "apps/web"
    pnpm exec jest --passWithNoTests
    Set-Location $repoRoot
}

# -- Compose config sanity (mirrors the `build` CI job's compose validation) ---
Step "Validate production compose file" {
    docker compose -f docker-compose.production.yml config --quiet
}

Write-Host "===================================" -ForegroundColor Cyan
if ($failed) {
    Write-Host "[X] Verify failed - fix the above before pushing" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "[OK] Verify passed - matches what CI will run" -ForegroundColor Green
    exit 0
}

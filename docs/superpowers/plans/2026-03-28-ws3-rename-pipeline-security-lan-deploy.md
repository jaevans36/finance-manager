# WS3 Rename + Pipeline Hardening + Security + LAN Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all `finance-*` references to `life-*`, harden the CI pipeline, fix security issues found in audit, and get the app running at `https://life-manager` on the LAN.

**Architecture:** Four sequential PRs — rename first (clean slate), then pipeline hardening (fix integration tests, validate compose), then security fixes, then LAN deployment setup. Each PR ships independently to `develop`.

**Tech Stack:** .NET 8 / C# / xUnit / Docker Compose / GitHub Actions / nginx / mkcert / PowerShell

---

## Pre-work: Read before starting

- Spec: `docs/superpowers/specs/2026-03-28-ws3-ws4-rename-pipeline-security-lan-deploy-design.md`
- Current state: `docs/CURRENT_STATE.md`
- Project root: `c:/Projects/Finance Manager/`

---

## Phase 1 — WS3: Rename `finance-*` → `life-*`

**Branch:** `phase-ws3/rename-finance-to-life`

### Task 1: Rename C# project folders and files

**Files:**
- Rename: `apps/finance-api/` → `apps/life-api/`
- Rename: `apps/finance-api-tests/` → `apps/life-api-tests/`
- Rename: `apps/life-api/FinanceApi.csproj` → `apps/life-api/LifeApi.csproj`
- Rename: `apps/life-api-tests/FinanceApi.UnitTests/FinanceApi.UnitTests.csproj` → `apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj`
- Rename: `apps/life-api-tests/FinanceApi.IntegrationTests/FinanceApi.IntegrationTests.csproj` → `apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj`

- [ ] **Step 1: Rename folders with git mv**

```bash
cd "c:/Projects/Finance Manager"
git mv apps/finance-api apps/life-api
git mv apps/finance-api-tests apps/life-api-tests
```

- [ ] **Step 2: Rename csproj files**

```bash
git mv apps/life-api/FinanceApi.csproj apps/life-api/LifeApi.csproj
git mv "apps/life-api-tests/FinanceApi.UnitTests/FinanceApi.UnitTests.csproj" "apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj"
git mv "apps/life-api-tests/FinanceApi.IntegrationTests/FinanceApi.IntegrationTests.csproj" "apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj"
```

- [ ] **Step 3: Rename test project folders to match**

```bash
git mv "apps/life-api-tests/FinanceApi.UnitTests" "apps/life-api-tests/LifeApi.UnitTests"
git mv "apps/life-api-tests/FinanceApi.IntegrationTests" "apps/life-api-tests/LifeApi.IntegrationTests"
```

- [ ] **Step 4: Verify git status shows renames (not deletes+creates)**

```bash
git status
```

Expected: Files shown as `renamed: apps/finance-api/... -> apps/life-api/...`

---

### Task 2: Update C# namespaces

**Files:**
- Modify: all `.cs` files in `apps/life-api/` — namespace `FinanceApi` → `LifeApi`
- Modify: all `.cs` files in `apps/life-api-tests/` — namespace `FinanceApi` → `LifeApi`

- [ ] **Step 1: Mass-replace namespace declarations in API project**

```bash
# Windows PowerShell — run from project root
Get-ChildItem -Path "apps/life-api" -Filter "*.cs" -Recurse |
  ForEach-Object {
    (Get-Content $_.FullName) -replace 'namespace FinanceApi', 'namespace LifeApi' `
                              -replace 'using FinanceApi', 'using LifeApi' |
    Set-Content $_.FullName
  }
```

- [ ] **Step 2: Mass-replace namespace declarations in test projects**

```bash
Get-ChildItem -Path "apps/life-api-tests" -Filter "*.cs" -Recurse |
  ForEach-Object {
    (Get-Content $_.FullName) -replace 'namespace FinanceApi', 'namespace LifeApi' `
                              -replace 'using FinanceApi', 'using LifeApi' |
    Set-Content $_.FullName
  }
```

- [ ] **Step 3: Update ProjectReference paths in test csproj files**

In `apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj`, change:
```xml
<ProjectReference Include="..\..\finance-api\FinanceApi.csproj" />
```
to:
```xml
<ProjectReference Include="..\..\life-api\LifeApi.csproj" />
```

In `apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj`, make the same change.

- [ ] **Step 4: Update AssemblyName in LifeApi.csproj (if set)**

Open `apps/life-api/LifeApi.csproj`. If there is a `<AssemblyName>` element, change it from `FinanceApi` to `LifeApi`. If there is no `<AssemblyName>` element, the assembly name defaults to the project file name (`LifeApi`) automatically — no change needed.

- [ ] **Step 5: Verify build**

```bash
dotnet restore apps/life-api/LifeApi.csproj
dotnet build apps/life-api/LifeApi.csproj --configuration Release
```

Expected: `Build succeeded. 0 Warning(s). 0 Error(s).`

- [ ] **Step 6: Verify unit tests compile and pass**

```bash
dotnet test apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj --configuration Release
```

Expected: All tests pass.

---

### Task 3: Update Dockerfile and docker-compose files

**Files:**
- Modify: `apps/life-api/Dockerfile` — update internal paths referencing old project name
- Modify: `docker-compose.yml` — DB name and dockerfile path
- Modify: `docker-compose.production.yml` — dockerfile path

- [ ] **Step 1: Update the API Dockerfile**

Open `apps/life-api/Dockerfile`. Change:
```dockerfile
COPY apps/finance-api/FinanceApi.csproj .
RUN dotnet restore

COPY apps/finance-api/ .
```
to:
```dockerfile
COPY apps/life-api/LifeApi.csproj .
RUN dotnet restore

COPY apps/life-api/ .
```

Also change the entrypoint:
```dockerfile
ENTRYPOINT ["dotnet", "FinanceApi.dll"]
```
to:
```dockerfile
ENTRYPOINT ["dotnet", "LifeApi.dll"]
```

- [ ] **Step 2: Update docker-compose.yml dev DB name**

In `docker-compose.yml`, change:
```yaml
POSTGRES_DB: finance_manager_dev
```
to:
```yaml
POSTGRES_DB: life_manager_dev
```

- [ ] **Step 3: Update docker-compose.production.yml dockerfile reference**

In `docker-compose.production.yml`, change:
```yaml
dockerfile: apps/finance-api/Dockerfile
```
to:
```yaml
dockerfile: apps/life-api/Dockerfile
```

- [ ] **Step 4: Verify docker-compose syntax**

```bash
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.production.yml config --quiet
```

Expected: No output (silent = valid).

---

### Task 4: Update appsettings connection strings

**Files:**
- Modify: `apps/life-api/appsettings.json`
- Modify: `apps/life-api/appsettings.Development.json`
- Modify: `apps/life-api/appsettings.Uat.json`

- [ ] **Step 1: Update appsettings.json**

Change:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=finance_manager_dev;Username=postgres;Password=password"
```
to:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=life_manager_dev;Username=postgres;Password=password"
```

- [ ] **Step 2: Update appsettings.Development.json**

Same change: `finance_manager_dev` → `life_manager_dev`

- [ ] **Step 3: Update appsettings.Uat.json**

Change:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=finance_manager_uat;..."
```
to:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=life_manager_uat;..."
```

- [ ] **Step 4: Reset the dev database to use the new name**

```powershell
# Stop containers
docker compose down

# Start with new DB name
docker compose up -d postgres

# Run migrations to recreate DB with new name
dotnet ef database update --project apps/life-api/LifeApi.csproj
```

Expected: Migrations apply cleanly to `life_manager_dev`.

---

### Task 5: Update CI/CD workflow paths

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/nightly.yml`

- [ ] **Step 1: Update ci.yml — all `finance-api` path references**

Replace all occurrences of `apps/finance-api/FinanceApi.csproj` with `apps/life-api/LifeApi.csproj`.

Replace all occurrences of:
```
apps/finance-api-tests/FinanceApi.UnitTests/FinanceApi.UnitTests.csproj
```
with:
```
apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj
```

Replace all occurrences of:
```
apps/finance-api-tests/FinanceApi.IntegrationTests/FinanceApi.IntegrationTests.csproj
```
with:
```
apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj
```

- [ ] **Step 2: Update nightly.yml — same replacements**

Apply the same replacements as Step 1 to `.github/workflows/nightly.yml`.

Also update the `dotnet list` vulnerability check from:
```yaml
run: dotnet list "Finance Manager.sln" package --vulnerable --include-transitive
```
to:
```yaml
run: dotnet list "apps/life-api/LifeApi.csproj" package --vulnerable --include-transitive
```

- [ ] **Step 3: Verify YAML syntax**

```bash
# Check both files parse correctly (requires python or yq)
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "ci.yml OK"
python -c "import yaml; yaml.safe_load(open('.github/workflows/nightly.yml'))" && echo "nightly.yml OK"
```

---

### Task 6: Run full local verification and commit

- [ ] **Step 1: Run all tests locally**

```powershell
.\run-tests.ps1
```

Expected: All unit tests pass. Integration tests may still have pre-existing failures (addressed in Phase 2).

- [ ] **Step 2: Verify no remaining `finance-api` references in tracked files**

```bash
git grep -i "finance-api\|finance_api\|FinanceApi\|finance_manager" -- '*.cs' '*.csproj' '*.yml' '*.json' '*.ts' '*.tsx'
```

Expected: Zero matches (excluding git history and `bin/obj` which are gitignored).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: rename finance-api to life-api (WS3)"
```

- [ ] **Step 4: Push and open PR**

```bash
git push origin phase-ws3/rename-finance-to-life
```

Open PR: `phase-ws3/rename-finance-to-life` → `develop`
Title: `refactor: rename finance-api → life-api (WS3)`

---

## Phase 2 — Pipeline Hardening

**Branch:** `phase-ws4/pipeline-hardening`
*(Branch from `develop` after Phase 1 PR is merged)*

### Task 7: Diagnose and fix integration test failures

**Files:**
- Modify: `apps/life-api-tests/LifeApi.IntegrationTests/Helpers/CustomWebApplicationFactory.cs`
- Modify: `apps/life-api/appsettings.json` (add `Jwt:Issuer` and `Jwt:Audience`)

- [ ] **Step 1: Run integration tests locally and capture failures**

```bash
dotnet test apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj \
  --configuration Release --logger "console;verbosity=detailed" 2>&1 | head -100
```

Note the exact failure messages. The most likely cause: `ValidateIssuer = true` in `Program.cs` JWT setup but `Jwt:Issuer` is not set in `appsettings.json`, causing token validation to fail on any authenticated endpoint.

- [ ] **Step 2: Add Jwt:Issuer and Jwt:Audience to appsettings.json**

In `apps/life-api/appsettings.json`, add to the `Jwt` section:
```json
"Jwt": {
  "Secret": "your-secret-key-change-in-production",
  "ExpiresIn": "1h",
  "Issuer": "life-manager-dev",
  "Audience": "life-manager-dev"
}
```

In `apps/life-api/appsettings.Uat.json`, add:
```json
"Jwt": {
  "Secret": "CHANGE_ME_USE_ENVIRONMENT_VARIABLE",
  "Issuer": "https://life-manager",
  "Audience": "https://life-manager"
}
```

- [ ] **Step 3: Update CustomWebApplicationFactory to provide JWT config**

Replace the contents of `CustomWebApplicationFactory.cs`:

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using LifeApi.Data;

namespace LifeApi.IntegrationTests.Helpers;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "test-secret-key-minimum-32-characters-long",
                ["Jwt:Issuer"] = "life-manager-test",
                ["Jwt:Audience"] = "life-manager-test",
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FinanceDbContext>));

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<FinanceDbContext>(options =>
            {
                options.UseInMemoryDatabase($"InMemoryTestDb_{Guid.NewGuid()}");
            });

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
```

Note: Using a unique DB name per factory instance (`Guid.NewGuid()`) prevents test pollution between parallel test runs.

- [ ] **Step 4: Run integration tests again**

```bash
dotnet test apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj \
  --configuration Release --logger "console;verbosity=normal"
```

Expected: All 25 previously failing tests now pass. If new failures appear, investigate each one — do not proceed until all pass.

- [ ] **Step 5: Run unit tests to confirm no regression**

```bash
dotnet test apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj --configuration Release
```

Expected: All pass.

---

### Task 8: Remove `continue-on-error` from CI and add compose validation

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Remove `continue-on-error` from integration test step**

In `.github/workflows/ci.yml`, find the integration test step:
```yaml
      - name: Run integration tests
        continue-on-error: true  # Integration tests require service fixes tracked separately
        run: >
```

Remove the `continue-on-error: true` line:
```yaml
      - name: Run integration tests
        run: >
```

- [ ] **Step 2: Add compose validation step to the build job**

In the `build` job in `.github/workflows/ci.yml`, add this step after the "Install dependencies" step and before "Restore .NET dependencies":

```yaml
      - name: Validate production compose file
        run: docker compose -f docker-compose.production.yml config --quiet
```

- [ ] **Step 3: Commit**

```bash
git add apps/life-api/appsettings.json \
        apps/life-api/appsettings.Uat.json \
        "apps/life-api-tests/LifeApi.IntegrationTests/Helpers/CustomWebApplicationFactory.cs" \
        .github/workflows/ci.yml
git commit -m "fix: repair integration test factory and gate CI on integration tests"
```

- [ ] **Step 4: Push and open PR**

```bash
git push origin phase-ws4/pipeline-hardening
```

Open PR: `phase-ws4/pipeline-hardening` → `develop`
Title: `fix: integration test factory repair + CI pipeline hardening`

---

## Phase 3 — Security Audit & Fixes

**Branch:** `phase-ws4/security-hardening`
*(Branch from `develop` after Phase 2 PR is merged)*

### Task 9: Fix JWT access token expiry

**Files:**
- Modify: `apps/life-api/Features/Auth/Services/TokenService.cs`

**Issue:** Access token is hardcoded to expire in 1 hour (`AddHours(1)`). Best practice is ≤ 15 minutes for access tokens; the long session is maintained by the refresh token.

- [ ] **Step 1: Update token expiry in TokenService.cs**

In `apps/life-api/Features/Auth/Services/TokenService.cs`, change:
```csharp
expires: DateTime.UtcNow.AddHours(1),
```
to:
```csharp
expires: DateTime.UtcNow.AddMinutes(15),
```

- [ ] **Step 2: Run all tests**

```bash
dotnet test apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj --configuration Release
dotnet test apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj --configuration Release
```

Expected: All pass. If any tests assert a specific token expiry value, update them to match 15 minutes.

---

### Task 10: Fix refresh token generation

**Files:**
- Modify: `apps/life-api/Features/Auth/Services/TokenService.cs`

**Issue:** Refresh token is generated as two concatenated GUIDs (`Guid.NewGuid().ToString() + Guid.NewGuid().ToString()`). GUIDs are not cryptographically random — `System.Security.Cryptography.RandomNumberGenerator` must be used instead.

- [ ] **Step 1: Update GenerateRefreshToken in TokenService.cs**

Replace:
```csharp
public string GenerateRefreshToken()
{
    return Guid.NewGuid().ToString() + Guid.NewGuid().ToString();
}
```

With:
```csharp
public string GenerateRefreshToken()
{
    var bytes = new byte[64];
    System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
    return Convert.ToBase64String(bytes);
}
```

- [ ] **Step 2: Check if refresh tokens are stored hashed or plaintext**

Search for where refresh tokens are stored:
```bash
grep -n "RefreshToken\|refreshToken" apps/life-api/Features/Auth/Services/AuthService.cs
```

If the token is stored as-is in the DB (plaintext), it must be hashed before storage and compared via hash during validation. Check the `UserSession` model:

```bash
grep -n "RefreshToken\|Token" apps/life-api/Data/FinanceDbContext.cs
grep -rn "RefreshToken" apps/life-api/Features/ --include="*.cs" | grep -v "\.cs:.*//\|DTOs"
```

- [ ] **Step 3: If refresh tokens are stored plaintext — hash them**

If `AuthService` stores the token string directly into the DB, update it to store a SHA-256 hash instead. In `apps/life-api/Features/Auth/Services/AuthService.cs`:

Find where `RefreshToken` is assigned on the `UserSession` entity. Change from:
```csharp
RefreshToken = refreshToken,
```
to:
```csharp
RefreshTokenHash = HashToken(refreshToken),
```

Add a private helper:
```csharp
private static string HashToken(string token)
{
    var bytes = System.Security.Cryptography.SHA256.HashData(
        System.Text.Encoding.UTF8.GetBytes(token));
    return Convert.ToBase64String(bytes);
}
```

Update the refresh token validation lookup to hash the incoming token before DB lookup:
```csharp
var tokenHash = HashToken(request.RefreshToken);
var session = await _context.UserSessions
    .FirstOrDefaultAsync(s => s.RefreshTokenHash == tokenHash && s.IsActive);
```

Update the `UserSession` model property name to `RefreshTokenHash` and add a migration:
```bash
dotnet ef migrations add HashRefreshTokens --project apps/life-api/LifeApi.csproj
dotnet ef database update --project apps/life-api/LifeApi.csproj
```

*(If refresh tokens are already hashed, skip this step and note it as passed.)*

- [ ] **Step 4: Run all tests**

```bash
dotnet test apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj --configuration Release
dotnet test apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj --configuration Release
```

Expected: All pass.

---

### Task 11: Security header and CORS audit

**Files:**
- Modify: `apps/life-api/Middleware/SecurityHeadersMiddleware.cs` (if issues found)
- Modify: `apps/life-api/appsettings.json` (CORS — if issues found)

- [ ] **Step 1: Verify HSTS header is present in production mode**

Open `apps/life-api/Middleware/SecurityHeadersMiddleware.cs` and check if `Strict-Transport-Security` is added. If it is only added in production mode, confirm the condition is correct. If it is missing entirely, add it:

```csharp
// Add inside InvokeAsync, after other headers, for non-development environments:
if (!_env.IsDevelopment())
{
    context.Response.Headers["Strict-Transport-Security"] =
        "max-age=31536000; includeSubDomains";
}
```

- [ ] **Step 2: Verify CORS does not allow wildcard origins**

In `apps/life-api/appsettings.json`, the `Cors:AllowedOrigins` array should list explicit origins only. Check `Program.cs` CORS setup:

```bash
grep -n -A 20 "AddCors\|UseCors\|AllowedOrigins" apps/life-api/Program.cs
```

Confirm there is no `AllowAnyOrigin()` call. If found, replace with the configured origins from `Cors:AllowedOrigins`.

- [ ] **Step 3: Update production CORS origins in appsettings**

In `apps/life-api/appsettings.json`, update the `Cors:AllowedOrigins` to include the LAN hostname:
```json
"Cors": {
  "AllowedOrigins": [
    "https://localhost",
    "https://localhost:5173",
    "http://localhost:5173",
    "https://life-manager"
  ]
}
```

- [ ] **Step 4: Verify no secrets in git history**

```bash
git log --all --full-history -S "password" -- "*.json" | grep -v "appsettings.Development\|appsettings.json" | head -20
git log --all --full-history -S "secret" -- "*.json" | head -20
```

If any real secrets are found in history, they must be rotated. For this personal project, confirm the only values in history are placeholder strings (`CHANGE_ME_*`, `your-secret-key-*`).

- [ ] **Step 5: Verify Docker containers don't run as root**

Check the API Dockerfile — confirm it has a non-root user. If missing, add:
```dockerfile
# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "LifeApi.dll"]
```

- [ ] **Step 6: Run all tests**

```bash
dotnet test apps/life-api-tests/LifeApi.UnitTests/LifeApi.UnitTests.csproj --configuration Release
dotnet test apps/life-api-tests/LifeApi.IntegrationTests/LifeApi.IntegrationTests.csproj --configuration Release
pnpm --filter @life-manager/web test --passWithNoTests
```

Expected: All pass.

- [ ] **Step 7: Commit security fixes**

```bash
git add apps/life-api/Features/Auth/Services/TokenService.cs \
        apps/life-api/Features/Auth/Services/AuthService.cs \
        apps/life-api/Middleware/SecurityHeadersMiddleware.cs \
        apps/life-api/appsettings.json \
        apps/life-api/Dockerfile
git commit -m "fix: security hardening — token expiry, refresh token hashing, HSTS, non-root container"
```

- [ ] **Step 8: Push and open PR**

```bash
git push origin phase-ws4/security-hardening
```

Open PR: `phase-ws4/security-hardening` → `develop`
Title: `fix: security hardening — JWT expiry, refresh token crypto, HSTS, non-root Docker`

---

## Phase 4 — LAN Deployment Setup

**Branch:** `phase-ws4/lan-deployment`
*(Branch from `develop` after Phase 3 PR is merged)*

### Task 12: Update .env.production.example for LAN

**Files:**
- Modify: `.env.production.example`

- [ ] **Step 1: Add JWT Issuer and Audience to env example**

In `.env.production.example`, add after `JWT_SECRET`:
```bash
# Must match the hostname used in the browser
JWT_ISSUER=https://life-manager
JWT_AUDIENCE=https://life-manager
```

- [ ] **Step 2: Add the FRONTEND_ORIGIN LAN example**

Ensure the LAN example is uncommented with clear instructions:
```bash
# For LAN access from other devices using a custom hostname:
VITE_API_URL=https://life-manager
FRONTEND_ORIGIN=https://life-manager
```

- [ ] **Step 3: Update docker-compose.production.yml to pass JWT Issuer/Audience**

In `docker-compose.production.yml`, in the `api` service `environment` section, add:
```yaml
      Jwt__Issuer: ${JWT_ISSUER:-https://life-manager}
      Jwt__Audience: ${JWT_AUDIENCE:-https://life-manager}
```

- [ ] **Step 4: Verify compose file is still valid**

```bash
docker compose -f docker-compose.production.yml config --quiet
```

---

### Task 13: Create HTTPS setup guide

**Files:**
- Create: `docs/guides/HTTPS-SETUP.md`

*(The production compose already references this file in its comments.)*

- [ ] **Step 1: Create the guide**

Create `docs/guides/HTTPS-SETUP.md` with the following content:

```markdown
# HTTPS Setup — Life Manager (LAN)

This guide creates locally-trusted TLS certificates for `https://life-manager`
on your local network using mkcert.

## Prerequisites

Install mkcert (one-time per machine):
```powershell
winget install FiloSottile.mkcert
# or: choco install mkcert
```

## Step 1: Install the local CA (one-time per machine)

```powershell
mkcert -install
```

This installs a local Certificate Authority into your Windows trust store.
Browsers on this machine will trust certificates signed by this CA.

## Step 2: Find your LAN IP address

```powershell
ipconfig | findstr "IPv4"
```

Note the IP address (e.g. `192.168.1.100`).

## Step 3: Generate the certificate

From the project root:

```powershell
# Create certs directory if it doesn't exist
New-Item -ItemType Directory -Force -Path certs

# Generate cert — replace 192.168.1.100 with your actual LAN IP
mkcert -cert-file certs/life-manager.pem -key-file certs/life-manager-key.pem `
  life-manager 192.168.1.100 localhost 127.0.0.1
```

The `certs/` directory is gitignored. Never commit certificate files.

## Step 4: Add hosts file entries

**This machine** — open PowerShell as Administrator:
```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 life-manager"
```

**Other LAN devices** — add to each device's hosts file (replace with your actual LAN IP):
```
192.168.1.100   life-manager
```

## Step 5: Trust the CA on other LAN devices (optional)

Other devices will see a certificate warning unless the mkcert CA is installed.

Export the CA certificate:
```powershell
$caRoot = mkcert -CAROOT
Write-Host "CA root: $caRoot"
```

Copy `rootCA.pem` from that directory to the other device and install it in
the device's trusted root certificate store.

For personal LAN use, bypassing the browser warning (Advanced → Proceed) is acceptable.

## Verify

After starting the app (`docker compose -f docker-compose.production.yml up -d`),
open `https://life-manager` in a browser. You should see the app without a TLS warning.
```

- [ ] **Step 2: Commit the guide**

```bash
git add docs/guides/HTTPS-SETUP.md .env.production.example docker-compose.production.yml
git commit -m "docs: HTTPS setup guide and production env JWT issuer/audience"
```

---

### Task 14: Register the self-hosted GitHub Actions runner

**Files:**
- Read: `docs/guides/SELF-HOSTED-RUNNER.md`

This task is manual — no code changes. The plan documents the steps.

- [ ] **Step 1: Generate a runner registration token**

In GitHub: `jaevans36/finance-manager` → Settings → Actions → Runners → "New self-hosted runner"

Select: Windows, x64.

Copy the `--token` value from the `Configure` section.

- [ ] **Step 2: Follow the existing setup guide**

Open `docs/guides/SELF-HOSTED-RUNNER.md` and follow it to download and configure the runner.

When prompted for labels, use:
```
self-hosted,windows,uat
```

- [ ] **Step 3: Install the runner as a Windows service**

From the runner directory in PowerShell (as Administrator):
```powershell
.\svc.ps1 install
.\svc.ps1 start
```

- [ ] **Step 4: Verify runner is online**

In GitHub: Settings → Actions → Runners. The runner should show status **Idle**.

---

### Task 15: Create .env.production and first deployment

This task is manual — no code changes. Documents the live deployment steps.

- [ ] **Step 1: Copy and fill in .env.production**

```powershell
Copy-Item .env.production.example .env.production
```

Open `.env.production` in a text editor and fill in:

- `DB_PASSWORD` — generate with:
  ```powershell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
  ```
- `JWT_SECRET` — generate with:
  ```powershell
  [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
  ```
- `VITE_API_URL=https://life-manager`
- `FRONTEND_ORIGIN=https://life-manager`
- `JWT_ISSUER=https://life-manager`
- `JWT_AUDIENCE=https://life-manager`

- [ ] **Step 2: Generate certificates (if not done)**

Follow `docs/guides/HTTPS-SETUP.md` Steps 1–4.

- [ ] **Step 3: First deploy**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

- [ ] **Step 4: Check container health**

```powershell
docker compose -f docker-compose.production.yml ps
```

Expected: All containers show `healthy` or `running`.

- [ ] **Step 5: Health check**

```powershell
Invoke-WebRequest -Uri "https://life-manager/api/health" -UseBasicParsing
```

Expected: `StatusCode: 200`

- [ ] **Step 6: Open the app**

Navigate to `https://life-manager` in a browser. Register an account and confirm the app works end-to-end.

- [ ] **Step 7: Commit the deployment docs update and open PR**

```bash
git add docs/guides/HTTPS-SETUP.md
git commit -m "docs: add HTTPS setup guide and LAN deployment steps"
git push origin phase-ws4/lan-deployment
```

Open PR: `phase-ws4/lan-deployment` → `develop`
Title: `docs: LAN deployment — HTTPS setup guide, env example, production JWT config`

---

## Phase 5 — v1.0.0 Release

*(After all four phase PRs are merged to `develop` and UAT is verified)*

### Task 16: Merge develop → main and tag v1.0.0

- [ ] **Step 1: Verify UAT is green**

Check `https://life-manager` is running and all features work.

- [ ] **Step 2: Open release PR**

```bash
gh pr create --base main --head develop \
  --title "release: v1.0.0 — Life Manager MVP" \
  --body "MVP-complete. Renamed finance-api → life-api, pipeline hardened, security audit complete, LAN deployment live."
```

- [ ] **Step 3: Merge PR and tag**

After PR is approved and merged:
```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0 — Life Manager MVP"
git push origin v1.0.0
```

- [ ] **Step 4: Update CURRENT_STATE.md**

In `docs/CURRENT_STATE.md`, update "What Is Currently Being Built" to reflect v1.0.0 is live on LAN.

```bash
git add docs/CURRENT_STATE.md
git commit -m "docs: update CURRENT_STATE for v1.0.0 LAN release"
git push origin main
```

---

## Self-review notes

**Spec coverage check:**
- WS3 rename (Section 1) → Tasks 1–6 ✓
- Integration test fix (Section 2) → Task 7 ✓
- `continue-on-error` removal + compose validation (Section 2) → Task 8 ✓
- JWT expiry fix (Section 3) → Task 9 ✓
- Refresh token crypto (Section 3) → Task 10 ✓
- Security headers / CORS / secrets / non-root container (Section 3) → Task 11 ✓
- `.env.production.example` + JWT issuer/audience (Section 4) → Task 12 ✓
- HTTPS setup guide / mkcert / hosts (Section 4) → Task 13 ✓
- Self-hosted runner (Section 4) → Task 14 ✓
- First deployment (Section 4) → Task 15 ✓
- Release PR + v1.0.0 tag → Task 16 ✓

**Pre-existing state that affects the plan:**
- `docker-compose.production.yml` already exists and is well-structured — Task 12 adds JWT env vars, Task 8 adds CI validation; no full rewrite needed
- `apps/web/nginx.conf` already exists and is correctly configured — no changes needed
- `apps/web/Dockerfile` already exists — no changes needed
- `apps/finance-api/Dockerfile` exists but must be updated during rename (Task 3)
- `.env.production.example` exists — Task 12 extends it
- `docs/guides/HTTPS-SETUP.md` is referenced in compose comments but does not exist — Task 13 creates it

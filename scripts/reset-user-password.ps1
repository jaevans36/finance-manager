# Resets a user's password directly in the local dev database.
# Requires Docker to be running with the life-manager-db container healthy.
#
# Usage: .\scripts\reset-user-password.ps1 -Email you@example.com -NewPassword "NewPass1!"

param(
    [Parameter(Mandatory)][string]$Email,
    [Parameter(Mandatory)][string]$NewPassword
)

$ErrorActionPreference = "Stop"

# ── Validate password requirements ───────────────────────────────────────────
if ($NewPassword.Length -lt 8)          { Write-Host "[X] Minimum 8 characters." -ForegroundColor Red; exit 1 }
if ($NewPassword -notmatch '[A-Z]')     { Write-Host "[X] Needs an uppercase letter." -ForegroundColor Red; exit 1 }
if ($NewPassword -notmatch '[0-9]')     { Write-Host "[X] Needs a digit." -ForegroundColor Red; exit 1 }

# ── Check Docker container is running ────────────────────────────────────────
$running = docker ps --filter "name=life-manager-db" --filter "status=running" --format "{{.Names}}" 2>$null
if ($running -ne "life-manager-db") {
    Write-Host "[X] life-manager-db container is not running. Start it with: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# ── Generate BCrypt hash (cost 12, matching the app) ─────────────────────────
$t = Join-Path $env:TEMP "lm-pwd-reset"
if (Test-Path $t) { Remove-Item $t -Recurse -Force }
New-Item -ItemType Directory -Path $t | Out-Null

[System.IO.File]::WriteAllText("$t\Program.cs", @"
using System;
using BCrypt.Net;
Console.Write(BCrypt.Net.BCrypt.HashPassword(args[0], BCrypt.Net.BCrypt.GenerateSalt(12)));
"@)

[System.IO.File]::WriteAllText("$t\hasher.csproj", @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
  </ItemGroup>
</Project>
"@)

Write-Host "Generating password hash..." -ForegroundColor Yellow
$hash = (dotnet run --project $t -- $NewPassword 2>$null).Trim()
Remove-Item $t -Recurse -Force

if ($hash.Length -lt 20) {
    Write-Host "[X] Hash generation failed. Is the .NET 8 SDK installed?" -ForegroundColor Red
    exit 1
}

# ── Update the database ───────────────────────────────────────────────────────
Write-Host "Updating password for $Email..." -ForegroundColor Yellow

$h = $hash  -replace "'", "''"
$e = $Email -replace "'", "''"
$sql = "UPDATE users SET password_hash='$h', failed_login_attempts=0, account_locked_until=NULL, updated_at=NOW() WHERE email='$e' RETURNING email, username;"

$result = (docker exec -e PGPASSWORD=password life-manager-db psql -U postgres -d life_manager_dev -c $sql 2>&1) | Out-String

if (-not $result.Contains("1 row")) {
    Write-Host "[!] No user found with email '$Email'." -ForegroundColor Yellow
    Write-Host $result
    exit 1
}

Write-Host ""
Write-Host "[OK] Password updated." -ForegroundColor Green
Write-Host "     Email:    $Email" -ForegroundColor Cyan
Write-Host "     Password: $NewPassword" -ForegroundColor Cyan

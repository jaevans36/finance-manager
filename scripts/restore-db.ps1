# Life Manager - Database Restore Script
# Restores a pg_dump backup file into PostgreSQL
# Usage: .\restore-db.ps1 -BackupFile ".\backups\life-manager-2026-03-08_12-00-00.sql"
# WARNING: This will DROP and recreate the target database. All existing data will be lost.

param(
    [Parameter(Mandatory)]
    [string]$BackupFile,
    [string]$Database = "finance_manager_dev",
    [string]$Host = "localhost",
    [string]$Port = "5432",
    [string]$Username = "postgres"
)

Set-Location "C:\Projects\Finance Manager"

Write-Host "Life Manager - Database Restore" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup file : $BackupFile" -ForegroundColor Yellow
Write-Host "Target DB   : $Database on $Host`:$Port" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: This will drop and recreate '$Database'. All existing data will be lost." -ForegroundColor Red
Write-Host ""

if (-not (Test-Path $BackupFile)) {
    Write-Host "[X] Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

$confirm = Read-Host "Type 'yes' to confirm restore"
if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

$pgRestore = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgRestore) {
    Write-Host "[X] psql not found. Install PostgreSQL client tools or add them to PATH." -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = Read-Host "PostgreSQL password (leave blank for default 'password')" -MaskInput
if ([string]::IsNullOrEmpty($env:PGPASSWORD)) { $env:PGPASSWORD = "password" }

Write-Host ""
Write-Host "Dropping and recreating database '$Database'..." -ForegroundColor Yellow

psql -h $Host -p $Port -U $Username -d postgres -c "DROP DATABASE IF EXISTS `"$Database`";"
psql -h $Host -p $Port -U $Username -d postgres -c "CREATE DATABASE `"$Database`";"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to recreate database." -ForegroundColor Red
    $env:PGPASSWORD = ""
    exit 1
}

Write-Host "Restoring from backup..." -ForegroundColor Yellow
psql -h $Host -p $Port -U $Username -d $Database -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Restore complete. Database '$Database' has been restored from:" -ForegroundColor Green
    Write-Host "     $BackupFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Restart the API to pick up the restored data:" -ForegroundColor Cyan
    Write-Host "  .\restart-dev.ps1" -ForegroundColor Gray
} else {
    Write-Host "[X] Restore failed. Check the error above." -ForegroundColor Red
    $env:PGPASSWORD = ""
    exit 1
}

$env:PGPASSWORD = ""

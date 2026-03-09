# Life Manager - Database Backup Script
# Creates a date-stamped pg_dump backup of the PostgreSQL database
# Usage: .\backup-db.ps1 [-Database "finance_manager_dev"] [-OutputDir ".\backups"]

param(
    [string]$Database = "finance_manager_dev",
    [string]$Host = "localhost",
    [string]$Port = "5432",
    [string]$Username = "postgres",
    [string]$OutputDir = ".\backups"
)

Set-Location "C:\Projects\Finance Manager"

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = Join-Path $OutputDir "life-manager-$timestamp.sql"

Write-Host "Life Manager - Database Backup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database : $Database" -ForegroundColor Yellow
Write-Host "Host     : $Host`:$Port" -ForegroundColor Yellow
Write-Host "Output   : $backupFile" -ForegroundColor Yellow
Write-Host ""

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "[OK] Created backup directory: $OutputDir" -ForegroundColor Green
}

# Check that pg_dump is available
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Host "[X] pg_dump not found. Install PostgreSQL client tools or add them to PATH." -ForegroundColor Red
    Write-Host "    Alternatively, run backup inside the Docker container:" -ForegroundColor Yellow
    Write-Host "    docker exec life-manager-db pg_dump -U postgres $Database > $backupFile" -ForegroundColor Gray
    exit 1
}

Write-Host "Running pg_dump..." -ForegroundColor Yellow

$env:PGPASSWORD = Read-Host "PostgreSQL password (leave blank for default 'password')" -MaskInput
if ([string]::IsNullOrEmpty($env:PGPASSWORD)) { $env:PGPASSWORD = "password" }

pg_dump -h $Host -p $Port -U $Username -d $Database -F p -f $backupFile

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $backupFile).Length / 1KB
    Write-Host ""
    Write-Host "[OK] Backup complete: $backupFile ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "To restore this backup, run:" -ForegroundColor Cyan
    Write-Host "  .\restore-db.ps1 -BackupFile `"$backupFile`"" -ForegroundColor Gray
} else {
    Write-Host "[X] Backup failed. Check the error above." -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = ""

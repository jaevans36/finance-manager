# Registers a Windows Scheduled Task that runs backup-db.ps1 daily.
# Safe to re-run — updates the task if it already exists.
#
# Usage:
#   .\scripts\setup-backup-schedule.ps1              # daily at 02:00
#   .\scripts\setup-backup-schedule.ps1 -Time 23:00  # daily at 23:00
#   .\scripts\setup-backup-schedule.ps1 -Remove       # remove the schedule

param(
    [string]$Time   = "02:00",
    [switch]$Remove
)

$TaskName   = "LifeManagerDailyBackup"
$ScriptPath = Join-Path $PSScriptRoot "backup-db.ps1"

if (-not (Test-Path $ScriptPath)) {
    Write-Host "[X] Script not found: $ScriptPath" -ForegroundColor Red
    exit 1
}

# ── Remove existing task ──────────────────────────────────────────────────────
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Remove) {
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "[OK] Scheduled task '$TaskName' removed." -ForegroundColor Green
    } else {
        Write-Host "No task named '$TaskName' found — nothing to remove." -ForegroundColor Yellow
    }
    exit 0
}

# ── Parse time ────────────────────────────────────────────────────────────────
$parts = $Time.Split(':')
if ($parts.Count -ne 2) {
    Write-Host "[X] Invalid time format '$Time'. Use HH:MM (e.g. 02:00)." -ForegroundColor Red
    exit 1
}
$hour   = [int]$parts[0]
$minute = [int]$parts[1]
$runAt  = (Get-Date).Date.AddHours($hour).AddMinutes($minute)

# ── Build task components ─────────────────────────────────────────────────────
$trigger = New-ScheduledTaskTrigger -Daily -At $runAt

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -MultipleInstances IgnoreNew

# ── Register ──────────────────────────────────────────────────────────────────
Register-ScheduledTask `
    -TaskName $TaskName `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -RunLevel Limited `
    -Force | Out-Null

Write-Host "[OK] Daily backup scheduled: $TaskName at $Time" -ForegroundColor Green
Write-Host ""

# ── Show summary ──────────────────────────────────────────────────────────────
$task = Get-ScheduledTask -TaskName $TaskName
Write-Host "Task name  : $TaskName" -ForegroundColor Cyan
Write-Host "Runs at    : $Time daily" -ForegroundColor Cyan
Write-Host "Script     : $ScriptPath" -ForegroundColor Cyan
Write-Host "Backups to : $env:USERPROFILE\life-manager-backups\" -ForegroundColor Cyan
Write-Host ""
Write-Host "The task runs even if you missed the scheduled time (StartWhenAvailable)." -ForegroundColor Gray
Write-Host "To test it now: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "To view log:    Get-Content `"$env:USERPROFILE\life-manager-backups\backup.log`"" -ForegroundColor Gray
Write-Host "To remove:      .\scripts\setup-backup-schedule.ps1 -Remove" -ForegroundColor Gray

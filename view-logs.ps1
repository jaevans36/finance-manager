# Log Viewer and Search Utility for Finance Manager

param(
    [Parameter(Mandatory=$false)]
    [string]$LogType = "application", # application, error, http
    
    [Parameter(Mandatory=$false)]
    [string]$Search = "",
    
    [Parameter(Mandatory=$false)]
    [int]$Lines = 50,
    
    [Parameter(Mandatory=$false)]
    [switch]$Follow,
    
    [Parameter(Mandatory=$false)]
    [switch]$Today
)

$logsDir = "C:\Projects\Finance Manager\apps\api\logs"
$today = Get-Date -Format "yyyy-MM-dd"

# Determine which log file to view
$logPattern = switch ($LogType) {
    "application" { "application-*.log" }
    "error" { "error-*.log" }
    "http" { "http-*.log" }
    default { "application-*.log" }
}

# Find the appropriate log file
if ($Today) {
    $logFile = Get-ChildItem -Path $logsDir -Filter "*$today*" | Where-Object { $_.Name -like $logPattern } | Select-Object -First 1
} else {
    $logFile = Get-ChildItem -Path $logsDir -Filter $logPattern | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

if (-not $logFile) {
    Write-Host "No log files found matching pattern: $logPattern" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Viewing: $($logFile.Name)" -ForegroundColor Cyan
Write-Host "📁 Location: $($logFile.FullName)" -ForegroundColor Gray
Write-Host ""

# View logs
if ($Follow) {
    Write-Host "👀 Following log file (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    
    if ($Search) {
        Get-Content -Path $logFile.FullName -Tail $Lines -Wait | Select-String -Pattern $Search
    } else {
        Get-Content -Path $logFile.FullName -Tail $Lines -Wait
    }
} else {
    if ($Search) {
        Write-Host "🔍 Searching for: '$Search'" -ForegroundColor Yellow
        Write-Host ""
        $results = Get-Content -Path $logFile.FullName | Select-String -Pattern $Search -Context 2
        
        if ($results.Count -eq 0) {
            Write-Host "No matches found for '$Search'" -ForegroundColor Yellow
        } else {
            $results | ForEach-Object {
                Write-Host "Match found:" -ForegroundColor Green
                Write-Host $_.Line -ForegroundColor White
                Write-Host ""
            }
            Write-Host "Total matches: $($results.Count)" -ForegroundColor Cyan
        }
    } else {
        Get-Content -Path $logFile.FullName -Tail $Lines
    }
}

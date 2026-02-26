#!/usr/bin/env pwsh
# Create test data for the weekly progress dashboard

$API_URL = "http://localhost:5000/api/v1"

Write-Host "Creating test data for weekly progress dashboard..." -ForegroundColor Cyan
Write-Host ""

# Prompt for credentials
Write-Host "Please enter your login credentials:" -ForegroundColor Yellow
$emailOrUsername = Read-Host "Email or Username"
$password = Read-Host "Password" -AsSecureString
$passwordPlainText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Login
Write-Host "`nLogging in..." -ForegroundColor Cyan
$loginBody = @{
    emailOrUsername = $emailOrUsername
    password = $passwordPlainText
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "[OK] Login successful" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Get task groups
Write-Host "`nFetching task groups..." -ForegroundColor Cyan
try {
    $groups = Invoke-RestMethod -Uri "$API_URL/task-groups" -Method Get -Headers $headers
    Write-Host "[OK] Found $($groups.Count) task group(s)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to fetch groups: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Use first group or default
$groupId = if ($groups.Count -gt 0) { $groups[0].id } else { $null }

# Define priorities
$priorities = @("Low", "Medium", "High", "Critical")

# Get current week start (Monday)
$today = Get-Date
$dayOfWeek = [int]$today.DayOfWeek
$daysToMonday = if ($dayOfWeek -eq 0) { 6 } else { $dayOfWeek - 1 }
$weekStart = $today.AddDays(-$daysToMonday).Date

Write-Host "`nCreating tasks for week starting $($weekStart.ToString('yyyy-MM-dd'))..." -ForegroundColor Cyan
Write-Host ""

$tasksCreated = 0
$tasksFailed = 0

# Create 3-5 tasks for each day of the week
for ($day = 0; $day -lt 7; $day++) {
    $currentDate = $weekStart.AddDays($day)
    $dayName = $currentDate.ToString('dddd')
    $taskCount = Get-Random -Minimum 3 -Maximum 6
    
    Write-Host "  $dayName ($($currentDate.ToString('yyyy-MM-dd'))) - Creating $taskCount tasks..." -ForegroundColor Yellow
    
    $taskTemplates = @(
        "Review weekly report"
        "Complete project documentation"
        "Team meeting preparation"
        "Code review for PR #$day"
        "Update test cases"
        "Client email follow-up"
        "Database optimization task"
        "Design mockup review"
        "Bug fix: Issue #$day$day"
        "Performance testing"
        "Security audit"
        "Deploy to staging"
        "Write technical spec"
        "Refactor authentication module"
        "Update dependencies"
    )
    
    for ($i = 0; $i -lt $taskCount; $i++) {
        $priority = $priorities | Get-Random
        $template = $taskTemplates | Get-Random
        $taskTitle = "$template - $dayName"
        
        # 60% chance to mark as completed
        $completed = (Get-Random -Minimum 0 -Maximum 100) -lt 60
        
        $taskBody = @{
            title = $taskTitle
            description = "This is a test task created for $dayName. Priority: $priority"
            priority = $priority
            dueDate = $currentDate.ToString("yyyy-MM-ddT12:00:00Z")
            completed = $completed
        }
        
        if ($groupId) {
            $taskBody.groupId = $groupId
        }
        
        try {
            $taskJson = $taskBody | ConvertTo-Json
            $null = Invoke-RestMethod -Uri "$API_URL/tasks" -Method Post -Body $taskJson -Headers $headers
            $tasksCreated++
            $status = if ($completed) { "[X]" } else { "[ ]" }
            Write-Host "    $status Created: $taskTitle [$priority]" -ForegroundColor $(if ($completed) { "Green" } else { "Gray" })
        } catch {
            $tasksFailed++
            Write-Host "    [!] Failed: $taskTitle - $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Small delay to avoid overwhelming the API
        Start-Sleep -Milliseconds 100
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Tasks created: $tasksCreated" -ForegroundColor Green
Write-Host "  Tasks failed:  $tasksFailed" -ForegroundColor $(if ($tasksFailed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test data creation complete!" -ForegroundColor Green
Write-Host "Navigate to http://localhost:5173/weekly-progress to view your data." -ForegroundColor Yellow

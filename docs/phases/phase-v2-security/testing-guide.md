# Phase 1 Manual Testing Script

This script provides manual tests for Phase 1 security features.

## Prerequisites
- API server running on http://localhost:3000
- PostgreSQL database running
- Valid user account for testing

## Test 1: Password Reset Flow

### Step 1: Request Password Reset
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/password-reset/request" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"your-test-email@example.com"}'
```

**Expected Response:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### Step 2: Check Logs for Token (Development Only)
Check `apps/api/logs/application-*.log` for the reset token or use Ethereal test inbox.

### Step 3: Reset Password
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/password-reset/reset" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"token":"YOUR_TOKEN_HERE","newPassword":"NewSecure123!"}'
```

**Expected Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

---

## Test 2: Registration with Email Verification

### Step 1: Register New User
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"newuser@example.com","password":"SecurePass123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {...},
    "sessionToken": "...",
    "emailVerificationSent": true
  }
}
```

---

## Test 3: Session Management

### Step 1: Login and Get Token
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"yourpassword"}'

$token = $response.data.accessToken
```

### Step 2: List Sessions
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/sessions" `
  -Method Get `
  -Headers @{Authorization="Bearer $token"}
```

**Expected Response:**
```json
{
  "sessions": [
    {
      "id": "...",
      "ipAddress": "127.0.0.1",
      "userAgent": "...",
      "lastActiveAt": "2025-11-19T...",
      "createdAt": "2025-11-19T...",
      "isCurrent": true
    }
  ],
  "count": 1
}
```

### Step 3: Terminate All Other Sessions
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/sessions/terminate-others" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"}
```

---

## Test 4: Activity Logs

### Step 1: Get Activity Logs
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/activity-logs?page=1&limit=10" `
  -Method Get `
  -Headers @{Authorization="Bearer $token"}
```

**Expected Response:**
```json
{
  "logs": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 5,
    "itemsPerPage": 10
  }
}
```

### Step 2: Get Activity Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/activity-logs/summary?days=30" `
  -Method Get `
  -Headers @{Authorization="Bearer $token"}
```

### Step 3: Get Security Events
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/activity-logs/security?limit=5" `
  -Method Get `
  -Headers @{Authorization="Bearer $token"}
```

---

## Test 5: Account Lockout

### Step 1: Failed Login Attempts
Run this 5 times with wrong password:
```powershell
try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"email":"test@example.com","password":"wrongpassword"}'
} catch {
  Write-Host "Attempt failed (expected): $($_.Exception.Message)"
}
```

### Step 2: Verify Account Lockout
After 5 attempts, you should receive:
```json
{
  "error": "Account is locked due to too many failed login attempts. Try again in 30 minutes."
}
```

HTTP Status: 423 (Locked)

### Step 3: Check Email for Lockout Notification
Check logs or Ethereal inbox for account lockout email.

---

## Test 6: Email Verification Status

### Step 1: Check Verification Status
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/email-verification/status" `
  -Method Get `
  -Headers @{Authorization="Bearer $token"}
```

**Expected Response:**
```json
{
  "verified": false,
  "email": "test@example.com"
}
```

### Step 2: Resend Verification Email
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/email-verification/resend" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"}
```

---

## Test 7: Logout with Session Cleanup

### Step 1: Logout
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/logout" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Step 2: Verify Session Terminated
Try to access protected endpoint with same token:
```powershell
try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/v1/sessions" `
    -Method Get `
    -Headers @{Authorization="Bearer $token"}
} catch {
  Write-Host "Access denied (expected): $($_.Exception.Message)"
}
```

---

## Automated Test Script

Run all tests automatically:

```powershell
# test-phase1.ps1
$baseUrl = "http://localhost:3000/api/v1"

Write-Host "Testing Phase 1 Security Features..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[1/7] Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod "$baseUrl/../health"
Write-Host "✓ Server is healthy" -ForegroundColor Green

# Test 2: Password Reset Request
Write-Host "`n[2/7] Password Reset Request..." -ForegroundColor Yellow
$resetRequest = Invoke-RestMethod "$baseUrl/password-reset/request" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"test@example.com"}'
Write-Host "✓ Password reset request sent" -ForegroundColor Green

# Test 3: Login
Write-Host "`n[3/7] User Login..." -ForegroundColor Yellow
$login = Invoke-RestMethod "$baseUrl/auth/login" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"Test123!"}'
$token = $login.data.accessToken
Write-Host "✓ Login successful, token received" -ForegroundColor Green

# Test 4: Get Sessions
Write-Host "`n[4/7] Get User Sessions..." -ForegroundColor Yellow
$sessions = Invoke-RestMethod "$baseUrl/sessions" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Found $($sessions.count) active session(s)" -ForegroundColor Green

# Test 5: Get Activity Logs
Write-Host "`n[5/7] Get Activity Logs..." -ForegroundColor Yellow
$logs = Invoke-RestMethod "$baseUrl/activity-logs?limit=5" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Retrieved $($logs.logs.Count) activity logs" -ForegroundColor Green

# Test 6: Get Activity Summary
Write-Host "`n[6/7] Get Activity Summary..." -ForegroundColor Yellow
$summary = Invoke-RestMethod "$baseUrl/activity-logs/summary?days=7" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Activity summary retrieved" -ForegroundColor Green

# Test 7: Logout
Write-Host "`n[7/7] User Logout..." -ForegroundColor Yellow
$logout = Invoke-RestMethod "$baseUrl/auth/logout" `
  -Method Post -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Logout successful" -ForegroundColor Green

Write-Host "`nAll tests passed! ✅" -ForegroundColor Green
```

Save as `test-phase1.ps1` and run:
```powershell
.\test-phase1.ps1
```

---

## Expected Email Notifications

If SMTP is configured, you should receive emails for:

1. **Registration** - Email verification link
2. **Password Reset** - Reset link with token
3. **Account Lockout** - Warning after 5 failed attempts
4. **Login from New Device** - Security notification (optional)

---

## Troubleshooting

### Email not sending
- Check `apps/api/.env` has SMTP settings
- View logs: `.\view-logs.ps1 -Follow`
- Check Ethereal test inbox: https://ethereal.email

### 401 Unauthorized errors
- Token may have expired (1 hour lifespan)
- Re-login to get fresh token
- Check Authorization header format: `Bearer <token>`

### Session not found
- Sessions expire after 7 days
- Check database: `pnpm db:studio`
- Verify session token matches JWT token

### Activity logs empty
- Make sure you've performed some actions (login, logout, etc.)
- Check userId matches the logged-in user
- Use `/activity-logs/summary` to see activity counts

---

**Last Updated**: November 19, 2025  
**Phase**: 1 Testing Guide

# Phase 1 API Routes - Security & Foundation

This document describes the new API endpoints added in Phase 1 of the Todo App v2.0 enhancements.

## Base URL
All endpoints are prefixed with `/api/v1`

## Password Reset

### Request Password Reset
**POST** `/password-reset/request`

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Notes:**
- Always returns success to prevent email enumeration
- Token expires in 1 hour
- Email contains link to reset page with token

---

### Reset Password
**POST** `/password-reset/reset`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "abc123...",
  "newPassword": "NewSecureP@ssw0rd"
}
```

**Success Response** (200):
```json
{
  "message": "Password has been reset successfully"
}
```

**Error Response** (400):
```json
{
  "error": "Password is too weak",
  "feedback": ["Add special characters", "Make it longer"],
  "score": 2
}
```

**Error Codes:**
- `400` - Invalid token, expired token, or weak password
- `404` - User not found

**Notes:**
- Clears account lockout status
- Invalidates all password reset tokens
- Password strength score must be ≥ 3 (out of 4)

---

### Verify Reset Token
**GET** `/password-reset/verify/:token`

Verify if a reset token is valid (frontend validation).

**Success Response** (200):
```json
{
  "valid": true,
  "expiresAt": "2025-11-19T12:00:00.000Z"
}
```

**Error Response** (400):
```json
{
  "valid": false,
  "error": "Invalid or expired reset token"
}
```

---

## Email Verification

### Verify Email
**GET** `/email-verification/verify/:token`

Verify user's email address using token from registration email.

**Success Response** (200):
```json
{
  "message": "Email verified successfully"
}
```

**Already Verified** (200):
```json
{
  "message": "Email is already verified",
  "alreadyVerified": true
}
```

**Error Codes:**
- `400` - Invalid or expired token
- `404` - User not found

---

### Resend Verification Email
**POST** `/email-verification/resend`

Resend verification email to authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "message": "Verification email has been sent"
}
```

**Error Codes:**
- `400` - Email already verified
- `401` - Not authenticated
- `404` - User not found

---

### Get Verification Status
**GET** `/email-verification/status`

Get current email verification status for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "verified": true,
  "email": "user@example.com"
}
```

---

## Session Management

### Get All Sessions
**GET** `/sessions`

List all active sessions for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "sessions": [
    {
      "id": "session-id-1",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "location": "San Francisco, CA",
      "lastActiveAt": "2025-11-19T10:30:00.000Z",
      "createdAt": "2025-11-18T09:00:00.000Z",
      "isCurrent": true
    },
    {
      "id": "session-id-2",
      "ipAddress": "192.168.1.50",
      "userAgent": "Chrome/119.0...",
      "location": "New York, NY",
      "lastActiveAt": "2025-11-19T08:15:00.000Z",
      "createdAt": "2025-11-17T14:00:00.000Z",
      "isCurrent": false
    }
  ],
  "count": 2
}
```

**Notes:**
- Sessions expire after 7 days of inactivity
- `isCurrent` indicates the session making the request

---

### Terminate Session
**DELETE** `/sessions/:sessionId`

Terminate a specific session (logout from a device).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "message": "Session terminated successfully"
}
```

**Error Codes:**
- `401` - Not authenticated
- `404` - Session not found or doesn't belong to user

---

### Terminate All Other Sessions
**POST** `/sessions/terminate-others`

Terminate all sessions except the current one (security feature).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "message": "Successfully terminated 3 other session(s)",
  "count": 3
}
```

**Notes:**
- Useful after changing password or suspicious activity
- Current session remains active

---

## Activity Logs

### Get Activity Logs
**GET** `/activity-logs`

Get paginated activity log for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `action` (string, optional) - Filter by action type
- `startDate` (ISO date, optional) - Filter start date
- `endDate` (ISO date, optional) - Filter end date

**Example:**
```
GET /activity-logs?page=1&limit=20&action=LOGIN&startDate=2025-11-01
```

**Success Response** (200):
```json
{
  "logs": [
    {
      "id": "log-id-1",
      "action": "LOGIN",
      "description": "User logged in",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {},
      "createdAt": "2025-11-19T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20
  }
}
```

**Action Types:**
- `LOGIN`, `LOGOUT`
- `PASSWORD_CHANGE`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_COMPLETE`
- `EMAIL_CHANGE`, `EMAIL_VERIFIED`
- `SESSION_TERMINATED`
- `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`
- `DATA_EXPORT`, `ACCOUNT_DELETION_REQUEST`
- `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `TASK_COMPLETED`

---

### Get Activity Summary
**GET** `/activity-logs/summary`

Get activity count summary for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (number, default: 30, max: 365) - Number of days to analyze

**Success Response** (200):
```json
{
  "LOGIN": 15,
  "LOGOUT": 12,
  "PASSWORD_CHANGE": 1,
  "TASK_CREATED": 25,
  "TASK_COMPLETED": 18
}
```

---

### Get Recent Security Events
**GET** `/activity-logs/security`

Get recent security-related activity.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (number, default: 10, max: 50) - Number of events

**Success Response** (200):
```json
{
  "events": [
    {
      "id": "log-id-1",
      "action": "LOGIN",
      "description": "User logged in",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-11-19T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Security Events:**
- Login/Logout
- Password changes and resets
- Email verification
- Session termination
- Account lockout/unlock

---

## Common Error Responses

### Authentication Error (401)
```json
{
  "error": "Invalid or expired token"
}
```

### Validation Error (400)
```json
{
  "error": "Invalid request",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

---

## Security Notes

1. **Rate Limiting:** All endpoints are rate-limited (100 requests/15 minutes per IP)
2. **Token Expiration:**
   - Password reset tokens: 1 hour
   - Email verification tokens: 24 hours
   - Session tokens: 7 days
3. **Password Requirements:**
   - Minimum 8 characters
   - Must include uppercase, lowercase, number, and special character
   - Strength score ≥ 3 (out of 4)
4. **Account Lockout:** After 5 failed login attempts, account locks for 30 minutes
5. **Activity Retention:** Logs retained for 90 days

---

## Testing with cURL

### Request Password Reset
```bash
curl -X POST http://localhost:3000/api/v1/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Get Sessions
```bash
curl http://localhost:3000/api/v1/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Activity Logs
```bash
curl "http://localhost:3000/api/v1/activity-logs?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Last Updated:** November 19, 2025  
**Version:** v2.0 Phase 1

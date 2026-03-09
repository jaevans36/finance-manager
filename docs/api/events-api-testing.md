# Events API Testing Guide

## Overview
This document provides instructions for testing the Events API backend before integrating with the frontend.

## Prerequisites
- Development environment running (`.\scripts\start-dev.ps1`)
- API accessible at http://localhost:5000
- VS Code with REST Client extension (or use Swagger UI at http://localhost:5000/swagger)

## Test File Location
`apps/finance-api/Events.http`

## API Endpoints

### Events Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | List all user events with optional filters |
| GET | `/api/v1/events/{id}` | Get specific event by ID |
| POST | `/api/v1/events` | Create new event |
| PUT | `/api/v1/events/{id}` | Update existing event |
| DELETE | `/api/v1/events/{id}` | Delete event |

### Query Parameters (GET /api/v1/events)
- `startDate` (optional): Filter events ending on or after this date (ISO 8601)
- `endDate` (optional): Filter events starting on or before this date (ISO 8601)
- `groupId` (optional): Filter events by task group GUID

## Test Scenarios

### 1. Setup Tests (Tests 1-3)
**Purpose**: Create test user, authenticate, and set up test data

**Expected Results**:
- ✅ User registration succeeds (201 Created)
- ✅ Login returns access token
- ✅ Task group created for categorizing events

### 2. Event Creation Tests (Tests 4-6)

#### Test 4: All-Day Event
```json
{
  "title": "Team Meeting",
  "startDate": "2026-01-20T00:00:00Z",
  "endDate": "2026-01-20T23:59:59Z",
  "isAllDay": true
}
```
**Expected**: ✅ 201 Created with event ID

#### Test 5: Timed Event with Reminder
```json
{
  "title": "Client Presentation",
  "startDate": "2026-01-22T14:00:00Z",
  "endDate": "2026-01-22T15:30:00Z",
  "location": "Conference Room A",
  "reminderMinutes": 30
}
```
**Expected**: ✅ 201 Created with location and reminder

#### Test 6: Multi-Day Event
```json
{
  "title": "Annual Conference 2026",
  "startDate": "2026-03-15T00:00:00Z",
  "endDate": "2026-03-17T23:59:59Z",
  "isAllDay": true
}
```
**Expected**: ✅ 201 Created, spans 3 days

### 3. Retrieval Tests (Tests 7-10)

#### Test 7: Get All Events
**Expected**: ✅ Array of 3 events created in previous tests

#### Test 8: Filter by Date Range
**Query**: `?startDate=2026-01-20T00:00:00Z&endDate=2026-01-31T23:59:59Z`
**Expected**: ✅ Only January 2026 events returned (2 events)

#### Test 9: Filter by Group
**Query**: `?groupId={groupId}`
**Expected**: ✅ Only events in "Work Events" group (1 event)

#### Test 10: Get Single Event
**Expected**: ✅ Returns complete event details with group info

### 4. Update Tests (Tests 11-12)

#### Test 11: Full Update
**Changes**: Title, times, location, reminder
**Expected**: ✅ 200 OK, event updated with all new values

#### Test 12: Partial Update
**Changes**: Only description field
**Expected**: ✅ 200 OK, only description changed, other fields unchanged

### 5. Delete Test (Test 13)
**Expected**: ✅ 204 No Content, event removed from database

### 6. Error Handling Tests (Tests 14-17)

#### Test 14: Invalid Date Range
**Error**: End date before start date
**Expected**: ❌ 400 Bad Request - "End date must be on or after start date"

#### Test 15: Invalid Reminder
**Error**: ReminderMinutes = 45 (not in allowed values: 15, 30, 60, 1440)
**Expected**: ❌ 400 Bad Request - "Reminder must be one of: 15, 30, 60, 1440 minutes"

#### Test 16: Non-Existent Event
**Error**: Request event with invalid GUID
**Expected**: ❌ 404 Not Found - "Event not found"

#### Test 17: No Authentication
**Error**: Update request without Bearer token
**Expected**: ❌ 401 Unauthorized

### 7. Verification Test (Test 18)
**Expected**: ✅ List shows remaining events after deletion (2 events total)

## Validation Rules Checklist

### Date/Time Validation
- ✅ Start date must be valid ISO 8601 format
- ✅ End date must be >= start date
- ✅ UTC timezone handling

### Field Validation
- ✅ Title: Required, 1-200 characters
- ✅ Description: Optional, max 5000 characters
- ✅ Location: Optional, max 500 characters
- ✅ ReminderMinutes: Optional, must be 15, 30, 60, or 1440
- ✅ GroupId: Optional, must belong to user

### Security Validation
- ✅ User can only create events for themselves
- ✅ User can only access their own events
- ✅ User can only assign events to their own groups
- ✅ All endpoints require authentication

## Database Verification

After running tests, verify in database:
```sql
-- Connect to database
docker exec -it life-manager-db psql -U postgres -d finance_manager_dev

-- Check events table
SELECT id, title, start_date, end_date, is_all_day, location, reminder_minutes 
FROM events 
ORDER BY start_date;

-- Check activity logs
SELECT action, description, created_at 
FROM activity_logs 
WHERE action IN ('EventCreated', 'EventUpdated', 'EventDeleted')
ORDER BY created_at DESC;
```

**Expected Database State**:
- 2 events remaining (Team Meeting, Client Presentation)
- 1 event deleted (Annual Conference)
- 6 activity log entries (3 created, 2 updated, 1 deleted)

## Swagger UI Testing

Alternative to REST Client - use Swagger UI:
1. Open http://localhost:5000/swagger
2. Find "Events" section
3. Click "Authorize" and enter Bearer token from login
4. Test endpoints interactively

## Common Issues & Solutions

### Issue: "Event not found"
**Cause**: Event belongs to different user or doesn't exist
**Solution**: Verify event ID and ensure using correct access token

### Issue: "Task group not found or does not belong to user"
**Cause**: GroupId references another user's group
**Solution**: Create group with same user or set groupId to null

### Issue: "Validation failed: End date must be on or after start date"
**Cause**: Date validation in EventValidator
**Solution**: Ensure endDate >= startDate

### Issue: 401 Unauthorized
**Cause**: Missing or expired access token
**Solution**: Re-run login test and copy new access token

## Success Criteria

All tests should pass with these results:
- ✅ 3 events created successfully
- ✅ All retrieval filters work correctly
- ✅ Updates modify only specified fields
- ✅ Deletion removes event from database
- ✅ All 4 error scenarios return appropriate status codes
- ✅ Activity logs recorded for all operations
- ✅ Final state: 2 events remain in database

## Next Steps

After confirming backend works:
1. ✅ Move to Phase 13.5: Frontend TypeScript Types
2. ✅ Implement Phase 13.6: Frontend Event Service
3. ✅ Create Phase 13.8: Event UI Components
4. ✅ Write Phase 13.7: Backend Unit/Integration Tests
5. ✅ Write Phase 13.10: Frontend Component/E2E Tests

---

**Testing Status**: 🟡 Pending Manual Verification
**Last Updated**: 2026-01-18

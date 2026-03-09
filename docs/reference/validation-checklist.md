# Validation Checklist (T161)

**Date:** 28 December 2025  
**Purpose:** Validate Life Manager To Do application against functional requirements  
**API:** .NET Core 8.0 on http://localhost:5000  
**Frontend:** React 18.2 + Vite on http://localhost:5173  
**Swagger UI:** http://localhost:5000/swagger

## Prerequisites Verification

- [x] .NET Core 8.0 SDK installed
- [x] Node.js 20.x installed  
- [x] pnpm 10.x installed
- [x] PostgreSQL 15 running via Docker
- [x] Development environment starts successfully (`.\scripts\start-dev.ps1`)

## Authentication Flow Testing

### User Registration (US1)

**Test Case 1: Valid Registration**
- [ ] Navigate to http://localhost:5173/register
- [ ] Enter valid email: `test@example.com`
- [ ] Enter valid password: `SecurePass123!`
- [ ] Optionally enter username: `testuser`
- [ ] Submit form
- **Expected:** Redirect to dashboard, JWT token stored, welcome toast notification
- **API Endpoint:** `POST /api/auth/register`
- **Status Code:** 200 OK

**Test Case 2: Invalid Email Format**
- [ ] Enter invalid email: `notanemail`
- [ ] Enter valid password
- **Expected:** Client-side validation error, form not submitted

**Test Case 3: Weak Password**
- [ ] Enter valid email
- [ ] Enter weak password: `123`
- **Expected:** Validation error, minimum length requirement shown

**Test Case 4: Duplicate Email**
- [ ] Attempt to register with existing email
- **Expected:** 400 Bad Request, "Email already exists" error message

### User Login (US1)

**Test Case 5: Valid Login**
- [ ] Navigate to http://localhost:5173/login
- [ ] Enter registered email
- [ ] Enter correct password
- **Expected:** Redirect to dashboard, JWT token stored, session created
- **API Endpoint:** `POST /api/auth/login`
- **Status Code:** 200 OK

**Test Case 6: Invalid Credentials**
- [ ] Enter valid email
- [ ] Enter wrong password
- **Expected:** 401 Unauthorized, "Invalid credentials" error message

**Test Case 7: Remember Me Functionality**
- [ ] Check "Remember Me" checkbox during login
- [ ] Close browser and reopen
- **Expected:** User still logged in (extended token expiry)

### Session Management

**Test Case 8: Token Validation**
- [ ] Login successfully
- [ ] Access protected route: `/dashboard`
- **Expected:** Dashboard loads with user data
- **API Endpoint:** `GET /api/auth/me` with Bearer token

**Test Case 9: Logout**
- [ ] Click logout button from dashboard
- **Expected:** Redirect to login, token cleared, session terminated
- **API Endpoint:** `POST /api/auth/logout`

**Test Case 10: Protected Route Access**
- [ ] Logout (or clear cookies)
- [ ] Attempt to access `/dashboard` directly
- **Expected:** Redirect to `/login`

### Password Reset Flow (US6)

**Test Case 11: Request Password Reset**
- [ ] Navigate to http://localhost:5173/forgot-password
- [ ] Enter registered email
- [ ] Submit request
- **Expected:** Success message, reset email sent (check logs)
- **API Endpoint:** `POST /api/auth/forgot-password`

**Test Case 12: Reset Password with Token**
- [ ] Get reset token from email logs
- [ ] Navigate to `/reset-password/{token}`
- [ ] Enter new password twice
- [ ] Submit form
- **Expected:** Password updated, redirect to login
- **API Endpoint:** `POST /api/auth/reset-password`

**Test Case 13: Expired Reset Token**
- [ ] Use token older than 1 hour
- **Expected:** 400 Bad Request, "Invalid or expired token"

### Email Verification (US5)

**Test Case 14: Email Verification**
- [ ] Register new user
- [ ] Get verification token from logs
- [ ] Navigate to `/verify-email/{token}`
- **Expected:** Email verified, success message, redirect to dashboard

**Test Case 15: Resend Verification Email**
- [ ] Navigate to `/resend-verification`
- [ ] Enter unverified email
- [ ] Submit request
- **Expected:** New verification email sent

## Task Management Testing

### Create Tasks (US2)

**Test Case 16: Create Basic Task**
- [ ] Login to dashboard
- [ ] Click "New Task" or press `N` keyboard shortcut
- [ ] Enter title: "Complete documentation"
- [ ] Select priority: "High"
- [ ] Set due date: Tomorrow
- [ ] Submit form
- **Expected:** Task appears in list, success toast
- **API Endpoint:** `POST /api/tasks`
- **Status Code:** 201 Created

**Test Case 17: Create Task with Description**
- [ ] Create task with long description
- **Expected:** Description truncated in list view, full text in details

**Test Case 18: Create Task with All Fields**
- [ ] Title: "Weekly report"
- [ ] Description: "Prepare weekly status report"
- [ ] Priority: "Critical"
- [ ] Due date: End of week
- **Expected:** All fields saved correctly

**Test Case 19: Invalid Task Creation**
- [ ] Attempt to create task with empty title
- **Expected:** Validation error, form not submitted

### View and List Tasks (US2)

**Test Case 20: View All Tasks**
- [ ] Navigate to dashboard
- **Expected:** All user's tasks displayed
- **API Endpoint:** `GET /api/tasks`

**Test Case 21: Task Sorting**
- [ ] Sort tasks by due date (ascending)
- [ ] Sort by priority (Critical → Low)
- [ ] Sort by created date
- **Expected:** Tasks reorder correctly

**Test Case 22: Task Filtering**
- [ ] Filter by completion status: Active only
- [ ] Filter by completion status: Completed only
- [ ] Filter by priority: High priority tasks
- **Expected:** Task list updates to show filtered results

**Test Case 23: Empty State**
- [ ] Delete all tasks or create new user
- **Expected:** Empty state message displayed

### Edit Tasks (US2)

**Test Case 24: Edit Task Title**
- [ ] Click edit button on task
- [ ] Change title
- [ ] Save changes
- **Expected:** Task updates immediately, success toast
- **API Endpoint:** `PUT /api/tasks/{id}`

**Test Case 25: Update Task Priority**
- [ ] Edit task priority from "Low" to "Critical"
- **Expected:** Task badge colour updates, position may change if sorted by priority

**Test Case 26: Update Due Date**
- [ ] Change due date to past date
- **Expected:** Task marked as overdue (red indicator)

### Complete Tasks (US2)

**Test Case 27: Mark Task Complete**
- [ ] Click checkbox on active task
- **Expected:** Task marked complete, completion timestamp shown
- **API Endpoint:** `PUT /api/tasks/{id}` with `completed: true`

**Test Case 28: Unmark Completed Task**
- [ ] Click checkbox on completed task
- **Expected:** Task moved back to active, completion timestamp cleared

**Test Case 29: Completion Statistics**
- [ ] Complete several tasks
- **Expected:** Statistics dashboard updates (completed count, completion rate)

### Delete Tasks (US2)

**Test Case 30: Delete Task**
- [ ] Click delete button on task
- [ ] Confirm deletion in modal
- **Expected:** Task removed from list, success toast
- **API Endpoint:** `DELETE /api/tasks/{id}`

**Test Case 31: Cancel Deletion**
- [ ] Click delete button
- [ ] Click cancel in confirmation modal
- **Expected:** Task remains in list

## Advanced Features Testing

### Task Search (US3, T152)

**Test Case 32: Search by Title**
- [ ] Enter search term in search bar or press `/`
- [ ] Type: "documentation"
- **Expected:** Only matching tasks displayed

**Test Case 33: Search by Description**
- [ ] Search for text that appears in description
- **Expected:** Tasks with matching descriptions shown

**Test Case 34: Empty Search Results**
- [ ] Search for non-existent term
- **Expected:** "No tasks found" message

### Task Groups (US4)

**Test Case 35: Create Task Group**
- [ ] Create new group: "Work Projects"
- [ ] Set colour: Blue
- **Expected:** Group created, appears in sidebar
- **API Endpoint:** `POST /api/taskgroups`

**Test Case 36: Assign Task to Group**
- [ ] Edit task
- [ ] Select group from dropdown
- [ ] Save changes
- **Expected:** Task displays group badge

**Test Case 37: Filter by Group**
- [ ] Click on group in sidebar
- **Expected:** Only tasks in that group displayed

**Test Case 38: Edit Group**
- [ ] Rename group
- [ ] Change colour
- **Expected:** Group updates, task badges update

**Test Case 39: Delete Group**
- [ ] Delete group with tasks
- **Expected:** Tasks moved to "Ungrouped", group removed

### Username System (US7/Phase 10)

**Test Case 40: Set Username During Registration**
- [ ] Register with username: "johndoe"
- **Expected:** Username saved, displayed in profile

**Test Case 41: Update Username**
- [ ] Navigate to profile page
- [ ] Change username
- **Expected:** Username updated, available for authentication

**Test Case 42: Login with Username**
- [ ] Logout
- [ ] Login using username instead of email
- **Expected:** Successful authentication

**Test Case 43: Username Uniqueness**
- [ ] Attempt to set username already taken
- **Expected:** Validation error, username must be unique

### User Profile (T150)

**Test Case 44: View Profile**
- [ ] Navigate to `/profile`
- **Expected:** User details displayed (email, username, registration date)

**Test Case 45: Update Email**
- [ ] Change email address
- [ ] Save changes
- **Expected:** Email updated, new verification email sent

**Test Case 46: Change Password**
- [ ] Enter current password
- [ ] Enter new password twice
- [ ] Save changes
- **Expected:** Password updated, success message

**Test Case 47: Delete Account**
- [ ] Click delete account button
- [ ] Confirm with password
- **Expected:** Account deleted, all tasks removed, redirect to register

## UI/UX Features Testing

### Dark Mode (T154)

**Test Case 48: Toggle Dark Mode**
- [ ] Click theme toggle button
- **Expected:** Colours invert, preference saved to localStorage

**Test Case 49: Dark Mode Persistence**
- [ ] Enable dark mode
- [ ] Refresh page
- **Expected:** Dark mode still active

### Toast Notifications (T149)

**Test Case 50: Success Notifications**
- [ ] Create task
- [ ] Update task  
- [ ] Delete task
- **Expected:** Green success toast appears for each action

**Test Case 51: Error Notifications**
- [ ] Trigger validation error
- [ ] Trigger server error (invalid API request)
- **Expected:** Red error toast with descriptive message

### Keyboard Shortcuts (T151)

**Test Case 52: New Task Shortcut**
- [ ] Press `N` key on dashboard
- **Expected:** Task creation modal opens

**Test Case 53: Search Shortcut**
- [ ] Press `/` key
- **Expected:** Focus moves to search input

**Test Case 54: Escape to Close**
- [ ] Open modal or focus search
- [ ] Press `Esc` key
- **Expected:** Modal closes or input loses focus

### Responsive Design (T147)

**Test Case 55: Mobile View**
- [ ] Resize browser to 375px width
- **Expected:** Mobile layout, hamburger menu, touch-friendly buttons (min 44px)

**Test Case 56: Tablet View**
- [ ] Resize to 768px width
- **Expected:** Adapted layout, readable text, accessible controls

**Test Case 57: Desktop View**
- [ ] Resize to 1920px width
- **Expected:** Full layout, sidebar visible, optimal spacing

### Loading States (T148)

**Test Case 58: Loading Skeletons**
- [ ] Clear cache and reload dashboard
- **Expected:** Skeleton placeholders while tasks load

**Test Case 59: Lazy Loading**
- [ ] Navigate between routes
- **Expected:** Loading spinner during route transitions

### Accessibility (T155)

**Test Case 60: Keyboard Navigation**
- [ ] Use Tab key to navigate through tasks
- [ ] Use Enter to activate buttons
- **Expected:** All interactive elements reachable and activatable

**Test Case 61: Screen Reader Support**
- [ ] Inspect with accessibility tools
- **Expected:** ARIA labels present, semantic HTML used

**Test Case 62: Focus Indicators**
- [ ] Tab through interface
- **Expected:** Clear focus indicators on all elements

## Performance Testing

### Code Splitting (T156)

**Test Case 63: Bundle Analysis**
- [ ] Run `pnpm run build:analyze` in apps/web
- **Expected:** Separate chunks for react-vendor, ui-vendor, and each route

**Test Case 64: Initial Load Time**
- [ ] Measure time to interactive
- **Expected:** < 3 seconds on fast connection

**Test Case 65: Route Transitions**
- [ ] Navigate between pages
- **Expected:** Smooth transitions, minimal delay

### Task Statistics (T153)

**Test Case 66: Statistics Dashboard**
- [ ] View dashboard with multiple tasks
- **Expected:** Correct counts for total, completed, overdue, active

**Test Case 67: Real-time Updates**
- [ ] Complete a task
- **Expected:** Statistics update immediately without page refresh

## Security Testing (T160)

### Authentication Security

**Test Case 68: JWT Token Expiration**
- [ ] Login and wait for token expiry (1 hour)
- [ ] Attempt API request
- **Expected:** 401 Unauthorized, prompt to login again

**Test Case 69: Invalid Token**
- [ ] Manually modify JWT token in localStorage
- [ ] Make API request
- **Expected:** 401 Unauthorized, redirect to login

**Test Case 70: Password Hashing**
- [ ] Check database directly
- **Expected:** Passwords stored as BCrypt hashes, never plain text

### Authorization

**Test Case 71: User Data Isolation**
- [ ] Login as User A
- [ ] Attempt to access User B's task via API
- **Expected:** 404 Not Found or 403 Forbidden

**Test Case 72: Protected Endpoints**
- [ ] Make API requests without Authorization header
- **Expected:** 401 Unauthorized for all protected routes

### Input Validation

**Test Case 73: XSS Prevention**
- [ ] Create task with script tags in title: `<script>alert('xss')</script>`
- **Expected:** Script not executed, displayed as plain text

**Test Case 74: SQL Injection Prevention**
- [ ] Enter SQL injection attempt in search: `'; DROP TABLE tasks;--`
- **Expected:** Treated as literal string, no database impact

## API Documentation (T158)

**Test Case 75: Swagger UI Access**
- [ ] Navigate to http://localhost:5000/swagger
- **Expected:** Interactive API documentation loads

**Test Case 76: JWT Authentication in Swagger**
- [ ] Click "Authorize" button in Swagger
- [ ] Enter JWT token with "Bearer " prefix
- [ ] Test protected endpoint
- **Expected:** Authenticated request succeeds

**Test Case 77: Endpoint Documentation**
- [ ] Check AuthController documentation
- **Expected:** XML comments visible, request/response schemas shown

## Error Handling

**Test Case 78: Network Errors**
- [ ] Stop API server
- [ ] Attempt to create task from frontend
- **Expected:** User-friendly error message, not crash

**Test Case 79: Validation Errors**
- [ ] Submit invalid form data
- **Expected:** Clear validation messages, highlighted fields

**Test Case 80: Server Errors**
- [ ] Trigger 500 error (database connection issue)
- **Expected:** Generic error message, error logged (when T159 complete)

## Integration Testing

**Test Case 81: End-to-End Registration Flow**
- [ ] Register → Verify Email → Login → Create Task → Complete Task → Logout
- **Expected:** All steps complete successfully

**Test Case 82: Multi-User Scenario**
- [ ] Register User A and User B
- [ ] Both create tasks
- [ ] Verify each user only sees their own tasks

**Test Case 83: Data Persistence**
- [ ] Create tasks
- [ ] Stop and restart all services
- [ ] Login again
- **Expected:** All tasks persisted correctly

## Test Summary

**Total Test Cases:** 83  
**Passed:** _To be completed_  
**Failed:** _To be completed_  
**Blocked:** _To be completed_  
**Not Tested:** _To be completed_

## Known Issues

_Document any issues found during testing:_

1. 
2. 
3. 

## Recommendations

_Based on testing results:_

1. 
2. 
3. 

## Sign-off

**Tested By:** _GitHub Copilot_  
**Date:** 28 December 2025  
**Status:** In Progress  
**Next Steps:** Complete manual testing, update quickstart.md with current architecture

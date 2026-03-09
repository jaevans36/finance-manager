# Quickstart Guide: To Do App

**Created**: 2025-11-14  
**Feature**: 001-todo-app  
**Purpose**: Development setup and testing scenarios for the To Do application

## Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- PostgreSQL 15+ running locally or via Docker
- Git for version control

## Development Setup

### 1. Environment Setup

```bash
# Clone and navigate to project
git clone <repository-url>
cd life-manager

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 2. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker run --name postgres-todo \
  -e POSTGRES_DB=todoapp \
  -e POSTGRES_USER=todouser \
  -e POSTGRES_PASSWORD=todopass \
  -p 5432:5432 \
  -d postgres:15

# Run database migrations
cd apps/api
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### 3. Start Development Servers

```bash
# Terminal 1: Start API server
cd apps/api
pnpm dev
# Runs on http://localhost:3001

# Terminal 2: Start web application
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

## API Testing Scenarios

### Authentication Flow

#### 1. User Registration

```http
POST http://localhost:3001/api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "createdAt": "2025-11-14T10:00:00Z",
      "lastLoginAt": "2025-11-14T10:00:00Z"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "expiresIn": 900
  }
}
```

#### 2. User Login

```http
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response** (200): Same as registration response

#### 3. Token Refresh

```http
POST http://localhost:3001/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-from-login"
}
```

**Expected Response** (200): New access and refresh tokens

### Task Management Flow

#### 1. Create Task

```http
POST http://localhost:3001/api/v1/tasks
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the To Do app",
  "priority": "HIGH",
  "dueDate": "2025-11-20"
}
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-here",
    "userId": "user-uuid-here",
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation for the To Do app",
    "priority": "HIGH",
    "dueDate": "2025-11-20",
    "completed": false,
    "completedAt": null,
    "createdAt": "2025-11-14T10:30:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  }
}
```

#### 2. Get All Tasks

```http
GET http://localhost:3001/api/v1/tasks?page=1&limit=10&sort=due_date&order=asc
Authorization: Bearer {access-token}
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-uuid-here",
        "title": "Complete project documentation",
        "priority": "HIGH",
        "dueDate": "2025-11-20",
        "completed": false,
        "createdAt": "2025-11-14T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 3. Update Task

```http
PUT http://localhost:3001/api/v1/tasks/{task-id}
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "title": "Complete project documentation - Updated",
  "completed": true
}
```

**Expected Response** (200): Updated task object with `completed: true` and `completedAt` timestamp

#### 4. Delete Task

```http
DELETE http://localhost:3001/api/v1/tasks/{task-id}
Authorization: Bearer {access-token}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Frontend Testing Scenarios

### User Registration & Login Flow

1. **Visit Registration Page**
   - Navigate to `http://localhost:3000/register`
   - Fill form with valid email and password
   - Submit and verify redirect to dashboard

2. **Login Flow**
   - Navigate to `http://localhost:3000/login`
   - Enter registered credentials
   - Verify successful login and redirect to task dashboard

3. **Logout Flow**
   - Click logout button from dashboard
   - Verify redirect to login page
   - Verify protected routes are inaccessible

### Task Management Flow

1. **Create New Task**
   - Click "Add Task" button on dashboard
   - Fill task form with title, description, priority, due date
   - Submit and verify task appears in task list

2. **View Task List**
   - Verify all user's tasks are displayed
   - Test sorting by priority and due date
   - Test filtering by completion status

3. **Edit Task**
   - Click edit button on existing task
   - Modify task details
   - Save and verify changes are reflected

4. **Complete Task**
   - Click checkbox to mark task as complete
   - Verify task moves to completed section
   - Verify completion timestamp is displayed

5. **Delete Task**
   - Click delete button on task
   - Confirm deletion in modal
   - Verify task is removed from list

## Error Handling Scenarios

### Authentication Errors

1. **Invalid Registration**
   ```http
   POST /api/v1/auth/register
   { "email": "invalid-email", "password": "123" }
   ```
   **Expected**: 400 with validation errors

2. **Duplicate Email Registration**
   ```http
   POST /api/v1/auth/register
   { "email": "existing@example.com", "password": "ValidPass123!" }
   ```
   **Expected**: 409 with "Email already exists" error

3. **Invalid Login Credentials**
   ```http
   POST /api/v1/auth/login
   { "email": "user@example.com", "password": "wrongpassword" }
   ```
   **Expected**: 401 with "Invalid credentials" error

### Task Management Errors

1. **Create Task Without Authentication**
   ```http
   POST /api/v1/tasks
   { "title": "Test task" }
   ```
   **Expected**: 401 with "Unauthorized" error

2. **Access Another User's Task**
   ```http
   GET /api/v1/tasks/{other-user-task-id}
   Authorization: Bearer {valid-token}
   ```
   **Expected**: 404 with "Task not found" error

3. **Invalid Task Data**
   ```http
   POST /api/v1/tasks
   { "title": "", "priority": "INVALID" }
   ```
   **Expected**: 400 with validation errors

## Performance Testing

### Load Testing Scenarios

1. **Concurrent User Registration**
   - 10 users registering simultaneously
   - All requests should complete within 5 seconds

2. **Task List Performance**
   - User with 100 tasks
   - Task list should load within 2 seconds
   - Pagination should work smoothly

3. **Concurrent Task Creation**
   - 5 tasks created simultaneously by same user
   - All should be created successfully without conflicts

### Database Performance

1. **Query Performance**
   - Task list queries should execute in <100ms
   - User authentication should complete in <50ms
   - Task creation should complete in <200ms

2. **Connection Handling**
   - Database should handle 20 concurrent connections
   - Connection pool should manage resources efficiently

## Security Testing

### Authentication Security

1. **JWT Token Validation**
   - Expired tokens should be rejected
   - Invalid tokens should be rejected
   - Token should contain correct user information

2. **Password Security**
   - Passwords should be hashed with bcrypt
   - Plain text passwords should never be stored or logged

### Authorization Testing

1. **User Data Isolation**
   - Users should only access their own tasks
   - Admin endpoints should require proper authorization
   - Cross-user data access should be prevented

2. **Input Validation**
   - SQL injection attempts should be blocked
   - XSS attempts should be sanitized
   - File upload restrictions should be enforced

## Deployment Testing

### Environment Validation

1. **Production Environment Setup**
   - Environment variables correctly configured
   - Database connections working
   - External service integrations functional

2. **Health Checks**
   - API health endpoint returns 200
   - Database connectivity confirmed
   - Application startup time within acceptable limits

### Monitoring and Logging

1. **Error Logging**
   - Application errors logged with context
   - Authentication failures tracked
   - Performance metrics collected

2. **Audit Trail**
   - User actions logged with timestamps
   - Data modifications tracked
   - Security events monitored

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Ensure database exists and migrations run

2. **CORS Issues**
   - Check API CORS configuration
   - Verify frontend URL in allowed origins
   - Check browser console for specific errors

3. **Authentication Issues**
   - Verify JWT secret is set in environment
   - Check token expiration times
   - Validate token format and claims

### Debug Commands

```bash
# Check database connection
cd apps/api
pnpm prisma db push

# View database data
pnpm prisma studio

# Run tests
pnpm test

# Check API health
curl http://localhost:3001/api/v1/health
```
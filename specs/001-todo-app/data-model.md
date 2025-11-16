# Data Model: To Do App

**Created**: 2025-11-14  
**Feature**: 001-todo-app  
**Purpose**: Define entities, relationships, and data validation rules

## Entities

### User

**Purpose**: Represents an authenticated user of the application

**Attributes**:
- `id`: UUID, primary key, auto-generated
- `email`: String, unique, required, valid email format
- `password_hash`: String, required, bcrypt hashed
- `created_at`: DateTime, auto-generated on creation
- `updated_at`: DateTime, auto-updated on modification
- `last_login_at`: DateTime, nullable, updated on successful login

**Validation Rules**:
- Email must be valid format and unique across all users
- Password must be at least 8 characters with mixed case, numbers, and symbols
- Email is case-insensitive for uniqueness checks
- Soft deletion not required (permanent deletion allowed)

**Indexes**:
- Primary key on `id`
- Unique index on `email` (case-insensitive)
- Index on `created_at` for user analytics

### Task

**Purpose**: Represents a user's task/todo item

**Attributes**:
- `id`: UUID, primary key, auto-generated
- `user_id`: UUID, foreign key to User.id, required
- `title`: String, required, max 200 characters
- `description`: Text, optional, max 2000 characters
- `priority`: Enum (HIGH, MEDIUM, LOW), default MEDIUM
- `due_date`: Date, optional
- `completed`: Boolean, default false
- `completed_at`: DateTime, nullable, auto-set when completed=true
- `created_at`: DateTime, auto-generated on creation
- `updated_at`: DateTime, auto-updated on modification

**Validation Rules**:
- Title is required and must be between 1-200 characters
- Description is optional but max 2000 characters
- Priority must be one of: HIGH, MEDIUM, LOW
- Due date must be in the future when creating new tasks
- User can only access/modify their own tasks
- Completed tasks cannot have due_date modified

**Relationships**:
- Many-to-One: Task belongs to User (user_id → users.id)
- Cascade: When user is deleted, all their tasks are deleted

**Indexes**:
- Primary key on `id`
- Index on `user_id` (most common query pattern)
- Composite index on `(user_id, due_date)` for deadline queries
- Composite index on `(user_id, priority)` for priority filtering
- Composite index on `(user_id, completed, created_at)` for task listing

## Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique @map("email")
  passwordHash  String   @map("password_hash")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  lastLoginAt   DateTime? @map("last_login_at")
  
  // Relationships
  tasks         Task[]
  
  @@map("users")
}

model Task {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  title       String
  description String?
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime? @map("due_date")
  completed   Boolean   @default(false)
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  // Relationships
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([userId])
  @@index([userId, dueDate])
  @@index([userId, priority])
  @@index([userId, completed, createdAt])
  @@map("tasks")
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}
```

## Data Access Patterns

### User Operations
- Create user (registration)
- Authenticate user (login)
- Update last login timestamp
- Get user by ID
- Get user by email

### Task Operations
- Create task for user
- Get all tasks for user (with filtering/sorting)
- Get single task by ID (with user ownership check)
- Update task (with user ownership check)
- Delete task (with user ownership check)
- Mark task as complete/incomplete
- Get tasks by due date range
- Get tasks by priority level

## Audit Trail Requirements

### User Actions to Log
- User registration (success/failure)
- Login attempts (success/failure)
- Password changes
- Account deletion

### Task Actions to Log
- Task creation
- Task updates (with field changes)
- Task completion status changes
- Task deletion

### Log Entry Format
```typescript
interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  entityType: 'user' | 'task';
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
```

## Data Validation Layers

### Frontend Validation (Immediate Feedback)
- Real-time email format validation
- Password strength indicator
- Task title length counter
- Due date must be future date
- Required field highlighting

### API Validation (Security Boundary)
- Zod schema validation for all request bodies
- JWT token validation for protected routes
- User ownership verification for task operations
- Input sanitization to prevent XSS
- Rate limiting on auth endpoints

### Database Validation (Final Safety Net)
- Foreign key constraints
- Unique constraints
- Not null constraints
- Check constraints for enum values
- Trigger-based audit logging

## Performance Considerations

### Query Optimization
- Use prepared statements for all database queries
- Implement connection pooling (max 20 connections)
- Use database indexes for common query patterns
- Paginate task lists (default 50 items per page)

### Caching Strategy
- Cache user session data in Redis (if needed later)
- Cache task counts and statistics
- Short-term response caching for task lists (30 seconds)

### Data Size Limits
- Maximum 1000 tasks per user
- Task descriptions limited to 2000 characters
- Email addresses limited to 254 characters
- Title limited to 200 characters

## Migration Strategy

### Initial Schema Creation
1. Create users table with indexes
2. Create tasks table with relationships and indexes
3. Create audit_logs table for compliance
4. Seed development data for testing

### Future Considerations
- Add support for task categories/tags
- Add support for task attachments
- Add support for shared tasks/collaboration
- Add support for recurring tasks
- Add support for task templates
# Life Manager Platform Architecture

**Created**: 2026-01-07  
**Status**: Active  
**Version**: 2.0

## Overview

Life Manager is a personal productivity and finance management platform consisting of multiple integrated applications accessed through a unified hub dashboard.

## Platform Architecture

### Application Structure

```
Life Manager Platform
├── Hub Dashboard (/)                 # Main portal for all applications
│   ├── Application tiles
│   ├── Quick stats widget
│   ├── Activity feed
│   ├── Info bar (user avatar, time, notifications)
│   └── User profile management
│
├── To Do Application (/todo)
│   ├── Task management
│   ├── Task groups
│   ├── Weekly progress
│   ├── Recurring tasks
│   └── Calendar view
│
├── Finance Application (/finance) [Coming Soon]
│   ├── Transaction tracking
│   ├── Budget management
│   ├── Reports & analytics
│   └── Category management
│
└── Admin Panel (/admin)
    ├── User management
    ├── System configuration
    ├── Analytics dashboard
    ├── Audit logging
    └── Content moderation
```

### Technology Stack

**Frontend**:
- React 18.3.1 with TypeScript 5.7.2
- Vite 6.4.1 (build tool)
- React Router v6 with nested routing
- Styled Components 6.1.13
- Recharts (data visualization)
- Lucide React (icons)
- **Feature-based page organisation** (pages/auth/, pages/dashboard/, etc.)

**Backend**:
- .NET Core 8.0 Web API (C#)
- Entity Framework Core 8.0
- PostgreSQL 16+ database
- JWT authentication
- BCrypt password hashing
- **Feature-based code organisation** (Features/Auth/, Features/Tasks/, etc.)

**Infrastructure**:
- Docker Compose for development
- Monorepo structure (pnpm workspaces)
- PowerShell scripts for development workflow

## Routing Architecture

### Route Structure

```
/                         → Hub Dashboard (main landing page)
/hub                      → Alias for /

/todo                     → To Do application main view
/todo/progress            → Weekly progress dashboard
/todo/groups              → Task groups management
/todo/calendar            → Calendar view
/todo/recurring           → Recurring tasks management

/finance                  → Finance application (future)
/finance/transactions     → Transaction list
/finance/budgets          → Budget management
/finance/reports          → Reports & analytics

/admin                    → Admin panel (requires admin role)
/admin/users              → User management
/admin/system             → System configuration
/admin/analytics          → System analytics
/admin/audit              → Audit logs

/profile                  → User profile settings
/settings                 → Application settings
/login                    → Login page
/register                 → Registration page
/forgot-password          → Password reset request
/reset-password/:token    → Password reset form
/verify-email/:token      → Email verification
```

### Navigation Structure

**Top-Level Navigation** (visible in all apps):
- Hub/Home button (returns to /)
- Application switcher (quick access to all apps)
- Info bar (avatar, time, notifications, settings)

**Application-Specific Navigation** (visible within app):
- To Do: Tasks, Progress, Groups, Calendar, Recurring
- Finance: Transactions, Budgets, Reports, Categories
- Admin: Users, System, Analytics, Audit

### Route Protection

- **Public routes**: `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
- **Authenticated routes**: All other routes require valid JWT token
- **Admin-only routes**: `/admin/*` requires admin role
- **Verified email routes**: Some routes require verified email (configurable)

## Application Registry

Applications are registered in the database and displayed dynamically on the hub:

```typescript
interface Application {
  id: string;              // 'todo', 'finance', 'admin'
  name: string;            // 'To Do Manager', 'Life Manager'
  description: string;     // Brief description for hub tile
  iconPath: string;        // Path to flat icon
  routePath: string;       // '/todo', '/finance'
  status: 'active' | 'coming_soon' | 'restricted';
  requiredRole?: string;   // 'admin' for admin-only apps
  sortOrder: number;       // Display order on hub
  estimatedRelease?: Date; // For 'coming_soon' apps
}
```

**Registered Applications**:

1. **To Do Manager**
   - ID: `todo`
   - Route: `/todo`
   - Status: `active`
   - Icon: Checkmark circle (green)
   - Required Role: None (public)

2. **Life Manager**
   - ID: `finance`
   - Route: `/finance`
   - Status: `coming_soon`
   - Icon: Pie chart (blue)
   - Required Role: None (public)
   - Estimated Release: Q2 2026

3. **Admin Panel**
   - ID: `admin`
   - Route: `/admin`
   - Status: `active`
   - Icon: Settings gear (orange)
   - Required Role: `admin`

## Shared Services & State Management

### Authentication Context

Shared across all applications:

```typescript
interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  register: (userData) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### API Client

Centralized API client with automatic token injection:

```typescript
// apps/web/src/services/api-client.ts
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// Automatic token injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Automatic token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
    }
    return Promise.reject(error);
  }
);
```

### Theme Provider

Shared design system available to all applications:

```typescript
interface Theme {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  breakpoints: Breakpoints;
}
```

## Data Isolation & Multi-Tenancy

### User Data Isolation

- All user data filtered by `userId` at database query level
- Row-level security considerations for future multi-tenancy
- No shared data between users (except admin views)

### Application Data Boundaries

- **To Do**: Tasks, task groups, recurring tasks, statistics
- **Finance**: Transactions, budgets, categories, accounts
- **Platform**: Users, sessions, audit logs, system config

Each application owns its domain data but shares platform infrastructure.

## Cross-Application Features

### Activity Feed

Tracks user actions across all applications:

```sql
INSERT INTO user_activity_log (
  user_id, 
  action_type, 
  action_description, 
  application, 
  entity_type, 
  entity_id
) VALUES (
  '123-456',
  'task_completed',
  'Completed "Write documentation"',
  'todo',
  'task',
  'task-789'
);
```

### Quick Stats Widget

Aggregates metrics from all active applications:

- To Do: Tasks completed this week, active task groups
- Finance: Transactions this month, current balance
- Platform: Last login, account age

### Notifications

Centralized notification system for all applications:

- To Do: Task due reminders, recurring task creation
- Finance: Budget exceeded alerts, bill reminders
- Platform: System announcements, maintenance notices

## Performance Considerations

### Code Splitting

Each application is loaded as a separate chunk:

```typescript
const TodoApp = React.lazy(() => import('./pages/todo/TodoPage'));
const FinanceApp = React.lazy(() => import('./pages/finance/FinancePage'));
const AdminPanel = React.lazy(() => import('./pages/admin/AdminPage'));
```

### Data Caching

- Hub dashboard: 60-second cache TTL
- Application data: Invalidated on mutations
- User profile: Cached until logout

### Database Optimization

- Indexes on `user_id` for all user-owned tables
- Composite indexes for common query patterns
- Materialized views for analytics queries

## Security Architecture

### Authentication Flow

1. User logs in → JWT token issued (24-hour expiry)
2. Token stored in localStorage + HTTP-only cookie
3. Token included in all API requests (Authorization header)
4. Backend validates token and extracts user claims
5. User ID used to filter all database queries

### Authorization Levels

1. **Public**: Unauthenticated users (login, register pages)
2. **User**: Authenticated users (access own data)
3. **Admin**: Users with admin role (access all data + admin features)

### API Security

- All endpoints require authentication (except public routes)
- Rate limiting on all endpoints (varies by endpoint)
- CORS configured for frontend origin only
- CSRF protection via SameSite cookies
- SQL injection prevention via parameterized queries

## Scalability Considerations

### Horizontal Scaling

- Stateless API (JWT tokens, no server-side sessions)
- Database connection pooling
- CDN for static assets and user-uploaded content

### Database Scaling

- Read replicas for analytics queries
- Table partitioning for large tables (activity logs, audit logs)
- Archive old data to cold storage

### Future Considerations

- Redis for distributed caching
- Message queue for background jobs (email sending, report generation)
- Separate databases per application domain (microservices pattern)

## Migration Path

### From To Do App to Platform

Original implementation was single-purpose (To Do app). Platform evolution:

**Phase 1**: Extract authentication to shared service
**Phase 2**: Create hub dashboard and application registry
**Phase 3**: Refactor routing to nested structure
**Phase 4**: Add admin panel and system management
**Phase 5**: Design system standardization
**Phase 6**: Add second application (Finance)

### Backwards Compatibility

- Original `/dashboard` route redirects to `/todo`
- Legacy API endpoints maintain compatibility
- Database migrations preserve existing data

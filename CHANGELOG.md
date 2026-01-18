# Changelog

All notable changes to the To Do Manager application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Format: `major.minor.patch`

- **Major (X.0.0)**: Breaking changes, major architecture changes, significant feature additions
- **Minor (0.X.0)**: New features, enhancements, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements, documentation updates

---

## [0.13.0] - 2026-01-18 "Events Foundation"

### Added
- **Events Feature** (Phase 13)
  - Complete event management system with CRUD operations
  - Event form with title, description, start/end times, location, reminders
  - Event list component with Today/Tomorrow/This Week grouping
  - Event item display with all-day event badges
  - Events API with 5 REST endpoints (GET, POST, PUT, DELETE)
  - Task group assignment for events with color-coded display
  - 68 comprehensive tests (18 backend unit, 16 backend integration, 25 frontend component, 9 E2E)

- **Dashboard Restructure**
  - New dashboard as proper overview hub with widgets
  - Personalized greeting (Good morning/afternoon/evening)
  - Quick Stats cards: Tasks Completed, Upcoming Events, Due Today, Overdue
  - Quick Actions: View All Tasks, Calendar, Weekly Progress, Manage Groups
  - Upcoming Events section showing next 7 days
  - Priority Tasks section sorted by priority and due date
  - Dedicated Tasks page for full task management

- **Navigation Improvements**
  - Active state highlighting for current page in header
  - New navigation links: Dashboard, Tasks, Calendar, Progress, Profile
  - Application renamed to "To Do Manager"
  - Improved routing with /dashboard (overview) and /tasks (management)

- **Calendar Integration**
  - Event badges on calendar dates
  - Event count indicators with color coding
  - Quick event creation from calendar with pre-populated dates
  - All-day event support in calendar view

### Changed
- Separated dashboard overview from task management interface
- Improved header navigation with better visual hierarchy
- Enhanced calendar view with event information

### Technical
- Added Event entity to database with EF Core migration
- Created EventService with business logic layer
- Implemented EventsController with OpenAPI documentation
- Added comprehensive test coverage for events feature
- Updated TEST-INVENTORY.md: 235 → 303 tests

---

## [0.12.0] - 2025-12-20 "Calendar View"

### Added
- **Calendar View** (Phase 12)
  - Monthly calendar interface for visualizing tasks by date
  - Day cells with task count badges and color-coded priorities
  - Click day to add task with pre-populated due date
  - Click task badge to view all tasks for that day
  - Task detail modal with quick completion toggle
  - Month navigation with previous/next and date picker
  - Filter tasks by group and priority in calendar view
  - Responsive design with mobile swipe gestures
  - 20 tests for calendar functionality

### Changed
- Added calendar route and navigation menu item
- Improved date-based task organization
- Enhanced mobile touch interactions

---

## [0.11.0] - 2025-12-15 "Weekly Progress Dashboard"

### Added
- **Weekly Progress Dashboard** (Phase 11)
  - Comprehensive weekly analytics with visualization
  - Weekly overview with bar charts and pie charts (Recharts)
  - Daily breakdown showing 7-day cards with completion rates
  - Urgent tasks panel displaying critical/high priority tasks
  - Historical completion rate chart (8-week trend)
  - Week navigation with previous/next controls
  - Statistics API endpoints (weekly, daily, urgent, historical)
  - Empty states and loading skeletons
  - 45 tests for weekly progress features

### Changed
- Added Weekly Progress to main navigation
- Improved task statistics calculations
- Enhanced data visualization capabilities

---

## [0.10.0] - 2025-12-01 "Username System"

### Added
- **Username System** (Phase 10)
  - Unique username field for user accounts (3-20 characters)
  - Real-time username availability checking with debounce
  - Login with username or email
  - Username update functionality in profile page
  - Reserved username list (admin, support, system, etc.)
  - Username validation (alphanumeric + underscore/hyphen)

### Changed
- Registration form now includes username field
- Login accepts both username and email
- Dashboard displays username instead of email
- Profile page shows username with edit capability

---

## [0.9.0] - 2025-11-20 "Polish & Cross-Cutting"

### Added
- Responsive design for mobile devices (breakpoints, touch targets)
- Loading skeletons for better perceived performance
- Toast notifications for user actions (success/error messages)
- User profile page with account management
- Keyboard shortcuts (N=new task, /=search, Esc=close)
- Task search functionality (search by title/description)
- Task statistics dashboard (total, completed, overdue counts)
- Dark mode theme toggle
- Accessibility improvements (ARIA labels, keyboard navigation)
- API documentation with Swagger UI
- Comprehensive error logging and monitoring
- Security audit completed

### Changed
- Performance optimization with code splitting and lazy loading
- Improved error handling across the application
- Enhanced user experience with visual feedback

---

## [0.8.0] - 2025-11-10 "Task Groups"

### Added
- **Task Groups** (Phase 8)
  - Create named groups for organizing tasks (e.g., "House Renovation", "Work")
  - Group properties: name, description, color, icon
  - Automatic "Uncategorized" default group creation
  - Task group assignment during creation and editing
  - Filter tasks by group with sidebar navigation
  - Group-based color coding throughout the application
  - Task count per group display
  - Group CRUD operations with API endpoints
  - 27 tests for task group functionality

### Changed
- Task model extended with optional groupId
- Dashboard includes task group sidebar
- Task items display group badge with color
- Default group cannot be deleted

---

## [0.7.0] - 2025-11-01 "Task Deletion"

### Added
- **Task Deletion** (Phase 7)
  - Delete button with trash icon on task items
  - Confirmation dialog before deletion
  - Optimistic UI updates with rollback on error
  - Deletion logging for audit trail
  - User ownership validation

### Changed
- Task management now includes delete functionality
- Added error handling for failed deletions

---

## [0.6.0] - 2025-10-25 "Due Date Management"

### Added
- **Due Date Management** (Phase 6)
  - Set due dates on tasks with HTML5 date picker
  - Overdue task indicators with red highlighting
  - Due date display with formatting (relative dates)
  - Filter tasks by due date range
  - Sort tasks by due date
  - Overdue task counter in dashboard statistics
  - Date validation for task creation/editing

### Changed
- Task model includes dueDate field
- Task forms include date input
- Dashboard shows overdue task count

---

## [0.5.0] - 2025-10-15 "Task Prioritization"

### Added
- **Task Prioritization** (Phase 5)
  - Four priority levels: Critical, High, Medium, Low
  - Priority selector dropdown in task forms
  - Priority badge with color coding (red, orange, yellow, green)
  - Filter tasks by priority
  - Sort tasks by priority
  - Priority-based visual hierarchy

### Changed
- Task model includes priority field
- Task items display priority badges
- Dashboard includes priority filter

---

## [0.4.0] - 2025-10-05 "Basic Task Management"

### Added
- **Basic Task Management** (Phase 4)
  - Create tasks with title, description, priority, due date
  - View task list with sorting and filtering
  - Edit task details in modal
  - Mark tasks as complete/incomplete with toggle
  - Task dashboard with list view
  - Task statistics (total, completed)
  - Empty state UI for new users
  - Client-side form validation
  - 22 tests for task CRUD operations

### Changed
- Dashboard now displays task management interface
- Added task-specific navigation

---

## [0.3.0] - 2025-09-25 "User Authentication"

### Added
- **User Registration & Authentication** (Phase 3)
  - User registration with email and password
  - Secure login with JWT tokens
  - Logout functionality
  - Session management with token refresh
  - Password hashing with BCrypt
  - Rate limiting middleware
  - Protected routes requiring authentication
  - 22 tests for authentication flows

### Changed
- Application now requires authentication
- Added auth pages (login, register)
- JWT token storage in localStorage

---

## [0.2.0] - 2025-09-15 "Foundation"

### Added
- **Foundational Infrastructure** (Phase 2)
  - PostgreSQL database with Docker Compose
  - Entity Framework Core with DbContext
  - User and Task entities
  - EF Core migrations
  - JWT authentication middleware
  - Password hashing service
  - React + Vite frontend setup
  - Axios API client with interceptors
  - Authentication context
  - Protected route wrapper
  - Styled-components theming
  - Error boundary component
  - Global exception handling
  - CORS configuration
  - Logging with Serilog

---

## [0.1.0] - 2025-09-01 "Initial Setup"

### Added
- **Project Setup** (Phase 1)
  - Monorepo structure with pnpm workspaces
  - .NET Core 8.0 Web API project
  - React 18 + TypeScript + Vite frontend
  - xUnit testing framework for backend
  - Jest + Testing Library for frontend
  - ESLint and Prettier configuration
  - Git repository with .gitignore
  - Basic project documentation
  - Development scripts (start-dev.ps1, stop-dev.ps1, etc.)

### Infrastructure
- Docker Compose for local development
- PowerShell scripts for development workflow
- Solution structure with feature-based organization
- TypeScript strict mode configuration

---

## Version History Summary

| Version | Release Date | Codename | Key Features |
|---------|--------------|----------|--------------|
| 0.13.0 | 2026-01-18 | Events Foundation | Events system, dashboard restructure |
| 0.12.0 | 2025-12-20 | Calendar View | Monthly calendar with task visualization |
| 0.11.0 | 2025-12-15 | Weekly Progress | Analytics dashboard with charts |
| 0.10.0 | 2025-12-01 | Username System | Username authentication |
| 0.9.0 | 2025-11-20 | Polish | Dark mode, keyboard shortcuts, search |
| 0.8.0 | 2025-11-10 | Task Groups | Group-based task organization |
| 0.7.0 | 2025-11-01 | Task Deletion | Delete tasks with confirmation |
| 0.6.0 | 2025-10-25 | Due Dates | Due date management and overdue tracking |
| 0.5.0 | 2025-10-15 | Prioritization | Four-level task prioritization |
| 0.4.0 | 2025-10-05 | Task Management | Core CRUD operations for tasks |
| 0.3.0 | 2025-09-25 | Authentication | User registration and login |
| 0.2.0 | 2025-09-15 | Foundation | Database, API, frontend infrastructure |
| 0.1.0 | 2025-09-01 | Initial Setup | Project initialization |

---

## Upcoming Releases

### [0.14.0] - TBD "Task Attachments"
- File upload support for tasks
- Image preview functionality
- Document attachment management
- Storage integration

### [0.15.0] - TBD "Email Verification"
- Email confirmation on registration
- Resend verification email
- Password reset functionality
- Email service integration

### [0.16.0] - TBD "Dashboard Widgets"
- Clock/date widget with live time
- Upcoming events widget
- Task statistics widget with charts
- Calculator widget
- Drag-and-drop widget layout

### [0.17.0] - TBD "Header Navigation"
- Global search bar
- Notifications bell icon
- User menu dropdown
- Breadcrumb navigation

### [0.18.0] - TBD "Security Foundation"
- HTTPS enforcement
- CSRF protection
- XSS protection
- Rate limiting enhancements
- Audit logging
- Role-based access control (RBAC)

---

## Contributing

When adding features or fixes:

1. Update `VERSION.json` with version increment
2. Add entry to this CHANGELOG.md under appropriate section
3. Follow semantic versioning guidelines
4. Include breaking change notices when applicable
5. Update phase documentation in `specs/001-todo-app/tasks.md`
6. Create phase completion summary in `docs/phases/`
7. Update `TEST-INVENTORY.md` with new test counts

## Notes

- All dates use ISO 8601 format (YYYY-MM-DD)
- Version numbers follow [Semantic Versioning 2.0.0](https://semver.org/)
- Codenames are optional but recommended for major/minor releases
- Breaking changes are clearly marked in version metadata

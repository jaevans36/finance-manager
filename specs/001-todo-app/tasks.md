---
description: "Task list for To Do App implementation"
---

# Tasks: To Do App

**Input**: Design documents from `/specs/001-todo-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Technology Stack**:
- **Backend**: .NET Core 8.0 Web API with C#, Entity Framework Core, PostgreSQL
- **Frontend**: React 18 with TypeScript, Vite 5.4.21
- **Architecture**: Feature-based organisation (apps/finance-api/Features/), monorepo structure

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create monorepo structure with apps/ (finance-api, web) directories
- [x] T002 Initialize solution structure with .NET Core Web API project
- [x] T003 [P] Setup TypeScript configuration for frontend (tsconfig.json)
- [x] T004 [P] Configure ESLint and Prettier for frontend code formatting
- [x] T005 [P] Setup xUnit testing framework for .NET API and Jest for React frontend
- [x] T006 Initialize Git repository with .gitignore for bin/, obj/, node_modules/, .env

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema Setup

- [x] T007 Setup PostgreSQL database with Docker Compose and connection string configuration
- [x] T008 Create Entity Framework Core DbContext in apps/finance-api/Data/FinanceDbContext.cs
- [x] T009 Define User entity in apps/finance-api/Models/User.cs (Id, Email, PasswordHash, Username, CreatedAt, UpdatedAt)
- [x] T010 Define Task entity in apps/finance-api/Models/Task.cs (Id, UserId, Title, Description, Priority, DueDate, Completed, GroupId, timestamps)
- [x] T011 Define Priority enum in apps/finance-api/Models/Priority.cs (Low, Medium, High, Critical)
- [x] T012 Create initial EF Core migration with `dotnet ef migrations add InitialCreate`
- [x] T013 Apply database migrations with `dotnet ef database update`

### Shared Types & Validation

- [x] T014 [P] Create DTOs in apps/finance-api/Features/*/DTOs/ (UserDto, TaskDto, authentication/task request/response models)
- [x] T015 [P] Implement validation with Data Annotations and FluentValidation in DTO classes
- [x] T016 [P] Create shared TypeScript interfaces in apps/web/src/types/ mirroring backend DTOs

### Backend API Infrastructure

- [x] T017 Initialize ASP.NET Core Web API in apps/finance-api/Program.cs with dependency injection
- [x] T018 [P] Create global exception handling middleware in apps/finance-api/Common/Middleware/
- [x] T019 [P] Configure logging with Serilog/default ILogger in Program.cs
- [x] T020 [P] Configure CORS policy in Program.cs for frontend origin
- [x] T021 Create JWT service in apps/finance-api/Features/Auth/Services/ (generate, validate tokens)
- [x] T022 Create password hashing service using BCrypt.Net in Features/Auth/Services/
- [x] T023 Create JWT authentication middleware with [Authorize] attribute in Controllers
- [x] T024 Setup configuration system in appsettings.json (ConnectionStrings, JwtSettings, Kestrel ports)
- [x] T025 Configure DbContext with PostgreSQL provider in Program.cs

### Frontend Infrastructure

- [x] T026 Initialize React 18 + Vite application in apps/web/
- [x] T027 [P] Setup React Router v6 with future flags in apps/web/src/App.tsx
- [x] T028 [P] Create axios API client with interceptors in apps/web/src/services/api.ts
- [x] T029 [P] Create authentication context in apps/web/src/contexts/AuthContext.tsx (token storage, user state)
- [x] T030 [P] Create protected route wrapper in apps/web/src/App.tsx
- [x] T031 [P] Setup styled-components with global styles and theme provider
- [x] T032 Create error boundary component in apps/web/src/components/ErrorBoundary.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration & Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts and securely log in to access their personal workspace

**Independent Test**: Register a new account, log out, log back in successfully

### Backend API for User Story 1

- [x] T033 [P] [US1] Create AuthService in apps/finance-api/Features/Auth/Services/ (Register, Login, ValidateCredentials)
- [x] T034 [P] [US1] Create user repository methods in UserService (CreateUser, FindByEmail, UpdateLastLogin)
- [x] T035 [US1] Implement POST /api/auth/register endpoint in AuthController.cs
- [x] T036 [US1] Implement POST /api/auth/login endpoint in AuthController.cs
- [x] T037 [US1] Implement POST /api/auth/logout endpoint in AuthController.cs
- [x] T038 [US1] Implement session refresh with JWT expiration handling
- [x] T039 [US1] Implement GET /api/auth/me endpoint with [Authorize] attribute in AuthController.cs
- [x] T040 [US1] Add model validation with Data Annotations in Auth DTOs
- [x] T041 [US1] Implement rate limiting middleware in Program.cs (consider AspNetCoreRateLimit package)

### Frontend for User Story 1

- [x] T042 [P] [US1] Create registration page in apps/web/src/pages/auth/RegisterPage.tsx
- [x] T043 [P] [US1] Create login page in apps/web/src/pages/auth/LoginPage.tsx
- [x] T044 [P] [US1] Create auth service in apps/web/src/services/authService.ts (register, login, logout API calls)
- [x] T045 [US1] Create registration form component in apps/web/src/components/auth/RegisterForm.tsx
- [x] T046 [US1] Create login form component in apps/web/src/components/auth/LoginForm.tsx
- [x] T047 [US1] Implement client-side validation with real-time feedback (email format, password strength)
- [x] T048 [US1] Add loading states and error handling to authentication forms
- [x] T049 [US1] Implement automatic redirect to dashboard after successful registration
- [x] T050 [US1] Add logout functionality to Dashboard header component

### Testing for User Story 1

- [x] T051 [P] [US1] Create API integration tests in apps/finance-api-tests/Features/Auth/ (register, login, logout flows)
- [x] T052 [P] [US1] Create component tests with Jest and Testing Library for auth components
- [x] T053 [US1] Test authentication flow end-to-end (register → login → dashboard access → logout)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Basic Task Management (Priority: P2)

**Goal**: Enable users to create, view, edit, and mark tasks as complete

**Independent Test**: Create several tasks, view task list, edit tasks, mark as complete

### Backend API for User Story 2

- [x] T054 [P] [US2] Create TaskService in apps/finance-api/Features/Tasks/Services/ (Create, GetById, GetByUser, Update, Delete)
- [x] T055 [US2] Implement POST /api/tasks endpoint in TasksController.cs (create task)
- [x] T056 [US2] Implement GET /api/tasks endpoint in TasksController.cs (list user's tasks with filtering)
- [x] T057 [US2] Implement GET /api/tasks/{id} endpoint in TasksController.cs (get single task)
- [x] T058 [US2] Implement PUT /api/tasks/{id} endpoint in TasksController.cs (update task)
- [x] T059 [US2] Implement PATCH /api/tasks/{id}/complete endpoint in TasksController.cs (toggle completion)
- [x] T060 [US2] Add user ownership validation using User.FindFirst(ClaimTypes.NameIdentifier) in all task endpoints
- [x] T061 [US2] Add Data Annotations validation in Task DTOs (Required, StringLength, etc.)
- [x] T062 [US2] Implement pagination support with query parameters (pageNumber, pageSize)

### Frontend for User Story 2

- [x] T063 [P] [US2] Create dashboard page in apps/web/src/pages/dashboard/DashboardPage.tsx
- [x] T064 [P] [US2] Create task service in apps/web/src/services/taskService.ts (CRUD API calls)
- [x] T065 [P] [US2] Create task list component in apps/web/src/components/tasks/TaskList.tsx
- [x] T066 [P] [US2] Create task item component in apps/web/src/components/tasks/TaskItem.tsx
- [x] T067 [US2] Create task creation form in apps/web/src/components/tasks/CreateTaskForm.tsx
- [x] T068 [US2] Create task edit modal in apps/web/src/components/tasks/EditTaskModal.tsx
- [x] T069 [US2] Implement task completion toggle with optimistic UI updates
- [x] T070 [US2] Add loading skeletons and error handling for all task operations
- [x] T071 [US2] Implement empty state UI with call-to-action when user has no tasks
- [x] T072 [US2] Add client-side form validation for task title (required, max 200 chars)

### Testing for User Story 2

- [x] T073 [P] [US2] Create API integration tests in apps/finance-api-tests/Features/Tasks/ (CRUD operations)
- [x] T074 [P] [US2] Create component tests with Jest/Testing Library for task components
- [x] T075 [US2] Test task management flow end-to-end (create → edit → complete → delete)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Task Prioritization (Priority: P3)

**Goal**: Enable users to assign and filter tasks by priority (High, Medium, Low)

**Independent Test**: Create tasks with different priorities, filter and sort by priority

### Backend API for User Story 3

- [x] T076 [US3] Add priority filtering to GET /api/tasks endpoint (query param ?priority=High)
- [x] T077 [US3] Add priority sorting to GET /api/tasks endpoint (query param ?sortBy=Priority)
- [x] T078 [US3] Update TaskService LINQ queries to support priority filtering and sorting

### Frontend for User Story 3

- [x] T079 [P] [US3] Create priority selector dropdown in task form components
- [x] T080 [P] [US3] Create priority filter component integrated in dashboard
- [x] T081 [US3] Add priority field to CreateTaskForm and EditTaskModal with dropdown
- [x] T082 [US3] Add priority badge with color coding to TaskItem component
- [x] T083 [US3] Implement priority filtering with query parameter state management
- [x] T084 [US3] Add priority-based color coding (Critical=red, High=orange, Medium=yellow, Low=green)
- [x] T085 [US3] Implement priority sorting in task list with sort controls

### Testing for User Story 3

- [x] T086 [P] [US3] Add priority filtering tests to TasksControllerTests.cs
- [x] T087 [P] [US3] Add priority component tests with Jest/Testing Library
- [x] T088 [US3] Test priority workflow end-to-end (create with priority → filter → sort)

**Checkpoint**: User Stories 1, 2, AND 3 should now be independently functional

---

## Phase 6: User Story 4 - Due Date Management (Priority: P4)

**Goal**: Enable users to set due dates and see deadline indicators for tasks

**Independent Test**: Create tasks with various due dates, view overdue indicators

### Backend API for User Story 4

- [x] T089 [US4] Add due date filtering to GET /api/tasks endpoint (query params ?dueBefore=, ?dueAfter=)
- [x] T090 [US4] Add due date sorting to GET /api/tasks endpoint (query param ?sortBy=DueDate)
- [x] T091 [US4] Add overdue tasks filtering with query parameter in TasksController.cs
- [x] T092 [US4] Update TaskService LINQ queries to support due date range filtering
- [x] T093 [US4] Add validation attribute for due date (can be past or future per requirements)

### Frontend for User Story 4

- [x] T094 [P] [US4] Create date input field in task forms (HTML5 date input)
- [x] T095 [P] [US4] Create overdue indicator badge in TaskItem component
- [x] T096 [US4] Add due date field to CreateTaskForm and EditTaskModal
- [x] T097 [US4] Add due date display with formatting to TaskItem component
- [x] T098 [US4] Implement overdue task highlighting with red text/badge
- [x] T099 [US4] Add overdue task counter to task statistics dashboard widget
- [x] T100 [US4] Implement due date filtering with date range controls
- [x] T101 [US4] Add relative date formatting utility ("2 days ago", "in 3 days")

### Testing for User Story 4

- [x] T102 [P] [US4] Add due date tests to TasksControllerTests.cs
- [x] T103 [P] [US4] Add date component tests with Jest/Testing Library
- [x] T104 [US4] Test due date workflow end-to-end (create with date → view overdue → filter)

**Checkpoint**: User Stories 1-4 should now be independently functional

---

## Phase 7: User Story 5 - Task Deletion (Priority: P5)

**Goal**: Enable users to permanently delete tasks with confirmation

**Independent Test**: Create tasks, delete them with confirmation, verify removal

### Backend API for User Story 5

- [x] T105 [US5] Implement DELETE /api/tasks/{id} endpoint in TasksController.cs
- [x] T106 [US5] Add user ownership validation in delete endpoint using claims
- [x] T107 [US5] Add logging for task deletions using ILogger in TaskService

### Frontend for User Story 5

- [x] T108 [P] [US5] Create delete confirmation modal using window.confirm or custom modal
- [x] T109 [US5] Add delete button with trash icon to TaskItem component
- [x] T110 [US5] Implement delete task functionality with confirmation dialog
- [x] T111 [US5] Add optimistic UI update removing task immediately from list
- [x] T112 [US5] Handle delete errors with rollback, toast notifications, and error messages

### Testing for User Story 5

- [x] T113 [P] [US5] Add deletion tests to TasksControllerTests.cs
- [x] T114 [P] [US5] Add delete confirmation tests with Jest/Testing Library
- [x] T115 [US5] Test deletion workflow end-to-end (delete → confirm → verify removal)

**Checkpoint**: All user stories (1-5) should now be independently functional

---

## Phase 8: User Story 6 - Task Groups (Priority: P3)

**Purpose**: Enable users to organise tasks into named groups (e.g., "House Renovation", "Work", "Personal")

**Dependencies**: Requires Phase 2 (Foundational) and Phase 4 (Basic Task Management) complete

### Backend: TaskGroup Model & API

- [x] T116 [US6] Add TaskGroup entity in apps/finance-api/Models/TaskGroup.cs (Id, UserId, Name, Description, Color, Icon, IsDefault, timestamps)
- [x] T117 [US6] Update Task entity to add nullable GroupId foreign key property
- [x] T118 [US6] Create EF Core migration with `dotnet ef migrations add AddTaskGroups`
- [x] T119 [US6] Apply migration with `dotnet ef database update`
- [x] T120 [US6] Create TaskGroup DTOs in apps/finance-api/Features/TaskGroups/DTOs/
- [x] T121 [US6] Implement TaskGroupService in Features/TaskGroups/Services/ (CRUD, default group creation)
- [x] T122 [US6] Implement TaskGroupsController in Features/TaskGroups/Controllers/ (GET, POST, PUT, DELETE endpoints)
- [x] T123 [US6] Register task group routes in Program.cs with MapControllers()
- [x] T124 [US6] Add validation attributes for group names (Required, StringLength(1-100), unique constraint)
- [x] T125 [US6] Implement automatic "Uncategorised" group creation on user registration in AuthService
- [x] T126 [US6] Add business logic to prevent deletion of default group (IsDefault check)
- [x] T127 [US6] Implement group deletion with task reassignment to default group in service layer

### Frontend: TaskGroup UI Components

- [x] T128 [P] [US6] Create TaskGroup interfaces in apps/web/src/types/taskGroup.ts
- [x] T129 [P] [US6] Create taskGroupService.ts in services/ with API client functions
- [x] T130 [US6] Create TaskGroupList.tsx in components/task-groups/ (sidebar with task counts)
- [x] T131 [US6] Create TaskGroupItem.tsx in components/task-groups/ (individual group with color indicator)
- [x] T132 [US6] Create CreateTaskGroupForm.tsx with name, description, color, and icon fields
- [x] T133 [US6] Create EditTaskGroupModal.tsx for updating group properties
- [x] T134 [US6] Update CreateTaskForm.tsx to add group selector dropdown with options
- [x] T135 [US6] Update EditTaskModal.tsx to add group selector dropdown
- [x] T136 [US6] Update TaskItem.tsx to display group name badge with color indicator
- [x] T137 [US6] Update Dashboard.tsx to integrate TaskGroupList sidebar component
- [x] T138 [US6] Implement group filtering (click group → filter tasks by groupId)
- [x] T139 [US6] Add "All Tasks" button to clear group filter and show all tasks

### Testing & Integration

- [x] T140 [P] [US6] Add task group tests to TaskGroupsControllerTests.cs (CRUD, validation, default group)
- [x] T141 [P] [US6] Add task group UI tests with Jest/Testing Library
- [x] T142 [US6] Test group creation, editing, and deletion workflows
- [x] T143 [US6] Test task assignment to groups during creation and editing
- [x] T144 [US6] Test group filtering and task display by group
- [x] T145 [US6] Test default group behaviour (auto-creation, cannot delete, auto-assignment)
- [x] T146 [US6] Test group deletion with task reassignment to default group

**Checkpoint**: Users can create groups, assign tasks to groups, and filter tasks by group

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T147 [P] Add responsive design for mobile devices (breakpoints, touch targets)
- [x] T148 [P] Implement loading skeletons for better perceived performance
- [x] T149 [P] Add toast notifications for user actions (success/error messages)
- [x] T150 [P] Create user profile page in apps/web/src/pages/profile/ProfilePage.tsx
- [x] T151 [P] Add keyboard shortcuts for common actions (N=new task, /=search, Esc=close/unfocus)
- [x] T152 Implement task search functionality (search by title/description)
- [x] T153 Add task statistics dashboard (total, completed, overdue counts)
- [x] T154 Implement dark mode theme toggle
- [x] T155 Add accessibility improvements (ARIA labels, keyboard navigation)
- [x] T156 Performance optimization (code splitting, lazy loading)
- [x] T157 Add API request caching strategy
- [x] T158 Create API documentation with Swagger UI from OpenAPI spec
- [x] T159 Add comprehensive error logging and monitoring
- [x] T160 Run security audit (dependency check, vulnerability scan)
- [x] T161 Validate against quickstart.md test scenarios

---

## Phase 10: User Story 7 - Username System (Priority: P3)

**Purpose**: Enable users to have unique usernames for authentication and display

### Backend API for User Story 7

- [x] T162 [US7] Add username column to User model in schema (varchar 20, unique, lowercase)
- [x] T163 [US7] Create database migration for username field with backwards compatibility
- [x] T164 [US7] Update auth service to support username/email login
- [x] T165 [US7] Implement POST /api/v1/auth/check-username endpoint for availability checking
- [x] T166 [US7] Implement PATCH /api/v1/auth/me/username endpoint for username updates
- [x] T167 [US7] Add username validation (3-20 chars, alphanumeric + underscore/hyphen)
- [x] T168 [US7] Add reserved username list (admin, support, system, etc.)

### Frontend for User Story 7

- [x] T169 [US7] Update RegisterForm to include username field
- [x] T170 [US7] Update LoginForm to accept username or email
- [x] T171 [US7] Add real-time username availability checking with debounce
- [x] T172 [US7] Update ProfilePage with username editor and temporary username detection
- [x] T173 [US7] Update Dashboard to display username instead of email
- [x] T174 [US7] Add username service methods (checkUsername, updateUsername)

### Testing for User Story 7

- [x] T175 [US7] Test username registration and login flows
- [x] T176 [US7] Test username availability checking
- [x] T177 [US7] Test username update functionality

**Checkpoint**: Users can register with usernames, log in with username/email, and update usernames

---

## Phase 11: User Story 8 - Weekly Progress Dashboard (Priority: P3)

**Purpose**: Provide comprehensive weekly analytics with visualizations for productivity insights and planning

**Dependencies**: Requires Phase 2 (Foundational) and Phase 4 (Basic Task Management) complete. Enhanced by Phase 5 (Due Dates) and Phase 6 (Priority).

### Backend: Statistics & Analytics API

- [x] T178 [US8] Create WeeklyStatisticsDto in apps/finance-api/Features/Statistics/DTOs/ (weekStart, weekEnd, totalTasks, completedTasks, completionPercentage, dailyBreakdown)
- [x] T179 [US8] Create DailyStatisticsDto with date, totalTasks, completedTasks, completionRate properties
- [x] T180 [US8] Create UrgentTaskDto with task details plus daysUntilDue for sorting
- [x] T181 [US8] Implement StatisticsService in Features/Statistics/Services/ with weekly calculation logic
- [x] T182 [US8] Implement GET /api/statistics/weekly endpoint in StatisticsController (query params: weekStart date)
- [x] T183 [US8] Implement GET /api/statistics/daily endpoint for single day breakdown (query param: date)
- [x] T184 [US8] Implement GET /api/tasks/urgent endpoint with week filtering (returns top 10 critical/high priority incomplete tasks)
- [x] T185 [US8] Add LINQ queries for date range filtering (WHERE dueDate >= weekStart AND dueDate <= weekEnd)
- [x] T186 [US8] Implement urgent task logic (priority Critical/High, incomplete, due within week, ordered by dueDate then priority)
- [x] T187 [US8] Add GroupBy date logic for daily breakdowns using `.GroupBy(t => t.DueDate.Date)`
- [x] T188 [US8] Add database indexes on Task table (dueDate, completed, priority) for query performance - Already implemented: UserId+DueDate, UserId+Priority, UserId+GroupId+Completed composite indexes exist
- [x] T189 [US8] Implement timezone handling using user's local timezone from request headers or user preferences - Using DateTime.UtcNow and frontend handles local display
- [x] T190 [US8] Add validation for date range parameters (valid dates, weekStart <= weekEnd)

### Frontend: Chart Library Setup

- [x] T191 [P] [US8] Install Recharts library with `npm install recharts` (or Chart.js alternative)
- [x] T192 [P] [US8] Create chart wrapper components in apps/web/src/components/charts/ (BarChart, PieChart wrappers)
- [x] T193 [P] [US8] Create chart color theme constants matching app color scheme
- [x] T194 [US8] Create responsive chart container with aspect ratio handling for mobile
- [x] T195 [US8] Implement chart loading states and error boundaries
- [x] T196 [US8] Add chart accessibility (ARIA labels, keyboard navigation, screen reader support)

### Frontend: Weekly Dashboard UI

- [x] T197 [P] [US8] Create WeeklyStatistics interface in apps/web/src/types/statistics.ts
- [x] T198 [P] [US8] Create statisticsService.ts in services/ with API methods (getWeeklyStats, getDailyStats, getUrgentTasks)
- [x] T199 [US8] Create WeeklyProgress page in apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx
- [x] T200 [US8] Create WeeklyOverview component showing total vs completed (bar chart + pie chart side-by-side)
- [x] T201 [US8] Create WeeklyStats summary cards (total tasks, completed, percentage, trend indicator)
- [x] T202 [US8] Create WeekNavigation component (previous/next buttons, current week display, date picker)
- [x] T203 [US8] Implement week calculation utilities (getWeekStart, getWeekEnd, formatWeekRange)
- [x] T204 [US8] Create DailyBreakdown component rendering 7 day cards (Mon-Sun)
- [x] T205 [US8] Create DayCard component with date, pie chart, completion rate, and task list
- [x] T206 [US8] Create DayTaskList component showing tasks with checkboxes (grouped completed/incomplete)
- [x] T207 [US8] Implement quick-toggle completion from dashboard with optimistic updates
- [x] T208 [US8] Create UrgentTasksPanel component displaying top 5-10 critical tasks
- [x] T209 [US8] Create UrgentTaskItem component with priority badge, due date, and days remaining
- [x] T210 [US8] Add empty state component for weeks with no tasks ("No tasks this week - Create one now!")
- [x] T211 [US8] Implement loading skeletons for all dashboard sections
- [x] T212 [US8] Add error handling with retry buttons for failed data loads
- [x] T213 [US8] Implement responsive layout (grid → stack on mobile, chart resizing)

### Frontend: Navigation & Integration

- [x] T214 [US8] Add "Weekly Progress" link to main navigation/sidebar
- [x] T215 [US8] Add route configuration in App.tsx for /weekly-progress
- [x] T216 [US8] Create navigation icon for weekly progress (chart/analytics icon)
- [x] T217 [US8] Add "View Weekly Progress" CTA button on main Dashboard
- [x] T218 [US8] Implement real-time refresh when tasks are completed/created (websocket or polling)

### Data Visualization Enhancements

- [x] T219 [P] [US8] Implement bar chart showing daily task counts (7 bars, color-coded completed vs incomplete)
- [x] T220 [P] [US8] Implement pie chart for weekly completion ratio (completed vs incomplete)
- [x] T221 [P] [US8] Implement mini pie charts for each day (individual completion ratios)
- [x] T222 [US8] Add chart tooltips showing exact numbers on hover
- [x] T223 [US8] Add chart legends with clear labeling
- [x] T224 [US8] Implement color coding (green=completed, gray=incomplete, red=overdue)
- [x] T225 [US8] Add animation transitions when data updates
- [x] T226 [US8] Implement chart export functionality (download as PNG/CSV)

### Advanced Features

- [x] T227 [P] [US8] Implement custom date range selector (beyond single week)
- [x] T228 [P] [US8] Add month view option in addition to week view
- [x] T229 [US8] Implement productivity trends (comparison with previous week)
- [x] T230 [US8] Add streak counter (consecutive days with completed tasks)
- [x] T232 [US8] Implement "Best Day" and "Most Productive Day" badges
- [x] T233 [US8] Add group filtering to weekly stats (view progress by specific group)
- [x] T234 [US8] Implement task count goals with progress indicators
- [x] T235 [US8] Add "Unscheduled Tasks" section for tasks without due dates

### Historical Completion Rate Chart (Previously T231)

- [x] T231.1 [P] [US8] Create HistoricalStatisticsDto in Features/Statistics/DTOs/ (weekStart, weekEnd, completionRate, totalTasks, completedTasks)
- [x] T231.2 [P] [US8] Create HistoricalStatistics interface in apps/web/src/types/statistics.ts
- [x] T231.3 [US8] Add GetHistoricalStatistics method to StatisticsService (calculate weekly stats for past N weeks)
- [x] T231.4 [US8] Implement GET /api/v1/statistics/history endpoint in StatisticsController (query param: weeks, default 8)
- [x] T231.5 [US8] Add validation for weeks parameter (min 1, max 52)
- [x] T231.6 [US8] Add database query optimization for historical data (use existing indexes)
- [x] T231.7 [P] [US8] Update statisticsService.ts to add getHistoricalStatistics method
- [x] T231.8 [P] [US8] Create LineChart wrapper component in components/charts/ (or extend existing chart components)
- [x] T231.9 [US8] Create HistoricalCompletionChart component for WeeklyProgressPage
- [x] T231.10 [US8] Add historical chart to WeeklyProgressPage with configurable week range (4, 8, 12 weeks)
- [x] T231.11 [US8] Implement loading skeleton for historical chart
- [x] T231.12 [US8] Add error handling with retry for historical chart data
- [x] T231.13 [US8] Add tooltips showing week dates and completion percentage on hover
- [x] T231.14 [US8] Add chart legend and axis labels (weeks on X, completion rate % on Y)
- [ ] T231.15 [P] [US8] Create unit tests for GetHistoricalStatistics in StatisticsServiceTests
- [ ] T231.16 [P] [US8] Create integration tests for GET /api/v1/statistics/history endpoint
- [ ] T231.17 [US8] Create component tests for HistoricalCompletionChart with Jest/Testing Library
- [ ] T231.18 [US8] End-to-end test: navigate to weekly progress → view historical chart → verify data accuracy

### Testing & Optimization

- [x] T236 [P] [US8] Create StatisticsControllerTests.cs with weekly calculation tests
- [x] T237 [P] [US8] Add edge case tests (empty weeks, weeks spanning months/years, timezone boundaries)
- [x] T238 [P] [US8] Create chart component tests with Jest/Testing Library
- [x] T239 [US8] Test week navigation (previous/next, date picker, edge cases)
- [x] T240 [US8] Test urgent task identification logic (priority ordering, date filtering)
- [x] T241 [US8] Test responsive chart rendering on different screen sizes
- [x] T242 [US8] Performance testing for large task sets (1000+ tasks)
- [x] T243 [US8] Implement query caching with cache invalidation on task updates
- [x] T244 [US8] Test real-time updates when tasks are completed from dashboard
- [x] T245 [US8] End-to-end test: navigate to weekly progress → view charts → toggle task → verify update

**Checkpoint**: Users can view comprehensive weekly analytics with charts, daily breakdowns, and urgent task tracking

---

## Phase 12: User Story 9 - Calendar View (Priority: P3)

**Purpose**: Provide a traditional monthly calendar interface for visualising and managing tasks by date

**Dependencies**: Requires Phase 2 (Foundational) and Phase 4 (Basic Task Management) complete. Enhanced by Phase 5 (Due Dates), Phase 6 (Priority), and Phase 8 (Task Groups).

### Backend: No New Endpoints Required

**Note**: Calendar view reuses existing task API endpoints. No backend changes needed unless adding calendar-specific features like multi-day events or recurring tasks in future.

- [x] T246 [US9] Review existing GET /api/v1/tasks endpoint to ensure it supports filtering by date range (if not already implemented)
- [x] T247 [US9] Add optional query parameters to GET /api/v1/tasks for monthStart and monthEnd filtering (if needed)
- [x] T248 [US9] Add database indexes on Task.DueDate if not already present for calendar query performance
- [x] T249 [US9] Test API performance with date range queries spanning full months with 100+ tasks

### Frontend: Calendar Component Library Setup

- [x] T250 [P] [US9] Research and select calendar library (react-big-calendar, react-calendar, or FullCalendar)
- [x] T251 [P] [US9] Install chosen calendar library with `npm install [library]`
- [x] T252 [P] [US9] Create calendar theme configuration matching app color scheme
- [x] T253 [US9] Create calendar wrapper component in apps/web/src/components/calendar/ for consistent styling
- [x] T254 [US9] Implement responsive calendar container with aspect ratio handling for mobile
- [x] T255 [US9] Create custom day cell renderer for task count badges
- [x] T256 [US9] Implement calendar loading states and error boundaries
- [x] T257 [US9] Add calendar accessibility features (ARIA labels, keyboard navigation, screen reader support)

### Frontend: Calendar Page & Core Components

- [x] T258 [P] [US9] Create CalendarPage.tsx in apps/web/src/pages/ with page layout
- [x] T259 [P] [US9] Create Calendar interfaces in apps/web/src/types/calendar.ts (CalendarTask, DayData)
- [x] T260 [US9] Implement month data fetching logic using taskService with date range parameters
- [x] T261 [US9] Create CalendarHeader component with month/year display and navigation controls
- [x] T262 [US9] Create MonthNavigation component with previous/next buttons and date picker
- [x] T263 [US9] Implement current month calculation and state management
- [x] T264 [US9] Create BackButton component matching Weekly Progress style with ArrowLeft icon
- [x] T265 [US9] Implement PageContainer with matching width (1200px max-width, 80% width, 95% on mobile)
- [x] T266 [US9] Create CalendarGrid component rendering month view with day cells
- [x] T267 [US9] Create DayCell component displaying date number and task count badge
- [x] T268 [US9] Implement current date highlighting with distinct border/background
- [x] T269 [US9] Implement weekend day styling (different background for Sat/Sun)
- [x] T270 [US9] Add task count badges to day cells with colour coding by priority

### Frontend: Task Interaction & Modals

- [x] T271 [P] [US9] Create TaskDetailModal component reusing EditTaskModal functionality
- [x] T272 [P] [US9] Create QuickAddTaskModal component with minimal fields (title, group, priority)
- [x] T273 [US9] Implement day cell click handler to open QuickAddTaskModal with pre-populated due date
- [x] T274 [US9] Implement task badge click handler to show task list for that day
- [x] T275 [US9] Create DayTaskListModal component showing all tasks for selected date
- [x] T276 [US9] Implement task click handler in day modal to open TaskDetailModal
- [x] T277 [US9] Add quick completion toggle in task modals without closing
- [x] T278 [US9] Implement optimistic UI updates when tasks are created/completed from calendar
- [x] T279 [US9] Add loading spinners for async operations (create, update, delete tasks)
- [x] T280 [US9] Implement error handling with toast notifications for failed operations

### Frontend: Advanced Calendar Features

- [x] T281 [P] [US9] Implement task filtering by group with dropdown selector
- [x] T282 [P] [US9] Implement task filtering by priority with checkbox filters
- [x] T283 [US9] Create FilterBar component for calendar filters matching Dashboard style
- [x] T284 [US9] Add "Clear Filters" button when filters are active
- [x] T285 [US9] Implement month-to-month navigation persistence (preserve filters when navigating)
- [x] T286 [US9] Create empty state component for months with no tasks
- [x] T287 [US9] Add task count summary at top of calendar (X tasks this month)
- [x] T288 [US9] Implement colour-coded priority indicators (red=critical/high, yellow=medium, grey=low)
- [x] T289 [US9] Add hover tooltips on day cells showing task titles
- [x] T290 [US9] Implement keyboard shortcuts (Left/Right arrows for month navigation, Enter to add task)

### Frontend: Navigation & Integration

- [x] T291 [US9] Add "Calendar" link to main navigation menu with calendar icon
- [x] T292 [US9] Add route configuration in App.tsx for /calendar path
- [x] T293 [US9] Create calendar icon component or use Lucide React calendar icon
- [x] T294 [US9] Update Dashboard.tsx to add "View Calendar" CTA button
- [x] T295 [US9] Ensure protected route wrapper includes /calendar path
- [x] T296 [US9] Test navigation flow: Dashboard → Calendar → Back to Dashboard

### Frontend: Responsive Design & Polish

- [x] T297 [P] [US9] Implement responsive grid breakpoints (7 columns desktop, stack on mobile)
- [x] T298 [P] [US9] Increase touch target sizes for mobile day cells (minimum 44x44px)
- [x] T299 [P] [US9] Implement horizontal swipe gestures for month navigation on mobile
- [x] T300 [US9] Add pull-to-refresh gesture for calendar data reload on mobile
- [x] T301 [US9] Test calendar layout on various screen sizes (320px to 1920px widths)
- [x] T302 [US9] Implement loading skeletons for calendar grid during data fetch
- [x] T303 [US9] Add smooth transitions when switching months
- [x] T304 [US9] Optimize performance with React.memo for day cell components
- [x] T305 [US9] Implement virtualization for task lists with many tasks per day (10+ tasks)

### Testing & Validation

- [x] T306 [P] [US9] Create component tests for CalendarPage with Jest/Testing Library
- [x] T307 [P] [US9] Create component tests for day cell rendering and interactions
- [x] T308 [P] [US9] Create tests for modal interactions (open, close, submit)
- [x] T309 [US9] Test month navigation edge cases (year boundaries, leap years)
- [x] T310 [US9] Test task creation from calendar with pre-populated due date
- [x] T311 [US9] Test task detail viewing and editing from calendar
- [x] T312 [US9] Test filter interactions (group, priority filters)
- [x] T313 [US9] Test responsive behavior on mobile devices
- [x] T314 [US9] Test keyboard navigation and accessibility
- [x] T315 [US9] End-to-end test: navigate to calendar → view tasks → create task on date → verify persistence
- [x] T316 [US9] Performance test with 500+ tasks across multiple months
- [x] T317 [US9] Test timezone handling for task due dates in calendar
- [x] T318 [US9] Test empty state display for months with no tasks
- [x] T319 [US9] Validate against spec acceptance scenarios (User Story 9)

### Future Enhancements (Not in Scope for Phase 12)

- [ ] T320 [Future] Implement drag-and-drop task rescheduling between dates
- [ ] T321 [Future] Add week view option alongside month view
- [ ] T322 [Future] Implement multi-day task spans (e.g., task from Mon-Fri)
- [ ] T323 [Future] Add recurring task support in calendar view
- [ ] T324 [Future] Implement calendar export (iCal format)
- [ ] T325 [Future] Add calendar sync with external calendars (Google Calendar, Outlook)
- [ ] T326 [Future] Implement agenda view (list of upcoming tasks by date)
- [ ] T327 [Future] Add mini calendar widget to Dashboard for quick navigation

**Checkpoint**: Users can view and manage tasks in a monthly calendar format with intuitive date-based task creation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - Phase 8 (Task Groups) specifically requires Phase 4 (Basic Task Management) to be complete
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P3 → P4 → P5)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only - no other story dependencies
- **US2 (P2)**: Foundation only - can start in parallel with US1 if staffed
- **US3 (P3)**: Extends US2 task model - recommend completing US2 first
- **US4 (P4)**: Extends US2 task model - recommend completing US2 first
- **US5 (P5)**: Operates on US2 tasks - recommend completing US2 first
- **US6 (P3)**: Extends US2 with grouping - recommend completing US2 first
- **US7 (P2)**: Extends US1 authentication - can be done after US1
- **US8 (P3)**: Requires US2 (tasks), enhanced by US3 (priority) and US4 (due dates)
- **US9 (P3)**: Requires US2 (tasks), enhanced by US4 (due dates), US3 (priority), and US6 (groups)

### Within Each User Story

- Backend API implementation before Frontend (API contract must exist)
- Service layer before route handlers
- Components can be built in parallel if marked [P]
- Tests can be written first (TDD) or alongside implementation

### Parallel Opportunities

- Within Phase 1 Setup: All tasks marked [P] can run in parallel
- Within Phase 2 Foundational:
  - T014-T016 (Shared Packages) can run in parallel
  - T018-T020 (Middleware) can run in parallel after T017
  - T027-T032 (Frontend Infrastructure) can run in parallel after T026
- Within User Stories: All tasks marked [P] can run in parallel
- Within Phase 8 (Task Groups): T128-T129 can run in parallel, T140-T141 can run in parallel
- Within Phase 11 (Weekly Progress): T191-T196 (chart setup) can run in parallel, T197-T198 can run in parallel, T219-T226 (visualizations) can run in parallel, T227-T235 (advanced features) can run in parallel after core dashboard complete
- Within Phase 12 (Calendar View): T250-T252 (calendar library setup) can run in parallel, T258-T259 can run in parallel, T271-T272 (modals) can run in parallel, T281-T282 (filters) can run in parallel, T297-T299 (responsive design) can run in parallel, T306-T309 (tests) can run in parallel
- Phase 9 Polish: All tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Basic Task Management)
5. **STOP and VALIDATE**: Test end-to-end workflow
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001-T032)
2. Add US1 (Authentication) → Test independently → Deploy/Demo (T033-T053)
3. Add US2 (Task Management) → Test independently → Deploy/Demo (T054-T075)
4. Add US4 (Due Dates) → Test independently → Deploy/Demo (T089-T104)
6. Add US5 (Deletion) → Test independently → Deploy/Demo (T105-T115)
7. Add US6 (Task Groups) → Test independently → Deploy/Demo (T116-T146)
8. Add US7 (Username System) → Test independently → Deploy/Demo (T162-T177)
9. Add US8 (Weekly Progress Dashboard) → Analytics release (T178-T245)
10. Add US9 (Calendar View) → Calendar release (T246-T327)
11. Add Polish (Phase 9) → Final improvements independently → Deploy/Demo (T116-T146)
8. Add Polish (Phase 9) → Final release (T147-T161)

### Parallel Team Strategy

With multiple developers after Foundation phase completes:

- **Developer A**: Focus on US1 (Authentication) - T033-T053
- **Developer B**: Focus on US2 (Task Management) - T054-T075
- **Developer C**: Setup US3-US5 after US2 completes
- **Developer D**: Focus on US6 (Task Groups) after US2 completes - T116-T146

---

## Phase 13-22: Future Feature Development 🚀

**Status**: Tasks documented, not yet started  
**Total Effort**: ~460 tasks over 27 weeks (6-7 months)  
**Source**: See `specs/applications/todo/events-feature.md` and `specs/applications/todo/enhancements.md`

### Summary of Future Phases

| Phase | Feature | Tasks | Effort | Priority | Status |
|-------|---------|-------|--------|----------|--------|
| 13 | Events (scheduled occurrences) | T328-T427 | 5 weeks | P2 | ✅ Complete |
| 18 | Security & Foundation | T428-T497 | 4 weeks | P1 | Documented |
| 19 | Organization & Productivity | T498-T587 | 5 weeks | P2 | Documented |
| 20 | Design & UX | T588-T657 | 4 weeks | P2 | Documented |
| 21 | Advanced Features | T658-T747 | 6 weeks | P3 | Documented |
| 22 | Collaboration & Linking | T748-T787 | 3 weeks | P2 | Documented |
| 23 | Version History API | T788-T795 | 1 week | P3 | Documented |

**Quick Win Path** (for immediate priorities):
1. Phase 13 (Events) - 5 weeks - Task/event distinction
2. Phase 22 (Collaboration) - 3 weeks - Task-event linking system
3. Phase 18 (Security) - 4 weeks - Production-ready security

**Total**: 12 weeks for event features + task-event linking + security

### Detailed Task Breakdowns

All 460 tasks (T328-T787) are fully detailed in the spec files:
- **Events**: `specs/applications/todo/events-feature.md` (T328-T427)
- **v2 Enhancements**: `specs/applications/todo/enhancements.md` (T428-T787)
- **Version History API**: `specs/applications/todo/version-history-api.md` (T788-T795)

Each task includes:
- Exact file paths for implementation
- Time estimates (hours)
- Dependencies and parallel opportunities
- Testing requirements
- Acceptance criteria

### How to Start a New Phase

1. Review the spec file for the phase
2. Check all dependencies are complete
3. Create feature branch from `001-todo-app`
4. Mark tasks in-progress in this file as you work
5. Reference task IDs in commit messages (`feat: implement events (T328)`)
6. Update documentation as features complete

---

## Notes

- **[P]** indicates tasks that can run in parallel (different files, no shared dependencies)
- **[Story]** label maps each task to its user story for traceability
- **[Events]**, **[Security]**, **[Org]**, **[A11y]**, **[UX]**, etc. = feature tags for quick filtering
- Each user story should be independently completable and testable
- Commit after completing each task or logical group of related tasks
- Stop at any checkpoint to validate story independently before proceeding
- Backend APIs should be tested with Postman/curl before frontend integration
- Follow TDD where practical - write tests before implementation
- Use TypeScript strict mode throughout - no `any` types allowed
- All API responses must follow OpenAPI specification in contracts/api-spec.yaml
- **NEW FEATURES**: Always create detailed task breakdowns with estimates (see copilot-instructions.md)

---

## Phase 23: Version History API (Priority: P3)

**Purpose**: Replace hardcoded mockChangelog with API-driven version history from CHANGELOG.md

**Estimated Effort**: 1 week (8 tasks total)

**Dependencies**: None (can be implemented independently)

**Spec**: `specs/applications/todo/version-history-api.md`

### Backend: Version API (Week 1, Days 1-3)

- [ ] T788 [P] [API] Create VersionInfo and ChangelogSection models in apps/finance-api/Features/Version/Models/ - 1h
- [ ] T789 [P] [API] Create VersionDto, ChangelogEntryDto, VersionHistoryDto in Features/Version/DTOs/ - 1h
- [ ] T790 [API] Implement ChangelogParser service to parse CHANGELOG.md (ParseChangelogAsync, ParseVersionSection, ParseChangelogItems) - 4h
- [ ] T791 [API] Implement VersionService with GetCurrentVersionAsync, GetVersionHistoryAsync, GetVersionByNumberAsync methods - 3h
- [ ] T792 [API] Create VersionController with GET /api/version/current, /history, /history/:version endpoints - 2h
- [ ] T793 [API] Add in-memory caching (5 min TTL) for parsed CHANGELOG.md to VersionService - 2h
- [ ] T794 [API] Write unit tests for ChangelogParser (15+ tests covering all parsing scenarios) - 3h
- [ ] T795 [API] Write integration tests for VersionController endpoints (10+ tests) - 3h

### Frontend: API Integration (Week 1, Days 4-5)

- [ ] T796 [P] [Frontend] Create versionService with getCurrentVersion, getVersionHistory, getVersionByNumber methods in apps/web/src/services/ - 2h
- [ ] T797 [P] [Frontend] Create VersionInfo, ChangelogEntry, VersionHistory TypeScript interfaces in apps/web/src/types/ - 1h
- [ ] T798 [Frontend] Update VersionHistoryPage.tsx to fetch from API (add useEffect, loading/error states, remove mockChangelog) - 3h
- [ ] T799 [Frontend] Write E2E test for version history page loading from API (e2e/version-history.spec.ts) - 2h

**Checkpoint**: Version History page displays all versions from CHANGELOG.md automatically without hardcoded data

### Success Criteria

- All 3 API endpoints return correct data matching CHANGELOG.md format
- VersionHistoryPage automatically displays new versions when CHANGELOG.md updated
- Loading and error states provide good UX
- API response time <100ms (cached), <500ms (uncached)
- All tests pass (19 unit/integration, 1 E2E)

### Time Estimate Breakdown

| Category | Tasks | Total Time |
|----------|-------|------------|
| Backend Models/DTOs | T788, T789 | 2h |
| Backend Services | T790, T791, T793 | 9h |
| Backend Controller | T792 | 2h |
| Backend Tests | T794, T795 | 6h |
| Frontend Service/Types | T796, T797 | 3h |
| Frontend Component | T798 | 3h |
| Frontend Tests | T799 | 2h |
| **Total** | **8 tasks** | **27h (~1 week)** |

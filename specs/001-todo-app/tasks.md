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

## Phase 14: Admin Dashboard & System Management (Priority: P2)

**Purpose**: Comprehensive admin interface for user management, system monitoring, and application configuration

**Estimated Effort**: 3 weeks (45 tasks total)

**Dependencies**: Phases 1-13 complete

### Backend: Admin API & Database (Week 1, Days 1-3)

- [ ] T320 [P] [Admin] Create ActivityLog entity in apps/finance-api/Features/Admin/Models/ (Id, UserId, Action, EntityType, EntityId, IpAddress, UserAgent, Timestamp) - 1h
- [ ] T321 [P] [Admin] Create SystemMetrics entity for storing performance data (RequestCount, ErrorCount, AvgResponseTime, Timestamp) - 1h
- [ ] T322 [Admin] Create database migration for ActivityLog and SystemMetrics tables - 1h
- [ ] T323 [Admin] Apply migration with `dotnet ef database update` - 0.5h
- [ ] T324 [P] [Admin] Create AdminService in Features/Admin/Services/ with user management methods - 3h
- [ ] T325 [P] [Admin] Create SystemMetricsService for collecting and retrieving system statistics - 2h
- [ ] T326 [Admin] Implement activity logging middleware to track all API requests - 3h
- [ ] T327 [Admin] Add admin role to User entity and migration (IsAdmin boolean field) - 1h
- [ ] T328 [Admin] Create authorization policy for admin-only endpoints - 2h
- [ ] T329 [Admin] Implement GET /api/admin/users endpoint (list all users with pagination) - 2h
- [ ] T330 [Admin] Implement GET /api/admin/users/{id} endpoint (get user details with task/event counts) - 2h
- [ ] T331 [Admin] Implement PUT /api/admin/users/{id} endpoint (update user, toggle admin status) - 2h
- [ ] T332 [Admin] Implement DELETE /api/admin/users/{id} endpoint (soft delete with data retention) - 2h
- [ ] T333 [Admin] Implement POST /api/admin/users/{id}/reset-password endpoint (force password reset) - 2h
- [ ] T334 [Admin] Implement GET /api/admin/activity endpoint (activity logs with filtering) - 2h
- [ ] T335 [Admin] Implement GET /api/admin/metrics endpoint (system metrics over time range) - 2h
- [ ] T336 [Admin] Add database indexes on ActivityLog (UserId, Timestamp, Action) - 1h

### Frontend: Admin Dashboard UI (Week 2, Days 1-5)

- [ ] T337 [P] [Admin] Create admin route guard checking user.isAdmin in App.tsx - 1h
- [ ] T338 [P] [Admin] Create AdminDashboard page in apps/web/src/pages/admin/ - 3h
- [ ] T339 [P] [Admin] Create adminService.ts with API client methods - 2h
- [ ] T340 [Admin] Create UserManagement component with search and filtering - 4h
- [ ] T341 [Admin] Create UserDetailsModal showing user stats and actions - 3h
- [ ] T342 [Admin] Create UserEditForm for updating user information - 3h
- [ ] T343 [Admin] Implement user deletion with confirmation and cascade options - 2h
- [ ] T344 [Admin] Create ActivityLogViewer component with timeline display - 4h
- [ ] T345 [Admin] Create ActivityLogFilters (user, action, date range, entity type) - 3h
- [ ] T346 [Admin] Create SystemMetricsChart component using Recharts - 4h
- [ ] T347 [Admin] Create MetricsSummaryCards (requests/day, errors, avg response time) - 3h
- [ ] T348 [Admin] Implement real-time metrics updates with polling/WebSocket - 3h
- [ ] T349 [Admin] Create SystemHealthIndicator component (green/yellow/red status) - 2h
- [ ] T350 [Admin] Add admin navigation link in header (visible only to admins) - 1h
- [ ] T351 [Admin] Create UserBulkActions component (bulk delete, export) - 3h

### Testing & Validation (Week 3, Days 1-2)

- [ ] T352 [P] [Admin] Create unit tests for AdminService (user management methods) - 3h
- [ ] T353 [P] [Admin] Create unit tests for SystemMetricsService - 2h
- [ ] T354 [P] [Admin] Create integration tests for admin endpoints - 4h
- [ ] T355 [Admin] Test authorization (non-admins cannot access admin endpoints) - 2h
- [ ] T356 [Admin] Test activity logging captures all API requests - 2h
- [ ] T357 [Admin] Create component tests for admin UI components - 3h
- [ ] T358 [Admin] Create E2E test: admin logs in → manages users → views metrics - 4h
- [ ] T359 [Admin] Test performance with 10,000+ activity log entries - 2h

**Checkpoint**: Admins can manage users, view system activity, and monitor application health

---

## Phase 13.5: Subtasks & Hierarchical Task Management (Priority: P2)

**Purpose**: Enable users to break down complex tasks into smaller, manageable subtasks with visual hierarchy, drag-and-drop reordering, and progress tracking

**Estimated Effort**: 5 weeks (70 tasks total)

**Dependencies**: Phase 4 (Basic Task Management) complete

**Specification**: `specs/applications/todo/subtasks-feature.md`

**User Stories**: US-13.5.1 (Create/Manage), US-13.5.2 (Nested), US-13.5.3 (Drag-Drop), US-13.5.4 (Bulk Actions), US-13.5.5 (Progress Visualization)

### Backend: Database Schema (Week 1, Day 1)

- [ ] T800 [P] [Subtasks] Add ParentTaskId column to Task entity (nullable, self-referential FK to Task.Id) - 1h
- [ ] T801 [P] [Subtasks] Add Depth column to Task entity (int, default 0, max 5 for nesting limit) - 0.5h
- [ ] T802 [P] [Subtasks] Add Order column to Task entity (int, for user-defined subtask sequencing) - 0.5h
- [ ] T803 [Subtasks] Create database migration for subtask columns - 1h
- [ ] T804 [Subtasks] Add indexes on (ParentTaskId), (ParentTaskId, Order), (ParentTaskId, Completed) - 1h
- [ ] T805 [Subtasks] Apply migration with `dotnet ef database update` - 0.5h
- [ ] T806 [Subtasks] Update Task entity with navigation properties (ParentTask, Subtasks collection) - 1h
- [ ] T807 [Subtasks] Configure cascade delete behavior (configurable: cascade or orphan promotion) - 1h

### Backend: Core Services (Week 1, Days 2-3)

- [ ] T808 [P] [Subtasks] Create SubtaskService in Features/Tasks/Services/ - 2h
- [ ] T809 [P] [Subtasks] Implement CreateSubtaskAsync(parentId, dto) with depth validation - 2h
- [ ] T810 [P] [Subtasks] Implement GetSubtasksAsync(parentId, depth) with recursive CTE query - 3h
- [ ] T811 [Subtasks] Implement CalculateProgressAsync(parentId) returning completed/total counts - 2h
- [ ] T812 [Subtasks] Implement MoveSubtaskAsync(subtaskId, newParentId) with circular dependency check - 3h
- [ ] T813 [Subtasks] Implement ReorderSubtasksAsync(parentId, orderedIds[]) - 2h
- [ ] T814 [Subtasks] Implement BulkCreateSubtasksAsync(parentId, titles[]) - 2h
- [ ] T815 [Subtasks] Implement GetTaskTreeAsync(rootTaskId) for full hierarchy - 3h
- [ ] T816 [Subtasks] Add ValidateDepthAsync to prevent nesting beyond 5 levels - 1h
- [ ] T817 [Subtasks] Add ValidateCircularDependency to prevent task becoming subtask of descendant - 2h

### Backend: API Endpoints (Week 1, Days 4-5)

- [ ] T818 [P] [Subtasks] Create SubtasksController in Features/Tasks/Controllers/ - 1h
- [ ] T819 [P] [Subtasks] Implement POST /api/tasks/{id}/subtasks (create single subtask) - 2h
- [ ] T820 [P] [Subtasks] Implement GET /api/tasks/{id}/subtasks (list with ?depth=all query param) - 2h
- [ ] T821 [Subtasks] Implement PUT /api/tasks/{id}/move (move to different parent, body: newParentId) - 2h
- [ ] T822 [Subtasks] Implement PUT /api/tasks/{id}/subtasks/reorder (body: orderedIds[]) - 2h
- [ ] T823 [Subtasks] Implement POST /api/tasks/{id}/subtasks/bulk (create multiple, body: titles[]) - 2h
- [ ] T824 [Subtasks] Implement PUT /api/tasks/{id}/subtasks/bulk-complete (mark all complete) - 2h
- [ ] T825 [Subtasks] Update GET /api/tasks to include subtaskCount, completedSubtaskCount, hasSubtasks - 2h
- [ ] T826 [Subtasks] Update GET /api/tasks/{id} to include subtasks with ?includeSubtasks=true - 2h
- [ ] T827 [Subtasks] Update DELETE /api/tasks/{id} to support ?deleteMode=cascade|orphan - 2h
- [ ] T828 [Subtasks] Add authorization checks (user owns parent and subtask) - 1h

### Backend: Auto-Completion Logic (Week 2, Day 1)

- [ ] T829 [P] [Subtasks] Implement OnSubtaskCompletedAsync event handler - 2h
- [ ] T830 [P] [Subtasks] Add logic to auto-complete parent when all subtasks complete (configurable) - 2h
- [ ] T831 [Subtasks] Add logic to prompt user when marking parent complete with incomplete subtasks - 2h
- [ ] T832 [Subtasks] Create UserSubtaskSettings entity (userId, autoCompleteParent boolean) - 1h
- [ ] T833 [Subtasks] Add GET/PUT /api/users/settings/subtasks endpoint for preferences - 2h

### Frontend: Core Components (Week 2, Days 2-5)

- [ ] T834 [P] [Subtasks] Create SubtaskList.tsx component in apps/web/src/components/tasks/ - 3h
- [ ] T835 [P] [Subtasks] Create SubtaskItem.tsx component with completion checkbox and edit button - 3h
- [ ] T836 [P] [Subtasks] Create SubtaskForm.tsx inline creation form - 2h
- [ ] T837 [P] [Subtasks] Create SubtaskProgress.tsx progress bar component - 2h
- [ ] T838 [Subtasks] Implement expand/collapse functionality with chevron icon animation - 2h
- [ ] T839 [Subtasks] Add localStorage persistence for expand/collapse state - 1h
- [ ] T840 [Subtasks] Create subtaskService.ts in apps/web/src/services/ with API methods - 2h
- [ ] T841 [Subtasks] Create Subtask TypeScript interface in apps/web/src/types/ - 1h
- [ ] T842 [Subtasks] Implement visual hierarchy with indentation (20px per level) - 2h
- [ ] T843 [Subtasks] Add connecting lines showing parent-child relationships - 3h
- [ ] T844 [Subtasks] Integrate SubtaskList into TaskDetail.tsx component - 2h
- [ ] T845 [Subtasks] Add "Add Subtask" button to TaskDetail page - 1h
- [ ] T846 [Subtasks] Update TaskItem.tsx to show subtask count badge and progress bar - 3h

### Frontend: Progress Visualization (Week 3, Days 1-2)

- [ ] T847 [P] [Subtasks] Create horizontal progress bar with color gradient (red→yellow→green) - 2h
- [ ] T848 [P] [Subtasks] Add progress percentage label and fractional completion (3/7) - 1h
- [ ] T849 [Subtasks] Implement animated progress bar transitions (300ms ease-out) - 2h
- [ ] T850 [Subtasks] Add progress ring component for dashboard widgets - 3h
- [ ] T851 [Subtasks] Create hover tooltip showing detailed progress (X complete, Y overdue, Z upcoming) - 2h
- [ ] T852 [Subtasks] Add subtask icon badge with count indicator on parent tasks - 2h
- [ ] T853 [Subtasks] Update Dashboard.tsx to show subtask progress in Today/Upcoming widgets - 2h
- [ ] T854 [Subtasks] Add visual indicators for overdue subtasks (red dot) - 1h

### Frontend: Drag-and-Drop (Week 3, Days 3-5)

- [ ] T855 [P] [Subtasks] Install @dnd-kit/core and @dnd-kit/sortable packages - 0.5h
- [ ] T856 [P] [Subtasks] Create SubtaskDragContext wrapping SubtaskList - 2h
- [ ] T857 [P] [Subtasks] Add drag handle icon (⋮⋮) to SubtaskItem with grab cursor - 1h
- [ ] T858 [Subtasks] Implement drag-to-reorder within same parent with smooth animations - 4h
- [ ] T859 [Subtasks] Implement drag-to-move between different parents with drop zones - 4h
- [ ] T860 [Subtasks] Add parent task highlight on drag-over (blue border) - 2h
- [ ] T861 [Subtasks] Implement drag-to-root-level (promote subtask to parent task) - 3h
- [ ] T862 [Subtasks] Create custom drag preview with SubtaskDragLayer.tsx - 2h
- [ ] T863 [Subtasks] Auto-expand parent task after 1 second hover during drag - 2h
- [ ] T864 [Subtasks] Add ESC key cancel and invalid drop zone handling - 1h
- [ ] T865 [Subtasks] Implement optimistic UI updates for instant feedback - 2h
- [ ] T866 [Subtasks] Debounce reorder API calls (300ms) to reduce server load - 1h

### Frontend: Advanced Features (Week 4, Days 1-3)

- [ ] T867 [P] [Subtasks] Create SubtaskQuickAdd.tsx for multi-line rapid creation - 3h
- [ ] T868 [P] [Subtasks] Implement quick add mode (one title per line, Enter to add next) - 2h
- [ ] T869 [P] [Subtasks] Create SubtaskBulkActions.tsx toolbar component - 3h
- [ ] T870 [Subtasks] Add checkbox selection mode for bulk operations - 2h
- [ ] T871 [Subtasks] Implement "Bulk Complete" with confirmation dialog - 2h
- [ ] T872 [Subtasks] Implement "Bulk Delete" with confirmation dialog - 2h
- [ ] T873 [Subtasks] Implement "Change Priority" bulk action - 2h
- [ ] T874 [Subtasks] Implement "Set Due Date" bulk action with date picker - 2h
- [ ] T875 [Subtasks] Implement "Move to Another Task" bulk action with task selector - 3h
- [ ] T876 [Subtasks] Add context menu on parent task (right-click options) - 2h
- [ ] T877 [Subtasks] Implement nested subtasks (multi-level) UI with proper indentation - 3h
- [ ] T878 [Subtasks] Add breadcrumb trail for deep hierarchy navigation - 2h
- [ ] T879 [Subtasks] Add warning at 4 levels: "Consider breaking into separate tasks" - 1h
- [ ] T880 [Subtasks] Block creation at 6th level with error message - 1h

### Frontend: Mobile & Accessibility (Week 4, Days 4-5)

- [ ] T881 [P] [Subtasks] Implement long-press to activate drag mode on touch devices (500ms) - 2h
- [ ] T882 [P] [Subtasks] Add swipe left/right gestures for quick actions (complete, delete) - 3h
- [ ] T883 [Subtasks] Reduce indentation to 12px per level on mobile breakpoints - 1h
- [ ] T884 [Subtasks] Create bottom sheet for subtask detail on mobile - 2h
- [ ] T885 [Subtasks] Add floating action button (FAB) for "Add Subtask" on mobile - 1h
- [ ] T886 [Subtasks] Implement keyboard navigation (Tab, Enter, Arrow keys) - 3h
- [ ] T887 [Subtasks] Add move up/down buttons as drag alternative for keyboard users - 2h
- [ ] T888 [Subtasks] Ensure screen readers announce hierarchy ("Task with 3 subtasks, 2 complete") - 2h
- [ ] T889 [Subtasks] Add clear focus indicators (blue outline) for keyboard navigation - 1h
- [ ] T890 [Subtasks] Test with NVDA/JAWS screen readers for accessibility compliance - 2h

### Testing: Backend (Week 5, Days 1-2)

- [ ] T891 [P] [Subtasks] Create unit tests for SubtaskService (20+ tests) - 4h
- [ ] T892 [P] [Subtasks] Test CreateSubtaskAsync with valid/invalid parentId - 2h
- [ ] T893 [P] [Subtasks] Test depth validation (allow up to 5 levels, block 6th) - 2h
- [ ] T894 [Subtasks] Test circular dependency prevention (task can't be subtask of descendant) - 2h
- [ ] T895 [Subtasks] Test progress calculation with various completion states - 2h
- [ ] T896 [Subtasks] Test MoveSubtaskAsync between different parents - 2h
- [ ] T897 [Subtasks] Test ReorderSubtasksAsync with multiple subtasks - 2h
- [ ] T898 [Subtasks] Test BulkCreateSubtasksAsync with 10+ subtasks - 1h
- [ ] T899 [Subtasks] Test cascade delete vs orphan promotion behavior - 2h
- [ ] T900 [Subtasks] Create integration tests for SubtasksController (15+ tests) - 4h
- [ ] T901 [Subtasks] Test all API endpoints with valid/invalid data - 3h
- [ ] T902 [Subtasks] Test authorization (user can only manage own subtasks) - 2h

### Testing: Frontend (Week 5, Days 3-4)

- [ ] T903 [P] [Subtasks] Create component tests for SubtaskList with Jest/Testing Library - 3h
- [ ] T904 [P] [Subtasks] Create component tests for SubtaskItem - 2h
- [ ] T905 [P] [Subtasks] Create component tests for SubtaskForm - 2h
- [ ] T906 [Subtasks] Test expand/collapse functionality - 1h
- [ ] T907 [Subtasks] Test progress bar rendering with different percentages - 2h
- [ ] T908 [Subtasks] Test drag-and-drop logic with @dnd-kit test utilities - 3h
- [ ] T909 [Subtasks] Create E2E test: create parent → add 3 subtasks → complete 2 → verify progress - 4h
- [ ] T910 [Subtasks] Create E2E test: drag subtask to reorder within parent - 3h
- [ ] T911 [Subtasks] Create E2E test: drag subtask to different parent - 3h
- [ ] T912 [Subtasks] Create E2E test: quick add 5 subtasks at once - 2h
- [ ] T913 [Subtasks] Create E2E test: bulk complete all subtasks - 2h
- [ ] T914 [Subtasks] Create E2E test: nested subtasks (3 levels deep) - 3h
- [ ] T915 [Subtasks] Test mobile gestures (swipe, long-press) with touch simulation - 3h
- [ ] T916 [Subtasks] Test keyboard navigation (Tab, Enter, Arrow keys) - 2h

### Performance & Polish (Week 5, Day 5)

- [ ] T917 [P] [Subtasks] Optimize recursive CTE query for 5-level deep trees (<100ms) - 2h
- [ ] T918 [P] [Subtasks] Implement virtualization for lists with 50+ subtasks (react-window) - 3h
- [ ] T919 [Subtasks] Memoize SubtaskItem components to prevent unnecessary re-renders - 1h
- [ ] T920 [Subtasks] Add loading skeletons for subtask lists - 2h
- [ ] T921 [Subtasks] Test performance with 100 subtasks (render <500ms) - 2h
- [ ] T922 [Subtasks] Test drag-and-drop maintains 60fps with 50 subtasks - 2h
- [ ] T923 [Subtasks] Create user documentation for subtasks feature - 2h
- [ ] T924 [Subtasks] Add feature flag for gradual rollout (10% → 100%) - 1h
- [ ] T925 [Subtasks] Update API documentation with new endpoints - 1h

**Checkpoint**: Users can create hierarchical subtasks, drag-and-drop to reorder/move, see visual progress, and use bulk operations for efficient task management

### Success Criteria

- 40%+ of tasks have at least 1 subtask within 30 days of rollout
- Drag-and-drop success rate >95% (drop in intended location)
- Subtask list renders in <300ms for 50 subtasks
- Average time to create subtask <10 seconds
- Progress bar updates within 100ms of state change
- All tests pass (37 backend unit/integration, 14 frontend component/E2E)
- Accessibility score >95% (Lighthouse/WAVE)

### Time Estimate Breakdown

| Category | Tasks | Total Time |
|----------|-------|------------|
| Backend Schema | T800-T807 | 6.5h |
| Backend Services | T808-T817 | 23h |
| Backend API | T818-T828 | 21h |
| Backend Auto-Complete | T829-T833 | 9h |
| Frontend Core | T834-T846 | 28h |
| Frontend Progress | T847-T854 | 15h |
| Frontend Drag-Drop | T855-T866 | 24.5h |
| Frontend Advanced | T867-T880 | 32h |
| Frontend Mobile/A11y | T881-T890 | 19h |
| Backend Testing | T891-T902 | 28h |
| Frontend Testing | T903-T916 | 37h |
| Performance/Polish | T917-T925 | 16h |
| **Total** | **126 tasks** | **259h (~6.5 weeks)** |

**Note**: Original estimate was 5 weeks but detailed breakdown shows 6.5 weeks more realistic. Adjusted to account for complexity of drag-and-drop, testing, and polish.

---

## Phase 14: Admin Dashboard & System Management (Priority: P2)

## Phase 15: Import/Export & Data Portability (Priority: P2)

**Purpose**: Enable users to import/export their data in multiple formats for backup, migration, and integration

**Estimated Effort**: 2 weeks (30 tasks total)

**Dependencies**: Phases 1-14 complete

### Backend: Export API (Week 1, Days 1-3)

- [ ] T360 [P] [Export] Create ExportService in Features/Export/Services/ - 2h
- [ ] T361 [P] [Export] Implement JSON export for tasks (all user tasks with metadata) - 2h
- [ ] T362 [P] [Export] Implement CSV export for tasks (flattened structure) - 2h
- [ ] T363 [Export] Implement JSON export for events - 2h
- [ ] T364 [Export] Implement CSV export for events - 2h
- [ ] T365 [Export] Implement iCalendar (.ics) export for events - 3h
- [ ] T366 [Export] Create GET /api/export/tasks endpoint (query params: format=json|csv) - 2h
- [ ] T367 [Export] Create GET /api/export/events endpoint (query params: format=json|csv|ical) - 2h
- [ ] T368 [Export] Create GET /api/export/all endpoint (ZIP file with all data) - 3h
- [ ] T369 [Export] Implement background job for large exports (>10,000 items) - 4h
- [ ] T370 [Export] Add rate limiting for export endpoints (max 5 exports per hour) - 2h

### Backend: Import API (Week 1, Days 4-5)

- [ ] T371 [P] [Import] Create ImportService in Features/Import/Services/ - 2h
- [ ] T372 [P] [Import] Implement JSON import validator (schema validation) - 3h
- [ ] T373 [P] [Import] Implement CSV import parser with column mapping - 3h
- [ ] T374 [Import] Implement task import with duplicate detection - 3h
- [ ] T375 [Import] Implement event import with duplicate detection - 3h
- [ ] T376 [Import] Create POST /api/import/tasks endpoint (multipart/form-data) - 2h
- [ ] T377 [Import] Create POST /api/import/events endpoint - 2h
- [ ] T378 [Import] Implement import preview (show what will be imported before commit) - 3h
- [ ] T379 [Import] Add import validation with detailed error messages - 2h
- [ ] T380 [Import] Implement rollback mechanism for failed imports - 3h

### Frontend: Import/Export UI (Week 2)

- [ ] T381 [P] [Export] Create ExportPage in apps/web/src/pages/export/ - 3h
- [ ] T382 [P] [Export] Create exportService.ts with download methods - 2h
- [ ] T383 [Export] Create ExportFormatSelector (JSON, CSV, iCal, All) - 2h
- [ ] T384 [Export] Create ExportProgressModal for large exports - 3h
- [ ] T385 [Export] Implement download trigger and file naming - 2h
- [ ] T386 [P] [Import] Create ImportPage with drag-and-drop file upload - 4h
- [ ] T387 [Import] Create ImportPreview component showing import summary - 3h
- [ ] T388 [Import] Create ImportErrorList component with resolution suggestions - 3h
- [ ] T389 [Import] Implement import progress tracking with status updates - 3h

### Testing & Documentation

- [ ] T390 [P] [Export] Create unit tests for ExportService (all formats) - 3h
- [ ] T391 [P] [Import] Create unit tests for ImportService with sample data - 3h
- [ ] T392 [Export/Import] Create integration tests for all endpoints - 4h
- [ ] T393 [Export/Import] Create E2E test: export data → clear account → import data → verify - 4h
- [ ] T394 [Export/Import] Test with large datasets (10,000+ tasks) - 2h
- [ ] T395 [Export/Import] Create user documentation for import/export features - 2h

**Checkpoint**: Users can backup their data, migrate between accounts, and integrate with external tools

---

## Phase 16: Third-Party Integrations (Priority: P3)

**Purpose**: Connect with external services (Google Calendar, Outlook, GitHub, Slack) for seamless workflow integration

**Estimated Effort**: 4 weeks (60 tasks total)

**Dependencies**: Phases 1-15 complete

### Backend: OAuth & Integration Framework (Week 1)

- [ ] T396 [P] [Integration] Create Integration entity (Id, UserId, Provider, AccessToken, RefreshToken, ExpiresAt, Settings) - 1h
- [ ] T397 [P] [Integration] Create database migration for integrations table - 1h
- [ ] T398 [Integration] Implement OAuth 2.0 flow helper service - 4h
- [ ] T399 [Integration] Create IntegrationService base class with common methods - 3h
- [ ] T400 [Integration] Implement token refresh mechanism with retry logic - 3h
- [ ] T401 [Integration] Create POST /api/integrations/connect/{provider} endpoint - 2h
- [ ] T402 [Integration] Create GET /api/integrations/callback endpoint (OAuth callback) - 2h
- [ ] T403 [Integration] Create GET /api/integrations endpoint (list user integrations) - 2h
- [ ] T404 [Integration] Create DELETE /api/integrations/{id} endpoint (disconnect) - 2h
- [ ] T405 [Integration] Implement encryption for stored access tokens - 3h

### Backend: Google Calendar Integration (Week 2, Days 1-3)

- [ ] T406 [P] [Google] Install Google.Apis.Calendar.v3 NuGet package - 0.5h
- [ ] T407 [P] [Google] Create GoogleCalendarService inheriting IntegrationService - 3h
- [ ] T408 [Google] Implement sync events to Google Calendar (create, update, delete) - 4h
- [ ] T409 [Google] Implement import events from Google Calendar - 3h
- [ ] T410 [Google] Implement two-way sync with conflict resolution - 4h
- [ ] T411 [Google] Create POST /api/integrations/google/sync endpoint - 2h
- [ ] T412 [Google] Implement webhook for Google Calendar changes - 3h
- [ ] T413 [Google] Add background job for periodic sync (every 15 minutes) - 3h

### Backend: Microsoft Outlook Integration (Week 2, Days 4-5)

- [ ] T414 [P] [Outlook] Install Microsoft.Graph NuGet package - 0.5h
- [ ] T415 [P] [Outlook] Create OutlookService inheriting IntegrationService - 3h
- [ ] T416 [Outlook] Implement sync events to Outlook Calendar - 4h
- [ ] T417 [Outlook] Implement import events from Outlook Calendar - 3h
- [ ] T418 [Outlook] Implement two-way sync with conflict resolution - 4h
- [ ] T419 [Outlook] Create POST /api/integrations/outlook/sync endpoint - 2h

### Backend: GitHub Integration (Week 3, Days 1-2)

- [ ] T420 [P] [GitHub] Install Octokit NuGet package - 0.5h
- [ ] T421 [P] [GitHub] Create GitHubService inheriting IntegrationService - 3h
- [ ] T422 [GitHub] Implement import GitHub issues as tasks - 3h
- [ ] T423 [GitHub] Implement create GitHub issues from tasks - 3h
- [ ] T424 [GitHub] Implement sync task completion with issue status - 3h
- [ ] T425 [GitHub] Create POST /api/integrations/github/sync endpoint - 2h
- [ ] T426 [GitHub] Implement webhook for GitHub issue changes - 3h

### Backend: Slack Integration (Week 3, Days 3-4)

- [ ] T427 [P] [Slack] Install SlackNet NuGet package - 0.5h
- [ ] T428 [P] [Slack] Create SlackService inheriting IntegrationService - 3h
- [ ] T429 [Slack] Implement send task notifications to Slack channel - 3h
- [ ] T430 [Slack] Implement create tasks from Slack slash commands - 4h
- [ ] T431 [Slack] Implement Slack reminders for due tasks - 3h
- [ ] T432 [Slack] Create POST /api/integrations/slack/webhook endpoint - 2h

### Frontend: Integration Management UI (Week 3, Day 5 - Week 4, Day 2)

- [ ] T433 [P] [Integration] Create IntegrationsPage in apps/web/src/pages/integrations/ - 3h
- [ ] T434 [P] [Integration] Create integrationService.ts with OAuth helpers - 3h
- [ ] T435 [Integration] Create IntegrationCard component for each provider - 3h
- [ ] T436 [Integration] Implement OAuth popup flow for connecting accounts - 4h
- [ ] T437 [Integration] Create SyncStatusIndicator (last sync time, status) - 2h
- [ ] T438 [Integration] Create IntegrationSettings modal for each provider - 3h
- [ ] T439 [Integration] Create SyncConflictResolver component - 4h
- [ ] T440 [Integration] Implement manual sync trigger button - 2h
- [ ] T441 [Integration] Create SyncHistory component showing past syncs - 3h
- [ ] T442 [Integration] Add integration status badges to calendar/tasks - 2h

### Testing & Documentation (Week 4, Days 3-5)

- [ ] T443 [P] [Integration] Create unit tests for OAuth flow - 3h
- [ ] T444 [P] [Integration] Create unit tests for each integration service - 4h
- [ ] T445 [Integration] Create integration tests with mocked external APIs - 4h
- [ ] T446 [Integration] Test error handling for API failures - 3h
- [ ] T447 [Integration] Test token refresh and expiration - 2h
- [ ] T448 [Integration] Create E2E test: connect Google Calendar → sync events - 4h
- [ ] T449 [Integration] Test conflict resolution scenarios - 3h
- [ ] T450 [Integration] Create user guide for each integration - 3h
- [ ] T451 [Integration] Test security of stored credentials - 2h

**Checkpoint**: Users can connect external services and sync data bidirectionally

---

## Phase 17: Advanced Reporting & Analytics (Priority: P3)

**Purpose**: Comprehensive reporting system with custom reports, data visualization, and productivity insights

**Estimated Effort**: 3 weeks (45 tasks total)

**Dependencies**: Phases 1-16 complete

### Backend: Reporting Engine (Week 1)

- [ ] T452 [P] [Report] Create Report entity (Id, UserId, Name, Type, Filters, Schedule, LastRun, CreatedAt) - 1h
- [ ] T453 [P] [Report] Create ReportResult entity for storing generated reports - 1h
- [ ] T454 [Report] Create database migration for reports tables - 1h
- [ ] T455 [P] [Report] Create ReportService in Features/Reports/Services/ - 3h
- [ ] T456 [P] [Report] Create ReportGenerator base class for all report types - 3h
- [ ] T457 [Report] Implement ProductivityReport (completion rates, trends over time) - 4h
- [ ] T458 [Report] Implement TaskAnalyticsReport (by priority, group, due date) - 4h
- [ ] T459 [Report] Implement TimeTrackingReport (estimated vs actual time) - 4h
- [ ] T460 [Report] Implement CustomReport with dynamic query builder - 5h
- [ ] T461 [Report] Create GET /api/reports endpoint (list user reports) - 2h
- [ ] T462 [Report] Create POST /api/reports endpoint (create new report) - 2h
- [ ] T463 [Report] Create GET /api/reports/{id}/generate endpoint (run report) - 3h
- [ ] T464 [Report] Create POST /api/reports/{id}/schedule endpoint (schedule recurring) - 3h
- [ ] T465 [Report] Implement background job for scheduled reports - 3h
- [ ] T466 [Report] Implement report export (PDF, Excel, CSV) - 4h

### Frontend: Report Builder UI (Week 2, Days 1-3)

- [ ] T467 [P] [Report] Create ReportsPage in apps/web/src/pages/reports/ - 3h
- [ ] T468 [P] [Report] Create reportService.ts with API methods - 2h
- [ ] T469 [Report] Create ReportList component showing saved reports - 3h
- [ ] T470 [Report] Create ReportBuilder component with drag-and-drop - 5h
- [ ] T471 [Report] Create FilterBuilder for custom report filters - 4h
- [ ] T472 [Report] Create ChartTypeSelector (bar, line, pie, table) - 2h
- [ ] T473 [Report] Create DateRangePicker for report time periods - 2h
- [ ] T474 [Report] Create GroupBySelector (group by priority, group, date, etc.) - 3h
- [ ] T475 [Report] Implement report preview with live data - 3h
- [ ] T476 [Report] Create SaveReportModal with name and description - 2h

### Frontend: Report Visualization (Week 2, Days 4-5)

- [ ] T477 [P] [Report] Create ReportViewer component for displaying results - 3h
- [ ] T478 [P] [Report] Create ProductivityDashboard with multiple charts - 4h
- [ ] T479 [Report] Create CompletionRateChart (line chart over time) - 3h
- [ ] T480 [Report] Create TaskDistributionChart (pie chart by priority/group) - 3h
- [ ] T481 [Report] Create TrendAnalysisChart (moving averages, predictions) - 4h
- [ ] T482 [Report] Create HeatmapCalendar (task density by day) - 4h
- [ ] T483 [Report] Create ComparativeBarchart (this week vs last week) - 3h
- [ ] T484 [Report] Implement drill-down functionality (click chart → see details) - 3h

### Frontend: Report Scheduling & Export (Week 3, Days 1-2)

- [ ] T485 [P] [Report] Create ReportScheduler component (daily, weekly, monthly) - 3h
- [ ] T486 [P] [Report] Create EmailReportSettings (recipients, format) - 2h
- [ ] T487 [Report] Create ExportReportModal (PDF, Excel, CSV, email) - 3h
- [ ] T488 [Report] Implement report sharing with unique links - 3h
- [ ] T489 [Report] Create ReportHistory showing past runs - 2h

### Advanced Analytics Features (Week 3, Days 3-4)

- [ ] T490 [P] [Analytics] Create InsightsPanel with AI-powered suggestions - 4h
- [ ] T491 [P] [Analytics] Create ProductivityScore calculation algorithm - 3h
- [ ] T492 [Analytics] Create BurndownChart for project completion forecasting - 4h
- [ ] T493 [Analytics] Create GoalTracking component (daily/weekly goals) - 4h
- [ ] T494 [Analytics] Create ComparisonReport (user vs team averages) - 3h
- [ ] T495 [Analytics] Implement predictive analytics (completion time estimates) - 4h

### Testing & Validation (Week 3, Day 5)

- [ ] T496 [P] [Report] Create unit tests for ReportService and generators - 4h
- [ ] T497 [P] [Report] Create integration tests for report endpoints - 3h
- [ ] T498 [Report] Test report generation with large datasets (50,000+ tasks) - 3h
- [ ] T499 [Report] Create component tests for report builder - 3h
- [ ] T500 [Report] Create E2E test: build custom report → schedule → export - 4h
- [ ] T501 [Report] Test PDF/Excel export quality and formatting - 2h

**Checkpoint**: Users can create custom reports, visualize data trends, and gain productivity insights

---

## Phase 24: Usage Analytics & Telemetry (Priority: P2)

**Purpose**: Comprehensive usage tracking system to monitor application performance, feature adoption, and user behaviour patterns for data-driven decision making

**Estimated Effort**: 4 weeks (55 tasks total)

**Dependencies**: Phase 14 (Admin Dashboard) complete

**Specification**: `specs/applications/todo/usage-analytics-feature.md`

### Backend: Analytics Infrastructure (Week 1, Days 1-3)

- [ ] T502 [P] [Analytics] Create AnalyticsEvent entity (Id, UserId, EventType, EventName, Properties, SessionId, Timestamp, IpAddress, UserAgent) - 1h
- [ ] T503 [P] [Analytics] Create UserSession entity (Id, UserId, SessionId, StartTime, EndTime, DeviceType, Browser) - 1h
- [ ] T504 [P] [Analytics] Create PerformanceMetric entity (Id, Endpoint, Method, ResponseTime, StatusCode, Timestamp) - 1h
- [ ] T505 [Analytics] Create database migration for analytics tables with time-series optimisation - 2h
- [ ] T506 [Analytics] Add indexes on (UserId, Timestamp), (EventType, Timestamp), (SessionId) - 1h
- [ ] T507 [P] [Analytics] Create AnalyticsService in Features/Analytics/Services/ - 3h
- [ ] T508 [P] [Analytics] Create EventProcessor for handling incoming events - 3h
- [ ] T509 [Analytics] Implement event batching (buffer 50 events or 30 seconds) - 3h
- [ ] T510 [Analytics] Create SessionManager to track user sessions (30-minute timeout) - 3h
- [ ] T511 [Analytics] Implement IP address anonymisation (mask last octet) - 2h
- [ ] T512 [Analytics] Create AnalyticsMiddleware for automatic API request tracking - 3h
- [ ] T513 [Analytics] Implement PII detection and redaction in event properties - 3h
- [ ] T514 [Analytics] Create background job for aggregating daily metrics - 3h
- [ ] T515 [Analytics] Create background job for purging old events (90-day retention) - 2h

### Backend: Analytics API Endpoints (Week 1, Days 4-5)

- [ ] T516 [P] [Analytics] Create POST /api/analytics/events endpoint (batch event ingestion) - 2h
- [ ] T517 [P] [Analytics] Create POST /api/analytics/track endpoint (single event, legacy support) - 1h
- [ ] T518 [Analytics] Create GET /api/analytics/overview endpoint (DAU/WAU/MAU, top features) - 3h
- [ ] T519 [Analytics] Create GET /api/analytics/users endpoint (user engagement metrics) - 3h
- [ ] T520 [Analytics] Create GET /api/analytics/users/{id} endpoint (individual user analytics) - 2h
- [ ] T521 [Analytics] Create GET /api/analytics/features endpoint (feature usage statistics) - 3h
- [ ] T522 [Analytics] Create GET /api/analytics/performance endpoint (API response times) - 2h
- [ ] T523 [Analytics] Create GET /api/analytics/errors endpoint (error tracking dashboard) - 3h
- [ ] T524 [Analytics] Add authorization: analytics endpoints require admin role - 1h
- [ ] T525 [Analytics] Implement rate limiting: 1000 events/minute per user - 2h
- [ ] T526 [Analytics] Add caching for dashboard queries (5-minute TTL) - 2h

### Frontend: Analytics SDK (Week 2, Days 1-2)

- [ ] T527 [P] [Analytics] Create analyticsSDK.ts in apps/web/src/services/ - 3h
- [ ] T528 [P] [Analytics] Implement trackEvent() method with event queuing - 2h
- [ ] T529 [Analytics] Implement trackPageView() with duration tracking - 2h
- [ ] T530 [Analytics] Implement trackFeatureUsage() for specific feature events - 2h
- [ ] T531 [Analytics] Implement trackError() for frontend error capturing - 2h
- [ ] T532 [Analytics] Create session management (generate/persist sessionId) - 2h
- [ ] T533 [Analytics] Implement event batching and auto-flush (30s interval) - 3h
- [ ] T534 [Analytics] Add device/browser detection using user agent - 1h
- [ ] T535 [Analytics] Implement sendBeacon API for page unload events - 2h
- [ ] T536 [Analytics] Add opt-out check (respect user privacy settings) - 2h
- [ ] T537 [Analytics] Create React hook: useAnalytics() for easy component integration - 2h

### Frontend: Analytics Integration (Week 2, Days 3-4)

- [ ] T538 [P] [Analytics] Integrate analytics SDK in App.tsx (initialize on mount) - 1h
- [ ] T539 [P] [Analytics] Add page view tracking to router navigation - 2h
- [ ] T540 [Analytics] Add feature tracking to task actions (create, complete, delete) - 2h
- [ ] T541 [Analytics] Add feature tracking to event actions (create, update, delete) - 2h
- [ ] T542 [Analytics] Add feature tracking to calendar interactions (view change, date navigation) - 2h
- [ ] T543 [Analytics] Add feature tracking to search usage - 1h
- [ ] T544 [Analytics] Add feature tracking to filter usage (priority, status, group) - 2h
- [ ] T545 [Analytics] Add error boundary with automatic error tracking - 2h
- [ ] T546 [Analytics] Track user engagement: time on page, scroll depth - 3h

### Frontend: Privacy Controls (Week 2, Day 5)

- [ ] T547 [P] [Analytics] Create AnalyticsSettings component in Settings page - 3h
- [ ] T548 [P] [Analytics] Create ConsentBanner for first-time users - 3h
- [ ] T549 [Analytics] Implement "Share Usage Data" toggle with persistence - 2h
- [ ] T550 [Analytics] Create privacy policy modal explaining data collection - 2h
- [ ] T551 [Analytics] Implement data export: download all user analytics as JSON - 3h
- [ ] T552 [Analytics] Create DELETE request for user analytics data - 1h

### Frontend: Admin Analytics Dashboard (Week 3, Days 1-4)

- [ ] T553 [P] [Analytics] Create AnalyticsDashboard page in apps/web/src/pages/admin/analytics/ - 4h
- [ ] T554 [P] [Analytics] Create analyticsService.ts with API client methods - 2h
- [ ] T555 [Analytics] Create OverviewCards (DAU, WAU, MAU, total sessions) - 3h
- [ ] T556 [Analytics] Create ActiveUsersChart (line chart, last 30 days) - 3h
- [ ] T557 [Analytics] Create FeaturePopularityChart (bar chart, top 10 features) - 3h
- [ ] T558 [Analytics] Create SessionDurationChart (histogram distribution) - 3h
- [ ] T559 [Analytics] Create UserEngagementTable (power users, casual, inactive) - 4h
- [ ] T560 [Analytics] Create PerformanceDashboard (API response times, P95/P99) - 4h
- [ ] T561 [Analytics] Create ErrorTrackingDashboard (error types, frequency, affected users) - 4h
- [ ] T562 [Analytics] Create UserDetailModal (individual user analytics, session history) - 4h
- [ ] T563 [Analytics] Implement real-time updates with polling (30-second refresh) - 2h
- [ ] T564 [Analytics] Create date range picker for filtering analytics - 2h
- [ ] T565 [Analytics] Create analytics export: download CSV/JSON reports - 3h
- [ ] T566 [Analytics] Add loading states and error handling for all charts - 2h

### Advanced Features (Week 3, Day 5)

- [ ] T567 [P] [Analytics] Create retention cohort analysis (7/30/90-day retention) - 4h
- [ ] T568 [P] [Analytics] Create funnel analysis (signup → first task → first completion) - 4h
- [ ] T569 [Analytics] Implement user segmentation (by registration date, activity level) - 3h
- [ ] T570 [Analytics] Create at-risk user detection (inactive 14+ days) - 2h
- [ ] T571 [Analytics] Implement alert system for critical metrics (error rate >5%) - 3h
- [ ] T572 [Analytics] Create scheduled email reports (weekly summary to admins) - 3h

### Testing & Validation (Week 4, Days 1-3)

- [ ] T573 [P] [Analytics] Create unit tests for AnalyticsService (event processing, batching) - 4h
- [ ] T574 [P] [Analytics] Create unit tests for SessionManager - 2h
- [ ] T575 [P] [Analytics] Create unit tests for IP anonymisation - 2h
- [ ] T576 [Analytics] Create integration tests for analytics API endpoints - 4h
- [ ] T577 [Analytics] Test event ingestion with 1000 events/second load - 3h
- [ ] T578 [Analytics] Test dashboard queries with 1M+ events (performance) - 3h
- [ ] T579 [Analytics] Create component tests for analytics dashboard - 3h
- [ ] T580 [Analytics] Test privacy controls: opt-out stops tracking - 2h
- [ ] T581 [Analytics] Test GDPR compliance: data export and deletion - 3h
- [ ] T582 [Analytics] Create E2E test: user journey → admin views analytics - 4h
- [ ] T583 [Analytics] Test PII detection and redaction - 2h
- [ ] T584 [Analytics] Test analytics with different browsers and devices - 2h

### Documentation & Rollout (Week 4, Days 4-5)

- [ ] T585 [P] [Analytics] Create admin guide for interpreting analytics - 3h
- [ ] T586 [P] [Analytics] Create privacy policy update explaining data collection - 2h
- [ ] T587 [Analytics] Document event types and properties in API docs - 2h
- [ ] T588 [Analytics] Create dashboard user guide with screenshots - 2h
- [ ] T589 [Analytics] Implement feature flag for gradual rollout (10% → 100%) - 2h
- [ ] T590 [Analytics] Set up monitoring alerts for analytics system health - 2h

**Checkpoint**: Application tracks usage patterns, admin can view comprehensive analytics, users have privacy controls, GDPR compliant

---

## Phase 13-24: Complete Future Feature Summary

**Status Update**: Phases 13.5, 14-17, and 24 now documented  
**Total Effort**: ~920 tasks over 49.5 weeks (12 months)  
**Source**: See inline documentation above and existing spec files

### Complete Phase Summary

| Phase | Feature | Tasks | Effort | Priority | Status |
|-------|---------|-------|--------|----------|--------|
| 13 | Events (scheduled occurrences) | T328-T427 | 5 weeks | P2 | ✅ Complete |
| 13.5 | Subtasks & Hierarchical Tasks | T800-T925 | 6.5 weeks | P2 | 📋 Documented |
| 14 | Admin Dashboard & System Management | T320-T359 | 3 weeks | P2 | 📋 Documented |
| 15 | Import/Export & Data Portability | T360-T395 | 2 weeks | P2 | 📋 Documented |
| 16 | Third-Party Integrations | T396-T451 | 4 weeks | P3 | 📋 Documented |
| 17 | Advanced Reporting & Analytics | T452-T501 | 3 weeks | P3 | 📋 Documented |
| 18 | Security & Foundation | T428-T497 | 4 weeks | P1 | 📋 Documented |
| 19 | Organisation & Productivity | T498-T587 | 5 weeks | P2 | 📋 Documented |
| 20 | Design & UX | T588-T657 | 4 weeks | P2 | 📋 Documented |
| 21 | Advanced Features | T658-T747 | 6 weeks | P3 | 📋 Documented |
| 22 | Collaboration & Linking | T748-T787 | 3 weeks | P2 | 📋 Documented |
| 23 | Version History API | T788-T799 | 1 week | P3 | ✅ Complete |
| 24 | Usage Analytics & Telemetry | T502-T590 | 4 weeks | P2 | 📋 Documented |

**Quick Win Path Update** (recommended order):
1. **Phase 13.5 (Subtasks)** - 6.5 weeks - Core task management enhancement, high user value
2. Phase 14 (Admin Dashboard) - 3 weeks - System management essentials (required for Phase 24)
3. Phase 15 (Import/Export) - 2 weeks - Data portability (GDPR compliance prep)
4. Phase 18 (Security) - 4 weeks - Production-ready security
5. Phase 24 (Usage Analytics) - 4 weeks - Data-driven insights and user monitoring
6. Phase 16 (Integrations) - 4 weeks - External service connectivity
7. Phase 17 (Reporting) - 3 weeks - Business intelligence and visualisation

**Total**: 26.5 weeks for complete task hierarchy, admin, analytics, security, data management, and integrations

**Note**: Phase 13.5 (Subtasks) should be prioritised early as it's core functionality that enhances the primary use case (task management) and has high user demand.

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

- [x] T788 [P] [API] Create VersionInfo and ChangelogSection models in apps/finance-api/Features/Version/Models/ - 1h
- [x] T789 [P] [API] Create VersionDto, ChangelogEntryDto, VersionHistoryDto in Features/Version/DTOs/ - 1h
- [x] T790 [API] Implement ChangelogParser service to parse CHANGELOG.md (ParseChangelogAsync, ParseVersionSection, ParseChangelogItems) - 4h
- [x] T791 [API] Implement VersionService with GetCurrentVersionAsync, GetVersionHistoryAsync, GetVersionByNumberAsync methods - 3h
- [x] T792 [API] Create VersionController with GET /api/version/current, /history, /history/:version endpoints - 2h
- [x] T793 [API] Add in-memory caching (5 min TTL) for parsed CHANGELOG.md to VersionService - 2h
- [x] T794 [API] Write unit tests for ChangelogParser (15+ tests covering all parsing scenarios) - 3h
- [x] T795 [API] Write integration tests for VersionController endpoints (10+ tests) - 3h

### Frontend: API Integration (Week 1, Days 4-5)

- [x] T796 [P] [Frontend] Create versionService with getCurrentVersion, getVersionHistory, getVersionByNumber methods in apps/web/src/services/ - 2h
- [x] T797 [P] [Frontend] Create VersionInfo, ChangelogEntry, VersionHistory TypeScript interfaces in apps/web/src/types/ - 1h
- [x] T798 [Frontend] Update VersionHistoryPage.tsx to fetch from API (add useEffect, loading/error states, remove mockChangelog) - 3h
- [x] T799 [Frontend] Write E2E test for version history page loading from API (e2e/version-history.spec.ts) - 2h

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
---

## Phase 25: Production Deployment & Infrastructure (Priority: P2)

**Purpose**: Harden the application for public internet deployment with proper security, monitoring, CI/CD, and operational readiness. This phase covers everything needed to move from a LAN-only deployment to a fully production-ready service.

**Estimated Effort**: 4 weeks (32 tasks total)

**Dependencies**: LAN deployment guide complete (see `docs/guides/LAN_DEPLOYMENT.md`). Application feature-complete for initial release.

**Spec**: `specs/platform/production-deployment.md` (to be created)

### Security Hardening (Week 1, Days 1-3)

- [ ] T800 [P] [Security] Generate and configure strong JWT secret via environment variable / secret manager - 2h
- [ ] T801 [P] [Security] Enable JWT issuer and audience validation in `Program.cs` - 2h
- [ ] T802 [Security] Enforce HTTPS — set `RequireHttpsMetadata = true`, configure HSTS headers - 3h
- [ ] T803 [Security] Implement account lockout after failed login attempts (5 failures → 15 min lock) - 4h
- [ ] T804 [Security] Add CSRF protection for state-changing endpoints - 3h
- [ ] T805 [Security] Audit and harden Content-Security-Policy headers in `SecurityHeadersMiddleware` - 3h
- [ ] T806 [Security] Remove Swagger UI from non-development environments (verify current gating) - 1h
- [ ] T807 [Security] Implement API key rotation mechanism for JWT secrets - 4h
- [ ] T808 [Security] Add sensitive data masking in all log outputs (passwords, tokens, PII) - 3h
- [ ] T809 [Security] Conduct dependency vulnerability scan (`dotnet list package --vulnerable`, `pnpm audit`) - 2h

### TLS & Domain Setup (Week 1, Days 4-5)

- [ ] T810 [P] [Infra] Purchase and configure a domain name (DNS A/CNAME records) - 2h
- [ ] T811 [Infra] Set up TLS certificates via Let's Encrypt (Caddy auto-HTTPS or certbot) - 3h
- [ ] T812 [Infra] Update CORS configuration with production domain(s) - 1h
- [ ] T813 [Infra] Configure HTTP → HTTPS redirect in reverse proxy - 1h

### Containerisation & Orchestration (Week 2, Days 1-3)

- [ ] T814 [P] [Infra] Create multi-stage Dockerfile for .NET API (`build` → `runtime` stages) - 3h
- [ ] T815 [P] [Infra] Create Dockerfile for frontend (nginx serving static build) - 2h
- [ ] T816 [Infra] Create production `docker-compose.prod.yml` with all services (db, api, web, proxy) - 4h
- [ ] T817 [Infra] Add health check endpoints to API (`/health`, `/health/ready`) for orchestrati - 3h
- [ ] T818 [Infra] Configure Docker volume backup strategy for PostgreSQL data - 2h

### CI/CD Pipeline (Week 2, Days 4-5 + Week 3, Day 1)

- [ ] T819 [P] [CI/CD] Create GitHub Actions workflow for automated testing on PR (lint, unit, integration) - 4h
- [ ] T820 [P] [CI/CD] Create GitHub Actions workflow for E2E tests (Playwright in Docker) - 4h
- [ ] T821 [CI/CD] Create build and push workflow for Docker images (GitHub Container Registry) - 3h
- [ ] T822 [CI/CD] Create deployment workflow (staging → production promotion) - 4h
- [ ] T823 [CI/CD] Add version tagging and CHANGELOG automation to release workflow - 2h

### Database Production Readiness (Week 3, Days 2-4)

- [ ] T824 [P] [Database] Configure PostgreSQL connection pooling (PgBouncer or Npgsql pooling) - 3h
- [ ] T825 [Database] Implement automated database backup schedule (daily full, hourly WAL) - 4h
- [ ] T826 [Database] Create and test database restore procedure with documentation - 3h
- [ ] T827 [Database] Add database migration rollback scripts for each migration - 3h
- [ ] T828 [Database] Configure database encryption at rest - 2h

### Monitoring, Logging & Observability (Week 3, Day 5 + Week 4, Days 1-2)

- [ ] T829 [P] [Monitoring] Set up centralised logging (Serilog → Seq, or ELK stack, or cloud provider) - 4h
- [ ] T830 [Monitoring] Add application performance monitoring (APM) — response times, error rates - 4h
- [ ] T831 [Monitoring] Configure uptime monitoring and alerting (health check polling) - 2h
- [ ] T832 [Monitoring] Create operational dashboard (Grafana or cloud equivalent) - 4h

### Documentation & Go-Live (Week 4, Days 3-5)

- [ ] T833 [P] [Docs] Write production runbook (startup, shutdown, rollback, incident response) - 4h
- [ ] T834 [P] [Docs] Write disaster recovery plan (RTO/RPO targets, recovery steps) - 3h
- [ ] T835 [Docs] Create security audit checklist and complete final audit - 4h
- [ ] T836 [Docs] Write user-facing privacy policy and data handling documentation - 3h
- [ ] T837 [Go-Live] Perform load testing (k6 or Artillery) — target 100 concurrent users - 4h
- [ ] T838 [Go-Live] Execute go-live checklist (DNS cutover, smoke tests, monitoring verification) - 3h

**Checkpoint**: Application is deployed on a public URL with HTTPS, automated CI/CD, monitoring, backups, and full operational documentation

### Success Criteria

- Application accessible via HTTPS on a public domain
- All traffic encrypted in transit (TLS 1.2+)
- JWT secrets managed via environment variables / secret manager (no hardcoded values)
- Account lockout prevents brute-force attacks
- Automated CI/CD: push to `main` triggers build → test → deploy pipeline
- Database backups run daily with tested restore procedure
- Centralised logging with alerting on error rate spikes
- Health check endpoints return correct status
- Load test confirms 100 concurrent users with <500ms p95 response time
- Zero critical/high vulnerabilities in dependency scan
- All documentation (runbook, DR plan, security audit) complete and reviewed

### Time Estimate Breakdown

| Category | Tasks | Total Time |
|----------|-------|------------|
| Security Hardening | T800–T809 | 27h |
| TLS & Domain | T810–T813 | 7h |
| Containerisation | T814–T818 | 14h |
| CI/CD Pipeline | T819–T823 | 17h |
| Database Production | T824–T828 | 15h |
| Monitoring | T829–T832 | 14h |
| Documentation & Go-Live | T833–T838 | 21h |
| **Total** | **39 tasks** | **115h (~4 weeks)** |

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TLS certificate renewal failure | Low | High | Caddy auto-renew; monitoring alert 14 days before expiry |
| Database corruption / data loss | Low | Critical | Daily backups + WAL archiving; tested restore procedure |
| Secret key leak | Low | Critical | Environment variables only; no secrets in source control |
| DDoS / abuse | Medium | High | Rate limiting + cloud WAF; IP allowlisting if needed |
| Dependency vulnerability | Medium | Medium | Automated `dependabot` alerts; weekly audit schedule |
| Deployment failure | Medium | Medium | Blue-green deployment; instant rollback via previous container image |
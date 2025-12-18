---
description: "Task list for To Do App implementation"
---

# Tasks: To Do App

**Input**: Design documents from `/specs/001-todo-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create monorepo structure with apps/ (api, web) and packages/ (schema, ui) directories
- [ ] T002 Initialize pnpm workspace with root package.json and workspace configuration
- [ ] T003 [P] Setup TypeScript configuration for all packages (tsconfig.json in root and each package)
- [ ] T004 [P] Configure ESLint and Prettier for consistent code formatting
- [ ] T005 [P] Setup Jest testing framework in apps/api and apps/web
- [ ] T006 Initialize Git repository with .gitignore for node_modules, .env, build artifacts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema Setup

- [ ] T007 Setup PostgreSQL database and connection configuration
- [ ] T008 Initialize Prisma in apps/api/prisma/ with schema.prisma
- [ ] T009 Define User model in apps/api/prisma/schema.prisma (id, email, passwordHash, timestamps)
- [ ] T010 Define Task model in apps/api/prisma/schema.prisma (id, userId, title, description, priority, dueDate, completed, timestamps)
- [ ] T011 Define Priority enum in apps/api/prisma/schema.prisma (HIGH, MEDIUM, LOW)
- [ ] T012 Create initial database migration with `prisma migrate dev`
- [ ] T013 Generate Prisma Client with `prisma generate`

### Shared Packages

- [ ] T014 [P] Create shared TypeScript types in packages/schema/src/types/ (User, Task, Priority, ApiResponse)
- [ ] T015 [P] Create Zod validation schemas in packages/schema/src/validation/ (userSchemas.ts, taskSchemas.ts)
- [ ] T016 [P] Setup build configuration for packages/schema with package.json exports

### Backend API Infrastructure

- [ ] T017 Initialize Express.js application in apps/api/src/server.ts
- [ ] T018 [P] Create error handling middleware in apps/api/src/middleware/errorHandler.ts
- [ ] T019 [P] Create request logging middleware in apps/api/src/middleware/logger.ts
- [ ] T020 [P] Create CORS middleware configuration in apps/api/src/middleware/cors.ts
- [ ] T021 Create JWT utilities in apps/api/src/utils/jwt.ts (generate, verify, refresh)
- [ ] T022 Create password hashing utilities in apps/api/src/utils/password.ts (hash, compare using bcrypt)
- [ ] T023 Create authentication middleware in apps/api/src/middleware/auth.ts (verify JWT, attach user)
- [ ] T024 Setup environment configuration in apps/api/src/config/env.ts (database, JWT secret, port)
- [ ] T025 Create database client in apps/api/src/config/database.ts (Prisma connection)

### Frontend Infrastructure

- [ ] T026 Initialize React + Vite application in apps/web/
- [ ] T027 [P] Setup React Router in apps/web/src/routes.tsx
- [ ] T028 [P] Create API client base in apps/web/src/services/api-client.ts (axios with interceptors)
- [ ] T029 [P] Create authentication context in apps/web/src/contexts/AuthContext.tsx (token storage, user state)
- [ ] T030 [P] Create protected route component in apps/web/src/components/ProtectedRoute.tsx
- [ ] T031 [P] Setup global styles and theme in apps/web/src/styles/
- [ ] T032 Create error boundary component in apps/web/src/components/ErrorBoundary.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration & Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts and securely log in to access their personal workspace

**Independent Test**: Register a new account, log out, log back in successfully

### Backend API for User Story 1

- [ ] T033 [P] [US1] Create auth service in apps/api/src/services/authService.ts (register, login, validateCredentials)
- [ ] T034 [P] [US1] Create user service in apps/api/src/services/userService.ts (createUser, findByEmail, updateLastLogin)
- [ ] T035 [US1] Implement POST /api/v1/auth/register endpoint in apps/api/src/routes/auth.ts
- [ ] T036 [US1] Implement POST /api/v1/auth/login endpoint in apps/api/src/routes/auth.ts
- [ ] T037 [US1] Implement POST /api/v1/auth/logout endpoint in apps/api/src/routes/auth.ts
- [ ] T038 [US1] Implement POST /api/v1/auth/refresh endpoint in apps/api/src/routes/auth.ts
- [ ] T039 [US1] Implement GET /api/v1/auth/me endpoint in apps/api/src/routes/auth.ts (protected)
- [ ] T040 [US1] Add validation middleware to auth routes using Zod schemas
- [ ] T041 [US1] Add rate limiting to auth endpoints (10 requests per 15 minutes)

### Frontend for User Story 1

- [ ] T042 [P] [US1] Create registration page in apps/web/src/pages/RegisterPage.tsx
- [ ] T043 [P] [US1] Create login page in apps/web/src/pages/LoginPage.tsx
- [ ] T044 [P] [US1] Create auth service in apps/web/src/services/authService.ts (register, login, logout APIs)
- [ ] T045 [US1] Create registration form component in apps/web/src/components/auth/RegisterForm.tsx
- [ ] T046 [US1] Create login form component in apps/web/src/components/auth/LoginForm.tsx
- [ ] T047 [US1] Implement form validation with real-time feedback (email format, password strength)
- [ ] T048 [US1] Add loading states and error handling to auth forms
- [ ] T049 [US1] Implement automatic login redirect after successful registration
- [ ] T050 [US1] Add logout functionality to navigation/header component

### Testing for User Story 1

- [ ] T051 [P] [US1] Create API integration tests in apps/api/tests/auth.test.ts (register, login, logout flows)
- [ ] T052 [P] [US1] Create component tests in apps/web/tests/auth/ (RegisterForm, LoginForm)
- [ ] T053 [US1] Test authentication flow end-to-end (register → login → protected route → logout)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Basic Task Management (Priority: P2)

**Goal**: Enable users to create, view, edit, and mark tasks as complete

**Independent Test**: Create several tasks, view task list, edit tasks, mark as complete

### Backend API for User Story 2

- [ ] T054 [P] [US2] Create task service in apps/api/src/services/taskService.ts (create, findById, findByUser, update, delete)
- [ ] T055 [US2] Implement POST /api/v1/tasks endpoint in apps/api/src/routes/tasks.ts (create task)
- [ ] T056 [US2] Implement GET /api/v1/tasks endpoint in apps/api/src/routes/tasks.ts (list user's tasks)
- [ ] T057 [US2] Implement GET /api/v1/tasks/:id endpoint in apps/api/src/routes/tasks.ts (get single task)
- [ ] T058 [US2] Implement PUT /api/v1/tasks/:id endpoint in apps/api/src/routes/tasks.ts (update task)
- [ ] T059 [US2] Implement PATCH /api/v1/tasks/:id/complete endpoint in apps/api/src/routes/tasks.ts (toggle completion)
- [ ] T060 [US2] Add user ownership validation to all task endpoints
- [ ] T061 [US2] Add Zod validation for task creation and updates
- [ ] T062 [US2] Implement pagination for task list (50 items per page)

### Frontend for User Story 2

- [ ] T063 [P] [US2] Create dashboard page in apps/web/src/pages/DashboardPage.tsx
- [ ] T064 [P] [US2] Create task service in apps/web/src/services/taskService.ts (CRUD operations)
- [ ] T065 [P] [US2] Create task list component in apps/web/src/components/tasks/TaskList.tsx
- [ ] T066 [P] [US2] Create task item component in apps/web/src/components/tasks/TaskItem.tsx
- [ ] T067 [US2] Create task creation form in apps/web/src/components/tasks/CreateTaskForm.tsx
- [ ] T068 [US2] Create task edit modal in apps/web/src/components/tasks/EditTaskModal.tsx
- [ ] T069 [US2] Implement task completion toggle with optimistic updates
- [ ] T070 [US2] Add loading states and error handling for task operations
- [ ] T071 [US2] Implement empty state UI when user has no tasks
- [ ] T072 [US2] Add form validation for task title (required, max 200 chars)

### Testing for User Story 2

- [ ] T073 [P] [US2] Create API integration tests in apps/api/tests/tasks.test.ts (CRUD operations)
- [ ] T074 [P] [US2] Create component tests in apps/web/tests/tasks/ (TaskList, TaskItem, forms)
- [ ] T075 [US2] Test task management flow end-to-end (create → edit → complete → view)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Task Prioritization (Priority: P3)

**Goal**: Enable users to assign and filter tasks by priority (High, Medium, Low)

**Independent Test**: Create tasks with different priorities, filter and sort by priority

### Backend API for User Story 3

- [ ] T076 [US3] Add priority filtering to GET /api/v1/tasks endpoint (query param ?priority=HIGH)
- [ ] T077 [US3] Add priority sorting to GET /api/v1/tasks endpoint (query param ?sortBy=priority)
- [ ] T078 [US3] Update task service to support priority queries in apps/api/src/services/taskService.ts

### Frontend for User Story 3

- [ ] T079 [P] [US3] Create priority selector component in apps/web/src/components/tasks/PrioritySelector.tsx
- [ ] T080 [P] [US3] Create priority filter component in apps/web/src/components/tasks/PriorityFilter.tsx
- [ ] T081 [US3] Add priority field to CreateTaskForm and EditTaskModal
- [ ] T082 [US3] Add priority badge/indicator to TaskItem component
- [ ] T083 [US3] Implement priority filtering in task list view
- [ ] T084 [US3] Add priority-based color coding (High=red, Medium=yellow, Low=green)
- [ ] T085 [US3] Implement priority sorting toggle in task list

### Testing for User Story 3

- [ ] T086 [P] [US3] Add priority filtering tests to apps/api/tests/tasks.test.ts
- [ ] T087 [P] [US3] Add priority component tests in apps/web/tests/tasks/
- [ ] T088 [US3] Test priority workflow end-to-end (create with priority → filter → sort)

**Checkpoint**: User Stories 1, 2, AND 3 should now be independently functional

---

## Phase 6: User Story 4 - Due Date Management (Priority: P4)

**Goal**: Enable users to set due dates and see deadline indicators for tasks

**Independent Test**: Create tasks with various due dates, view overdue indicators

### Backend API for User Story 4

- [ ] T089 [US4] Add due date filtering to GET /api/v1/tasks endpoint (query params ?dueBefore=, ?dueAfter=)
- [ ] T090 [US4] Add due date sorting to GET /api/v1/tasks endpoint (query param ?sortBy=dueDate)
- [ ] T091 [US4] Add overdue tasks endpoint GET /api/v1/tasks/overdue in apps/api/src/routes/tasks.ts
- [ ] T092 [US4] Update task service to support due date queries in apps/api/src/services/taskService.ts
- [ ] T093 [US4] Add validation: due date must be future date for new tasks

### Frontend for User Story 4

- [ ] T094 [P] [US4] Create date picker component in apps/web/src/components/tasks/DatePicker.tsx
- [ ] T095 [P] [US4] Create overdue indicator component in apps/web/src/components/tasks/OverdueIndicator.tsx
- [ ] T096 [US4] Add due date field to CreateTaskForm and EditTaskModal
- [ ] T097 [US4] Add due date display to TaskItem component
- [ ] T098 [US4] Implement overdue task highlighting (visual indicator)
- [ ] T099 [US4] Add upcoming deadlines section to dashboard
- [ ] T100 [US4] Implement due date filtering in task list view
- [ ] T101 [US4] Add relative date formatting ("2 days ago", "in 3 days")

### Testing for User Story 4

- [ ] T102 [P] [US4] Add due date tests to apps/api/tests/tasks.test.ts
- [ ] T103 [P] [US4] Add date component tests in apps/web/tests/tasks/
- [ ] T104 [US4] Test due date workflow end-to-end (create with date → view overdue → filter)

**Checkpoint**: User Stories 1-4 should now be independently functional

---

## Phase 7: User Story 5 - Task Deletion (Priority: P5)

**Goal**: Enable users to permanently delete tasks with confirmation

**Independent Test**: Create tasks, delete them with confirmation, verify removal

### Backend API for User Story 5

- [ ] T105 [US5] Implement DELETE /api/v1/tasks/:id endpoint in apps/api/src/routes/tasks.ts
- [ ] T106 [US5] Add user ownership validation to delete endpoint
- [ ] T107 [US5] Add audit logging for task deletions in apps/api/src/services/taskService.ts

### Frontend for User Story 5

- [ ] T108 [P] [US5] Create delete confirmation modal in apps/web/src/components/tasks/DeleteConfirmModal.tsx
- [ ] T109 [US5] Add delete button to TaskItem component
- [ ] T110 [US5] Implement delete task functionality with confirmation flow
- [ ] T111 [US5] Add optimistic UI update for task deletion
- [ ] T112 [US5] Handle delete errors with rollback and error messages

### Testing for User Story 5

- [ ] T113 [P] [US5] Add deletion tests to apps/api/tests/tasks.test.ts
- [ ] T114 [P] [US5] Add delete confirmation tests in apps/web/tests/tasks/
- [ ] T115 [US5] Test deletion workflow end-to-end (delete → confirm → verify removal)

**Checkpoint**: All user stories (1-5) should now be independently functional

---

## Phase 8: User Story 6 - Task Groups (Priority: P3)

**Purpose**: Enable users to organise tasks into named groups (e.g., "House Renovation", "Work", "Personal")

**Dependencies**: Requires Phase 2 (Foundational) and Phase 4 (Basic Task Management) complete

### Backend: TaskGroup Model & API

- [ ] T116 [US6] Add TaskGroup model to apps/api/prisma/schema.prisma (id, userId, name, description, colour, icon, isDefault, timestamps)
- [ ] T117 [US6] Update Task model to add optional groupId foreign key relationship
- [ ] T118 [US6] Create database migration for task_groups table and Task.groupId column
- [ ] T119 [US6] Generate Prisma Client with new models
- [ ] T120 [US6] Create apps/api/src/features/task-groups/types.ts with TaskGroup DTOs
- [ ] T121 [US6] Implement apps/api/src/features/task-groups/service.ts (CRUD operations, default group creation)
- [ ] T122 [US6] Implement apps/api/src/features/task-groups/controller.ts (GET, POST, PUT, DELETE endpoints)
- [ ] T123 [US6] Add task group routes to apps/api/src/routes/index.ts
- [ ] T124 [US6] Add validation middleware for group names (unique per user, 1-100 chars)
- [ ] T125 [US6] Implement automatic default "Uncategorised" group creation on user registration
- [ ] T126 [US6] Add business logic to prevent deletion of default group
- [ ] T127 [US6] Implement group deletion with task reassignment to default group

### Frontend: TaskGroup UI Components

- [ ] T128 [P] [US6] Create apps/web/src/types/taskGroup.ts with TaskGroup interfaces
- [ ] T129 [P] [US6] Create apps/web/src/services/taskGroupService.ts (API client functions)
- [ ] T130 [US6] Create apps/web/src/components/task-groups/TaskGroupList.tsx (display all groups with task counts)
- [ ] T131 [US6] Create apps/web/src/components/task-groups/TaskGroupItem.tsx (individual group with colour indicator)
- [ ] T132 [US6] Create apps/web/src/components/task-groups/CreateTaskGroupForm.tsx (name, description, colour picker)
- [ ] T133 [US6] Create apps/web/src/components/task-groups/EditTaskGroupModal.tsx (update group properties)
- [ ] T134 [US6] Update apps/web/src/components/tasks/CreateTaskForm.tsx to add group selector dropdown
- [ ] T135 [US6] Update apps/web/src/components/tasks/EditTaskModal.tsx to add group selector dropdown
- [ ] T136 [US6] Update apps/web/src/components/tasks/TaskItem.tsx to display group name with colour indicator
- [ ] T137 [US6] Update apps/web/src/pages/Dashboard.tsx to add TaskGroupList sidebar
- [ ] T138 [US6] Implement group filtering on Dashboard (click group to filter tasks)
- [ ] T139 [US6] Add "All Tasks" option to show tasks from all groups

### Testing & Integration

- [ ] T140 [P] [US6] Add task group tests to apps/api/tests/task-groups.test.ts (CRUD, validation, default group)
- [ ] T141 [P] [US6] Add task group UI tests in apps/web/tests/task-groups/
- [ ] T142 [US6] Test group creation, editing, and deletion workflows
- [ ] T143 [US6] Test task assignment to groups during creation and editing
- [ ] T144 [US6] Test group filtering and task display by group
- [ ] T145 [US6] Test default group behaviour (auto-creation, cannot delete, auto-assignment)
- [ ] T146 [US6] Test group deletion with task reassignment to default group

**Checkpoint**: Users can create groups, assign tasks to groups, and filter tasks by group

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T147 [P] Add responsive design for mobile devices (breakpoints, touch targets)
- [x] T148 [P] Implement loading skeletons for better perceived performance
- [x] T149 [P] Add toast notifications for user actions (success/error messages)
- [ ] T150 [P] Create user profile page in apps/web/src/pages/ProfilePage.tsx
- [x] T151 [P] Add keyboard shortcuts for common actions (N=new task, /=search, Esc=close/unfocus)
- [x] T152 Implement task search functionality (search by title/description)
- [x] T153 Add task statistics dashboard (total, completed, overdue counts)
- [ ] T154 Implement dark mode theme toggle (already complete - verify)
- [ ] T155 Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T156 Performance optimization (code splitting, lazy loading)
- [ ] T157 Add API request caching strategy
- [ ] T158 Create API documentation with Swagger UI from OpenAPI spec
- [ ] T159 Add comprehensive error logging and monitoring
- [ ] T160 Run security audit (dependency check, vulnerability scan)
- [ ] T161 Validate against quickstart.md test scenarios

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
4. Add US3 (Prioritization) → Test independently → Deploy/Demo (T076-T088)
5. Add US4 (Due Dates) → Test independently → Deploy/Demo (T089-T104)
6. Add US5 (Deletion) → Test independently → Deploy/Demo (T105-T115)
7. Add US6 (Task Groups) → Test independently → Deploy/Demo (T116-T146)
8. Add Polish (Phase 9) → Final release (T147-T161)

### Parallel Team Strategy

With multiple developers after Foundation phase completes:

- **Developer A**: Focus on US1 (Authentication) - T033-T053
- **Developer B**: Focus on US2 (Task Management) - T054-T075
- **Developer C**: Setup US3-US5 after US2 completes
- **Developer D**: Focus on US6 (Task Groups) after US2 completes - T116-T146

---

## Notes

- **[P]** indicates tasks that can run in parallel (different files, no shared dependencies)
- **[Story]** label maps each task to its user story for traceability
- Each user story should be independently completable and testable
- Commit after completing each task or logical group of related tasks
- Stop at any checkpoint to validate story independently before proceeding
- Backend APIs should be tested with Postman/curl before frontend integration
- Follow TDD where practical - write tests before implementation
- Use TypeScript strict mode throughout - no `any` types allowed
- All API responses must follow OpenAPI specification in contracts/api-spec.yaml

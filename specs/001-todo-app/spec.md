# Feature Specification: To Do App

**Feature Branch**: `001-todo-app`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "Create a To Do app with user authentication, task management, and basic CRUD operations. Users should be able to create, read, update, and delete tasks with priorities and due dates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration & Authentication (Priority: P1)

Users need to create accounts and securely log in to access their personal task management workspace. This establishes user identity and data isolation, which is fundamental for a personal productivity tool.

**Why this priority**: Authentication is the foundation - without it, users cannot have personalized task lists or data security. This must work before any other functionality is meaningful.

**Independent Test**: Can be fully tested by registering a new account, logging out, and logging back in successfully, demonstrating user identity management works independently.

**Acceptance Scenarios**:

1. **Given** a new user visits the application, **When** they provide valid registration details (email, password), **Then** they can create an account and are logged in automatically
2. **Given** a registered user with valid credentials, **When** they attempt to log in, **Then** they are authenticated and can access their personal dashboard
3. **Given** an authenticated user, **When** they log out, **Then** their session is terminated and they cannot access protected resources

---

### User Story 2 - Basic Task Management (Priority: P2)

Users can create, view, and manage their tasks with essential details like title, description, and completion status. This provides the core value proposition of task organization and tracking.

**Why this priority**: Once users can authenticate, they need the basic ability to create and manage tasks. This is the minimum viable task management functionality.

**Independent Test**: Can be fully tested by creating several tasks, viewing the task list, marking tasks as complete, and verifying persistence across sessions.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new task with title and description, **Then** the task appears in their task list
2. **Given** a user with existing tasks, **When** they view their task list, **Then** all their tasks are displayed with current status
3. **Given** a user viewing a task, **When** they mark it as complete, **Then** the task status updates and is reflected in the task list
4. **Given** a user with a task, **When** they edit the task details, **Then** the changes are saved and displayed

---

### User Story 3 - Task Prioritization (Priority: P3)

Users can assign priority levels (High, Medium, Low) to tasks and view tasks organized by priority, helping them focus on the most important work first.

**Why this priority**: Priority management enhances the basic task functionality by helping users organize their workload more effectively.

**Independent Test**: Can be fully tested by creating tasks with different priorities, viewing tasks sorted by priority, and changing task priorities to verify the sorting updates.

**Acceptance Scenarios**:

1. **Given** a user creating a task, **When** they assign a priority level, **Then** the task is saved with the specified priority
2. **Given** a user with tasks of different priorities, **When** they view their task list, **Then** tasks can be filtered and sorted by priority level
3. **Given** a user with an existing task, **When** they change its priority, **Then** the task's position in priority-sorted views updates accordingly

---

### User Story 4 - Due Date Management (Priority: P4)

Users can set due dates for tasks and receive visual indicators for overdue or upcoming deadlines, enabling better time management and deadline awareness.

**Why this priority**: Due dates add temporal organization to tasks, building on the priority system to help users manage time-sensitive work.

**Independent Test**: Can be fully tested by creating tasks with various due dates (past, present, future), viewing deadline indicators, and verifying overdue task highlighting.

**Acceptance Scenarios**:

1. **Given** a user creating a task, **When** they set a due date, **Then** the task is saved with the due date and displays the deadline
2. **Given** a user with tasks having due dates, **When** they view their task list, **Then** overdue tasks are visually highlighted
3. **Given** tasks with approaching due dates, **When** the user views their dashboard, **Then** upcoming deadlines are prominently displayed

---

### User Story 5 - Task Deletion (Priority: P5)

Users can permanently delete tasks they no longer need, keeping their task list clean and focused on current priorities.

**Why this priority**: Deletion completes the CRUD operations and helps users maintain a manageable task list by removing completed or irrelevant tasks.

**Independent Test**: Can be fully tested by creating tasks, deleting some of them, and verifying they are permanently removed from all views.

**Acceptance Scenarios**:

1. **Given** a user with existing tasks, **When** they choose to delete a task, **Then** they receive a confirmation prompt
2. **Given** a user confirms task deletion, **When** the deletion is processed, **Then** the task is permanently removed from their task list
3. **Given** a deleted task, **When** the user refreshes or revisits their task list, **Then** the deleted task does not appear

---

### User Story 6 - Task Groups (Priority: P3)

Users can create named groups (such as "House Renovation", "Work", "Personal") to organise related tasks together, enabling better task management across different areas of life or projects.

**Why this priority**: As users accumulate tasks for different contexts (work, personal projects, household tasks), grouping becomes essential for maintaining focus and reducing cognitive load. This feature enables users to view and manage tasks in isolation by context.

**Independent Test**: Can be fully tested by creating multiple groups, assigning tasks to different groups, viewing tasks filtered by group, and managing tasks within each group independently.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new group with a name (e.g., "House Renovation"), **Then** the group is available for assigning tasks
2. **Given** a user creating or editing a task, **When** they select a group from the available groups, **Then** the task is associated with that group
3. **Given** a user with tasks in multiple groups, **When** they view their dashboard, **Then** they can see all groups with task counts and filter to view tasks from a specific group
4. **Given** a user viewing tasks in a specific group, **When** they perform actions (create, edit, complete, delete), **Then** those actions only affect tasks within the currently selected group
5. **Given** a user creates a task without selecting a group, **When** the task is saved, **Then** it is assigned to a default "Uncategorised" group
6. **Given** a user wants to reorganise, **When** they move a task from one group to another, **Then** the task's group association updates and it appears in the new group
7. **Given** a user has created groups, **When** they view the group list, **Then** they can edit group names, change group colours, or delete empty groups
8. **Given** a user tries to delete a group with tasks, **When** they confirm deletion, **Then** they must choose to either move tasks to another group or delete all tasks in the group

---

### User Story 7 - Username System (Priority: P2)

Users can create unique usernames during registration that serve as their primary identity in the application, improving user experience and security by hiding internal UUIDs and providing friendlier identification than email addresses.

**Why this priority**: Username improves both security (by hiding UUIDs from frontend) and UX (friendlier than email). It's important for personalization but not critical for core task functionality, making it P2.

**Independent Test**: Can be fully tested by registering with a username, checking username availability in real-time, attempting duplicate usernames, logging in with username, and verifying username displays throughout the UI.

**Acceptance Scenarios**:

1. **Given** a new user completing registration, **When** they enter a desired username, **Then** the system checks availability in real-time and shows "Available" or "Already taken" feedback before submission
2. **Given** a user enters a username, **When** it contains invalid characters or is too short/long, **Then** they receive immediate validation feedback (3-20 characters, alphanumeric plus _ and - only)
3. **Given** a user tries to register with an already-taken username, **When** they submit the form, **Then** registration fails with a clear message prompting them to choose a different username
4. **Given** a registered user with username "johndoe", **When** they log in to the dashboard, **Then** the welcome message displays "Welcome back, @johndoe" instead of their email address
5. **Given** an authenticated user, **When** they view their profile page, **Then** their username is displayed prominently with email shown as secondary contact information
6. **Given** a user logging in, **When** they enter their username in the login field, **Then** the system authenticates them (supporting both username and email login)
7. **Given** reserved usernames exist (admin, support, system, root, etc.), **When** a user tries to register with one, **Then** registration is prevented with message "This username is reserved"
8. **Given** usernames are case-insensitive for uniqueness, **When** user registers as "JohnDoe" and another tries "johndoe", **Then** the second registration is rejected as duplicate
9. **Given** existing users without usernames (from before this feature), **When** they log in, **Then** they are prompted to create a username before accessing the dashboard
10. **Given** a user profile displays a username, **When** the user internal UUID exists, **Then** it remains hidden from the UI and is not exposed in any frontend views

---

### User Story 8 - Weekly Progress Dashboard (Priority: P3)

Users can view comprehensive weekly progress analytics showing task completion trends, daily breakdowns, and urgent tasks, enabling better productivity tracking and planning over time.

**Why this priority**: Progress visualization helps users understand their productivity patterns and stay motivated. It builds on core task functionality to provide insights, making it a valuable enhancement but not critical for basic task management.

**Independent Test**: Can be fully tested by creating tasks across different days of the week, completing some tasks, and viewing the weekly dashboard to verify accurate charts, daily breakdowns, and urgent task identification.

**Acceptance Scenarios**:

1. **Given** a user with tasks throughout the current week, **When** they navigate to the weekly progress dashboard, **Then** they see an overview chart showing total tasks vs completed tasks for the week in both bar and pie chart formats
2. **Given** a user viewing the weekly dashboard, **When** they look at the day-by-day section, **Then** each day displays a pie chart of completion rate and a list of all tasks for that day with completion status
3. **Given** a user has tasks with varying priorities, **When** they view the weekly dashboard, **Then** a "Top Urgent Tasks" section displays the 5-10 most critical/high priority incomplete tasks for the current week
4. **Given** a user viewing the weekly dashboard, **When** they navigate to previous or next weeks, **Then** the charts and data update to show historical or future week data
5. **Given** a user has no tasks for the selected week, **When** they view the weekly dashboard, **Then** an empty state message encourages them to create tasks with a quick-add option
6. **Given** a user viewing daily task lists in the dashboard, **When** they click on a task, **Then** they can quickly toggle completion status or view task details without leaving the dashboard
7. **Given** a week has varying completion rates across days, **When** the user views the overview, **Then** completion percentage, total tasks, and completed tasks are clearly displayed with visual indicators
8. **Given** a user wants to focus on a specific time period, **When** they select a date range, **Then** the dashboard updates to show statistics for the custom period
9. **Given** a user completes tasks during the week, **When** they refresh or return to the dashboard, **Then** all charts and statistics update in real-time to reflect current completion status
10. **Given** a user has tasks without due dates, **When** viewing the weekly dashboard, **Then** tasks with no due date appear in a separate "Unscheduled Tasks" section

---

### Edge Cases

- What happens when a user tries to register with an already existing email address or username?
- How does the system handle very long task titles or descriptions (>1000 characters)?
- What happens when a user loses internet connection while creating or editing a task?
- How does the system handle tasks with due dates set far in the past or future?
- What happens when a user tries to access another user's tasks directly?
- How does the system behave when a user has no tasks (empty state)?
- What happens if a user tries to delete a task that has already been deleted by another session?
- How does the weekly dashboard handle weeks with no tasks or all tasks completed?
- What happens when a user navigates to a week far in the past or future with no data?
- How does the system calculate "urgent" tasks when multiple tasks have the same priority and due date?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register accounts with email and password
- **FR-002**: System MUST validate email addresses during registration  
- **FR-003**: System MUST authenticate users via email/password login
- **FR-004**: System MUST maintain user sessions securely with proper logout functionality
- **FR-005**: Users MUST be able to create tasks with title, description, priority, and due date
- **FR-006**: Users MUST be able to view all their tasks in a list format
- **FR-007**: Users MUST be able to edit existing task details
- **FR-008**: Users MUST be able to mark tasks as complete or incomplete
- **FR-009**: Users MUST be able to delete tasks permanently
- **FR-010**: System MUST provide task filtering and sorting by priority and due date
- **FR-011**: System MUST display visual indicators for overdue tasks
- **FR-012**: System MUST ensure users can only access and modify their own tasks
- **FR-013**: System MUST persist all task and user data securely
- **FR-014**: System MUST provide responsive design for desktop and mobile access
- **FR-015**: System MUST handle errors gracefully with user-friendly messages
- **FR-016**: Users MUST be able to create custom groups to organise tasks
- **FR-017**: Users MUST be able to assign tasks to groups
- **FR-018**: Users MUST be able to view and filter tasks by group
- **FR-019**: System MUST provide a default "Uncategorised" group for tasks without explicit group assignment
- **FR-020**: Users MUST be able to rename, customise, and delete groups with appropriate warnings for non-empty groups
- **FR-021**: System MUST allow users to create unique usernames during registration (3-20 characters, alphanumeric plus _ and -)
- **FR-022**: System MUST check username availability in real-time during registration
- **FR-023**: System MUST enforce case-insensitive username uniqueness (stored lowercase, displayed as entered)
- **FR-024**: System MUST support authentication with either username or email address
- **FR-025**: System MUST display username instead of email in dashboard welcome messages and profile pages
- **FR-026**: System MUST block reserved usernames (admin, support, system, root, etc.) from registration
- **FR-027**: System MUST prompt existing users (without usernames) to create one on their next login
- **FR-028**: System MUST provide a weekly progress dashboard showing task completion analytics
- **FR-029**: System MUST display overall weekly statistics with bar and pie charts
- **FR-030**: System MUST show day-by-day breakdown with completion rates and task lists
- **FR-031**: System MUST identify and display top 5-10 urgent/critical tasks for the selected week
- **FR-032**: System MUST allow users to navigate between weeks (previous/next/date picker)
- **FR-033**: System MUST calculate completion percentages and statistics in real-time
- **FR-034**: System MUST handle empty states when no tasks exist for selected time period

### Non-Functional Requirements

- **NFR-001**: System MUST encrypt user passwords using industry-standard hashing
- **NFR-002**: System MUST respond to user actions within 2 seconds undeusername, registration date, and last login timestamp
- **Task**: Represents a user's task with title, description, priority level (Critical/High/Medium/Low), due date, completion status, creation timestamp, and last modified timestamp. Each task belongs to exactly one user and optionally one task group
- **TaskGroup**: Represents a named collection of related tasks (e.g., "House Renovation", "Work", "Personal") with customisable properties such as colour and icon. Each group belongs to one user
- **WeeklyStatistics**: Computed analytics showing task completion data aggregated by week and day, including total tasks, completed tasks, completion percentage, and urgent task counts. Not persisted as an entity but calculated on-demand from Task data
- **NFR-005**: System MUST log all authentication attempts and data modifications for audit trail

### Key Entities

- **User**: Represents an application user with email, hashed password, registration date, and last login timestamp
- **Task**: Represents a user's task with title, description, priority level (High/Medium/Low), due date, completion status, creation timestamp, and last modified timestamp. Each task belongs to exactly one user and optionally one task group
- **TaskGroup**: Represents a named collection of related tasks (e.g., "House Renovation", "Work", "Personal") with customisable properties such as colour and icon. Each group belongs to one user

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account registration and login within 3 minutes
- **SC-002**: Users can create their first task within 1 minute of logging in
- **SC-003**: System responds to all user interactions (create, edit, delete tasks) within 2 seconds
- **SC-004**: 95% of users successfully complete the core user journey (register → login → create task → mark complete) on first attempt
- **SC-005**: System maintains 99.5% uptime during testing and initial deployment
- **SC-006**: Zero data loss during normal operations and graceful degradation during failures
- **SC-007**: All user data remains secure with no unauthorized access between user accounts
- **SC-008**: Users can successfully manage (CRUD operations) at least 100 tasks without performance degradation

## Change Log
28 - Weekly Progress Dashboard Added

**Added**:

- **User Story 8**: Weekly Progress Dashboard (Priority P3) - Enables users to view comprehensive weekly analytics with charts, daily breakdowns, and urgent task tracking
- **FR-028 to FR-034**: Functional requirements for weekly statistics, visualization, navigation, and real-time calculation
- **WeeklyStatistics**: New computed entity in Key Entities section for aggregated analytics
- Multiple chart types (bar charts, pie charts) for different data visualizations

**Rationale**:

- **Productivity Insights**: Users can track completion patterns and identify productive/unproductive days
- **Motivation**: Visual progress indicators encourage continued task completion
- **Planning**: Historical data helps users understand workload capacity and plan better
- **Urgent Task Management**: Highlighting critical tasks prevents important deadlines from being missed
- **Time-Based Analysis**: Weekly view provides actionable insights at an appropriate time scale

**Impact**:

- New API endpoints required for statistics calculation (`GET /api/statistics/weekly`, `GET /api/tasks/urgent`)
- Backend service layer needs date range filtering and aggregation logic
- Frontend requires charting library integration (Recharts or Chart.js)
- New WeeklyProgressPage route and components
- Navigation updates to include link to weekly progress dashboard
- Performance considerations for aggregation queries on large task sets

**Features**:

- **Overall Progress Chart**: Weekly summary showing total vs completed tasks (bar + pie charts)
- **Day-by-Day Breakdown**: Seven days with individual pie charts and task lists showing completion status
- **Top Urgent Tasks**: 5-10 most critical/high priority incomplete tasks with due dates in current week
- **Week Navigation**: Previous/next week buttons and date picker for custom date selection
- **Completion Metrics**: Percentage complete, total tasks, completed count, remaining count
- **Real-Time Updates**: Statistics recalculate when tasks are toggled complete/incomplete
- **Empty States**: Helpful messages when no tasks exist for selected period
- **Responsive Design**: Charts adapt to mobile/tablet/desktop viewports
- **Task Interaction**: Quick toggle completion or view details directly from dashboard

**Technical Considerations**:

- Week definition: Monday-Sunday (configurable to Sunday-Saturday if needed)
- Timezone handling: Use user's local timezone for day boundaries
- Caching strategy: Consider caching weekly statistics with invalidation on task updates
- Chart library: Recharts recommended (React-native, TypeScript support, responsive)
- Performance: Index on `dueDate` and `completed` columns for efficient date range queries
- Urgent task criteria: Priority=Critical/High + due date within current week + not completed

---

### 2025-12-

### 2025-12-19 - Username System Added

**Added**:

- **User Story 7**: Username System (Priority P2) - Enables users to create unique usernames for better identity display and improved security
- **FR-021 to FR-027**: Functional requirements for username creation, validation, uniqueness checking, and display
- **Username Entity Field**: New `username` field in User entity with unique constraint and validation rules
- Real-time username availability checking during registration

**Rationale**:

- **Security**: Hides internal UUID from frontend display, reducing attack surface
- **User Experience**: Friendlier identification than email addresses (e.g., "Welcome back, @johndoe" vs "Welcome back, john.doe@example.com")
- **Privacy**: Users can choose pseudonyms instead of exposing real names via email
- **Future Features**: Enables username-based features like @mentions, user search, and social collaboration in v2

**Impact**:

- Database schema updated with `username` column on Users table (unique, required, indexed)
- Registration flow updated to include username field with real-time validation
- Dashboard and Profile pages display username instead of email
- New API endpoint `POST /api/auth/check-username` for availability checking
- Login supports both email and username authentication
- Migration strategy for existing users (prompt for username on first login)

**Requirements**:

- Username must be 3-20 characters
- Allowed characters: alphanumeric (a-z, A-Z, 0-9), underscore (_), hyphen (-)
- Case-insensitive uniqueness (stored lowercase, displayed as entered)
- No whitespace, no special characters except _ and -
- Reserved usernames blocked (admin, support, system, etc.)

---

### 2025-12-16 - Task Groups Feature Added

**Added**:

- **User Story 6**: Task Groups (Priority P3) - Enables users to create named groups (e.g., "House Renovation", "Work", "Personal") to organise related tasks
- **FR-016 to FR-020**: Functional requirements for task group creation, assignment, viewing, filtering, and management
- **TaskGroup Entity**: New entity in Key Entities section with customisable properties (name, description, colour, icon)
- Default "Uncategorised" group for tasks without explicit group assignment

**Rationale**:

- User requirement to separate tasks by context (house renovation, work tasks, personal tasks)
- Enables better focus and cognitive load management across different life areas
- Expandable system to support unlimited groups per user
- Provides foundation for more advanced project management features in v2

**Impact**:

- Database schema updated with new `task_groups` table
- Task entity gains optional `group_id` foreign key
- New API endpoints required for group CRUD operations
- UI updates needed for group management and task filtering by group

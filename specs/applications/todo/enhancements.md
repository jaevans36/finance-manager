# Feature Specification: To Do App v2.0 Enhancements

**Feature Branch**: `001-todo-app-v2`  
**Created**: 2025-11-19  
**Status**: Draft  
**Parent Feature**: `001-todo-app` (base functionality)
**Input**: User request: "Enhance the existing Todo App with security improvements, better organization, modern design, and advanced productivity features across 4 implementation phases."

---

## Phase 1 - Security & Foundation

### User Story 1.1 - Password Reset via Email (Priority: P1)

Users need the ability to reset forgotten passwords securely through their registered email address, enabling account recovery without administrator intervention.

**Why this priority**: Password reset is essential for user account accessibility and is one of the most commonly requested features. Without it, users who forget passwords lose access permanently.

**Independent Test**: Can be fully tested by requesting a password reset, receiving the email with reset link, creating a new password, and logging in with the new credentials.

**Acceptance Scenarios**:

1. **Given** a registered user who has forgotten their password, **When** they click "Forgot Password" and enter their email, **Then** they receive a password reset link via email within 2 minutes
2. **Given** a user receives a password reset link, **When** they click the link within 1 hour of receiving it, **Then** they are directed to a secure page to set a new password
3. **Given** a user sets a new password via reset link, **When** they submit the new password, **Then** their password is updated and previous reset links become invalid
4. **Given** a password reset link that is more than 1 hour old, **When** a user attempts to use it, **Then** they receive a message that the link has expired and must request a new one
5. **Given** a user successfully resets their password, **When** they attempt to log in with the old password, **Then** authentication fails and they must use the new password

---

### User Story 1.2 - Email Verification for New Accounts (Priority: P1)

New users must verify their email address before gaining full access to the application, ensuring account authenticity and enabling secure communication channels.

**Why this priority**: Email verification prevents fake accounts, reduces spam, and ensures users can receive important notifications. It's a security best practice for user registration.

**Independent Test**: Can be fully tested by registering a new account, receiving the verification email, clicking the verification link, and confirming account activation.

**Note**: Authentication pages now located in `apps/web/src/pages/auth/` following feature-based organisation.

**Acceptance Scenarios**:

1. **Given** a new user completes registration, **When** they submit their details, **Then** they receive a verification email immediately and see a message to check their inbox
2. **Given** an unverified user attempts to log in, **When** they enter valid credentials, **Then** they are prompted to verify their email before accessing the application
3. **Given** a user receives a verification email, **When** they click the verification link, **Then** their account is marked as verified and they gain full access to the application
4. **Given** a verification link that is more than 24 hours old, **When** a user attempts to use it, **Then** they are prompted to request a new verification email
5. **Given** an unverified user, **When** they request a new verification email, **Then** they receive a fresh verification link and previous links become invalid

---

### User Story 1.3 - Session Management & Security (Priority: P2)

Users need visibility into their active sessions across devices and the ability to remotely log out from any device, providing security control over account access.

**Why this priority**: Multi-device usage is common, and users need to manage sessions for security (e.g., after using a public computer). This builds trust and gives users control.

**Independent Test**: Can be fully tested by logging in from multiple browsers/devices, viewing the active sessions list, and remotely terminating specific sessions.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they view their account security settings, **Then** they see a list of all active sessions with device type, browser, location, and login time
2. **Given** a user viewing active sessions, **When** they select a specific session to terminate, **Then** that session is immediately invalidated and the user on that device is logged out
3. **Given** a user is logged in on multiple devices, **When** they click "Log out all other sessions", **Then** all sessions except the current one are terminated
4. **Given** a session that has been inactive for 7 days, **When** the system performs routine cleanup, **Then** the inactive session is automatically terminated
5. **Given** a user logs in from a new device or location, **When** the login is detected, **Then** they receive an email notification about the new login for security awareness

---

### User Story 1.4 - Password Security Requirements (Priority: P2)

The system enforces strong password requirements and provides real-time feedback during password creation, ensuring user accounts are protected by robust credentials.

**Why this priority**: Strong passwords are the first line of defense against unauthorized access. Clear requirements help users create secure passwords without frustration.

**Independent Test**: Can be fully tested by attempting to register or change passwords with various strength levels and verifying that weak passwords are rejected with helpful feedback.

**Acceptance Scenarios**:

1. **Given** a user creating or changing their password, **When** they type a password, **Then** they see real-time strength indicators (weak/medium/strong) based on length, complexity, and common patterns
2. **Given** a user enters a password that is less than 8 characters, **When** they attempt to submit, **Then** they receive an error message requiring at least 8 characters
3. **Given** a user enters a password without uppercase, lowercase, number, and special character, **When** they attempt to submit, **Then** they receive specific feedback about missing requirements
4. **Given** a user attempts to use a commonly breached password (from known breach lists), **When** they submit the password, **Then** they are warned and encouraged to choose a more unique password
5. **Given** a user successfully sets a strong password, **When** they confirm it meets all criteria, **Then** their password is accepted and they can proceed

---

### User Story 1.5 - Account Security & Lockout (Priority: P3)

The system protects user accounts from brute force attacks by implementing progressive delays and temporary lockouts after multiple failed login attempts.

**Why this priority**: Account lockout prevents automated attacks while still allowing legitimate users to eventually access their accounts. It's a standard security practice.

**Independent Test**: Can be fully tested by deliberately entering wrong passwords multiple times and verifying the lockout behavior and recovery process.

**Acceptance Scenarios**:

1. **Given** a user enters an incorrect password for the first 3 attempts, **When** each attempt fails, **Then** they see an error message indicating remaining attempts before lockout
2. **Given** a user has failed 5 consecutive login attempts, **When** they attempt a 6th login, **Then** their account is temporarily locked for 15 minutes
3. **Given** a locked account, **When** the user waits for the lockout period to expire, **Then** they can attempt to log in again with the counter reset
4. **Given** a locked account, **When** the user requests a password reset during lockout, **Then** they can reset their password and unlock their account immediately
5. **Given** an account that has been locked due to failed attempts, **When** the lockout occurs, **Then** the account owner receives an email notification about the security event

---

### User Story 1.6 - User Activity Audit Trail (Priority: P3)

Users can view a comprehensive log of their account activity including login history, password changes, and significant actions, providing transparency and security awareness.

**Why this priority**: Activity logs help users detect unauthorized access and provide accountability. They're essential for security-conscious users and compliance requirements.

**Independent Test**: Can be fully tested by performing various actions (login, logout, password change, task operations) and verifying they appear correctly in the activity log.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they access their activity log, **Then** they see a chronological list of their recent actions (login, logout, password changes, task modifications)
2. **Given** a user views their activity log, **When** each entry is displayed, **Then** it shows the action type, timestamp, IP address, device/browser information, and geographic location (if available)
3. **Given** a user has a long activity history, **When** they view their log, **Then** entries are paginated with filters for date range and action type
4. **Given** a user notices suspicious activity, **When** they review the log, **Then** they can identify unfamiliar logins and take action (change password, terminate sessions)
5. **Given** security-relevant actions occur (password change, email change, session termination), **When** these happen, **Then** they are prominently highlighted in the activity log

---

### User Story 1.7 - Data Privacy & Account Deletion (Priority: P4)

Users have full control over their personal data with the ability to export their information and permanently delete their account, ensuring GDPR and privacy law compliance.

**Why this priority**: Data privacy rights are legally required in many jurisdictions. Giving users control over their data builds trust and ensures compliance.

**Independent Test**: Can be fully tested by exporting user data in various formats and performing a complete account deletion with verification of data removal.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they request to export their data, **Then** they receive a downloadable file (JSON format) containing all their tasks, account information, and activity history within 5 minutes
2. **Given** a user wants to delete their account, **When** they initiate account deletion, **Then** they are warned about permanent data loss and must confirm by re-entering their password
3. **Given** a user confirms account deletion, **When** the deletion is processed, **Then** all their personal data (tasks, account info, sessions) is permanently removed from the system within 30 days
4. **Given** a deleted account, **When** the user attempts to log in with old credentials, **Then** authentication fails and they are informed the account no longer exists
5. **Given** a user has deleted their account, **When** they attempt to register again with the same email, **Then** they can create a new account after the deletion grace period expires

---

## Phase 2 - Organization & Productivity

### User Story 2.1 - Task Categories & Tags (Priority: P1)

Users can organize tasks using custom categories and multiple tags, enabling flexible task grouping and improved findability across large task collections.

**Why this priority**: As users accumulate more tasks, organization becomes critical. Tags and categories are the foundation for all other organizational features.

**Independent Test**: Can be fully tested by creating categories, assigning multiple tags to tasks, and filtering/viewing tasks by category or tag combinations.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new category (e.g., "Work", "Personal", "Shopping"), **Then** the category is available for assignment to any task
2. **Given** a user creating or editing a task, **When** they assign a category and add tags, **Then** the task is associated with the category and displays all assigned tags
3. **Given** a user with categorized tasks, **When** they view their task list, **Then** tasks are visually grouped by category with distinct visual indicators (colors, icons)
4. **Given** a user wants to find specific tasks, **When** they filter by one or more tags, **Then** only tasks matching all selected tags are displayed
5. **Given** a user with many tags, **When** they view the tag list, **Then** tags show usage counts and can be renamed or deleted, with warnings if tasks will be affected

---

### User Story 2.2 - Task Lists & Projects (Priority: P1)

**NOTE**: Basic task grouping functionality has been promoted to the main specification (spec.md - User Story 6) and will be implemented in the initial release. This user story now focuses on advanced project features beyond basic grouping.

Users can create named lists or projects with advanced features such as project templates, milestones, dependencies between tasks, and progress tracking, providing hierarchical organization for complex workflows and multi-step projects.

**Why this priority**: Advanced project features build upon basic task grouping to enable complex project management with dependencies, milestones, and templates for repeatable workflows.

**Independent Test**: Can be fully tested by creating project templates, setting up task dependencies, defining milestones, and tracking project progress through completion.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new project (e.g., "Website Redesign", "Home Renovation"), **Then** they can add tasks to that project and view all project tasks together
2. **Given** a user viewing a project, **When** they look at the project dashboard, **Then** they see progress indicators (completed/total tasks), project description, and all associated tasks
3. **Given** a user with multiple projects, **When** they view their main dashboard, **Then** they see a summary of all projects with completion percentages and urgent tasks
4. **Given** a user wants to reorganize tasks, **When** they drag a task to a different project, **Then** the task is moved and its project association updates immediately
5. **Given** a user completes all tasks in a project, **When** the last task is marked complete, **Then** the project is marked as complete and can be archived while retaining all task history

---

### User Story 2.3 - Full-Text Search (Priority: P2)

Users can search across all their tasks using keywords, finding relevant tasks quickly regardless of when they were created or how they were organized.

**Why this priority**: As task volume grows, search becomes essential for productivity. Users need to find tasks by any detail (title, description, tags) instantly.

**Independent Test**: Can be fully tested by creating diverse tasks and performing searches with various keywords, partial matches, and combinations to verify relevance.

**Acceptance Scenarios**:

1. **Given** a user with many tasks, **When** they enter a search query in the search box, **Then** results appear in real-time showing tasks matching the query in title, description, or tags
2. **Given** search results are displayed, **When** multiple tasks match, **Then** results are ranked by relevance with recent and incomplete tasks prioritized
3. **Given** a user enters multiple keywords, **When** searching, **Then** tasks containing all keywords (anywhere in their content) are returned
4. **Given** a user performs a search, **When** they click a result, **Then** they are taken directly to that task with options to edit or view details
5. **Given** no tasks match a search query, **When** the search completes, **Then** the user sees a helpful message suggesting search tips or task creation

---

### User Story 2.4 - Bulk Operations (Priority: P2)

Users can select multiple tasks simultaneously and perform batch actions (complete, delete, change priority, move to project), dramatically improving efficiency when managing many tasks.

**Why this priority**: Managing tasks individually becomes tedious at scale. Bulk operations are a significant time-saver for power users managing large task lists.

**Independent Test**: Can be fully tested by selecting multiple tasks using checkboxes, applying various bulk actions, and verifying all selected tasks are updated correctly.

**Acceptance Scenarios**:

1. **Given** a user viewing their task list, **When** they click a checkbox next to multiple tasks, **Then** a bulk action toolbar appears with available operations (complete, delete, change priority, move)
2. **Given** a user has selected 10 tasks, **When** they click "Mark as Complete" in the bulk toolbar, **Then** all selected tasks are marked complete simultaneously
3. **Given** a user has selected tasks from different projects, **When** they choose "Move to Project" and select a destination, **Then** all selected tasks are moved to the new project
4. **Given** a user wants to select all visible tasks, **When** they click "Select All" checkbox, **Then** all tasks currently displayed (respecting filters) are selected
5. **Given** a user performs a bulk delete, **When** they confirm the action, **Then** they receive a summary showing how many tasks were deleted and an option to undo within 5 seconds

---

### User Story 2.5 - Task Archiving (Priority: P3)

Users can archive completed tasks to keep their active task list focused while preserving task history for reference and analytics.

**Why this priority**: Completed tasks add clutter but contain valuable history. Archiving provides a clean interface while maintaining data for review and insights.

**Independent Test**: Can be fully tested by completing tasks, archiving them manually or automatically, viewing archived tasks, and restoring tasks from the archive.

**Acceptance Scenarios**:

1. **Given** a user marks a task as complete, **When** they choose to archive it, **Then** the task is moved to the archive and no longer appears in the main task list
2. **Given** a user has auto-archive enabled, **When** a task has been marked complete for 30 days, **Then** it is automatically moved to the archive
3. **Given** a user wants to review old tasks, **When** they access the archive, **Then** they can view, search, and filter archived tasks but cannot edit them without restoring
4. **Given** a user finds an archived task they need again, **When** they select "Restore", **Then** the task returns to the active task list with all its original details
5. **Given** a user wants to permanently clean up, **When** they bulk-delete archived tasks older than 1 year, **Then** they receive confirmation and the tasks are permanently removed

---

### User Story 2.6 - Recurring Tasks (Priority: P3)

Users can create tasks that automatically repeat on a schedule (daily, weekly, monthly, yearly), eliminating the need to manually recreate routine tasks.

**Why this priority**: Many tasks recur regularly (bill payments, weekly reviews, daily habits). Automation reduces manual work and ensures these tasks aren't forgotten.

**Independent Test**: Can be fully tested by creating recurring tasks with various patterns, marking instances complete, and verifying new instances are created correctly.

**Acceptance Scenarios**:

1. **Given** a user creates a task, **When** they enable recurrence and select a pattern (daily, weekly on specific days, monthly on date, yearly), **Then** the task is marked as recurring with the pattern visible
2. **Given** a recurring task becomes due, **When** the user marks it complete, **Then** a new instance is automatically created with the next due date according to the pattern
3. **Given** a user has a weekly recurring task, **When** they skip an instance (mark as "skip this time"), **Then** no completion is recorded but the next instance is still created
4. **Given** a user wants to modify a recurring task, **When** they edit it, **Then** they can choose to update all future instances or just the current one
5. **Given** a recurring task is no longer needed, **When** the user deletes it, **Then** they can choose to delete only current instance, all future instances, or the entire recurrence chain

---

### User Story 2.7 - Quick Add Feature (Priority: P4)

Users can rapidly create tasks using a streamlined quick-add interface with smart parsing of natural language dates and priorities, enabling fast task capture without breaking workflow.

**Why this priority**: Task capture should be frictionless. Quick-add reduces the time from thought to recorded task, increasing the likelihood users will capture all their ideas.

**Independent Test**: Can be fully tested by using the quick-add interface to create tasks with various input formats and verifying correct parsing and task creation.

**Acceptance Scenarios**:

1. **Given** a user presses a keyboard shortcut (Ctrl+Q), **When** the quick-add input appears, **Then** they can type a task title and press Enter to create it immediately
2. **Given** a user types "Buy milk tomorrow high priority", **When** they create the task via quick-add, **Then** the system automatically parses the due date (tomorrow) and priority (high)
3. **Given** a user includes hashtags in quick-add text (e.g., "#work #urgent"), **When** the task is created, **Then** the hashtags are automatically converted to tags
4. **Given** a user uses quick-add while viewing a specific project, **When** they create a task, **Then** it is automatically assigned to the current project unless specified otherwise
5. **Given** a user has recurring phrases (e.g., "every Monday"), **When** they include this in quick-add, **Then** the system recognizes it and suggests creating a recurring task

---

## Phase 3 - Design & UX

### User Story 3.1 - Dark Mode Support (Priority: P1)

Users can toggle between light and dark visual themes, with their preference saved automatically, providing comfortable viewing in different lighting conditions.

**Why this priority**: Dark mode is now expected in modern applications, reduces eye strain in low-light conditions, and appeals to a large user base who prefer it.

**Independent Test**: Can be fully tested by toggling between light and dark modes and verifying all UI elements are properly styled in both themes.

**Acceptance Scenarios**:

1. **Given** a user accessing the application, **When** they click the theme toggle button, **Then** the interface immediately switches between light and dark mode with smooth transition
2. **Given** a user selects dark mode, **When** they log out and log back in, **Then** their theme preference is remembered and dark mode is applied automatically
3. **Given** the user's system is set to dark mode, **When** they first visit the application, **Then** the app automatically matches their system preference
4. **Given** a user in dark mode, **When** they view all areas of the application, **Then** all components (buttons, forms, modals, task cards) have appropriate dark theme styling with proper contrast
5. **Given** a user prints or exports tasks, **When** they are in dark mode, **Then** the print/export version uses light theme for better readability on paper

---

### User Story 3.2 - Accessibility Improvements (Priority: P1)

The application meets WCAG 2.1 AA standards, ensuring users with disabilities can effectively use all features through screen readers, keyboard navigation, and proper color contrast.

**Why this priority**: Accessibility is a legal requirement in many jurisdictions and a moral imperative. It expands your user base and improves usability for everyone.

**Independent Test**: Can be fully tested using screen readers (NVDA, JAWS), keyboard-only navigation, and automated accessibility testing tools to verify compliance.

**Acceptance Scenarios**:

1. **Given** a user relies on a screen reader, **When** they navigate the application, **Then** all interactive elements are properly labeled and announced with clear context
2. **Given** a user navigating with keyboard only, **When** they press Tab, **Then** focus moves logically through all interactive elements with visible focus indicators
3. **Given** a user with low vision, **When** they view any text, **Then** all text meets minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
4. **Given** a user needs alternative text, **When** images or icons convey information, **Then** appropriate alt text or ARIA labels provide equivalent information
5. **Given** a user encounters form errors, **When** validation fails, **Then** error messages are clearly associated with fields, announced by screen readers, and provide specific correction guidance

---

### User Story 3.3 - Keyboard Shortcuts (Priority: P2)

Users can perform common actions using keyboard shortcuts, dramatically improving efficiency for power users without requiring mouse interaction.

**Why this priority**: Keyboard shortcuts significantly speed up workflows for frequent users. They're a distinguishing feature of professional-grade productivity tools.

**Independent Test**: Can be fully tested by executing all documented shortcuts and verifying they trigger the correct actions without conflicts.

**Acceptance Scenarios**:

1. **Given** a user wants to learn shortcuts, **When** they press "?" or access the help menu, **Then** they see a modal showing all available keyboard shortcuts organized by category
2. **Given** a user presses "C" (create) anywhere in the app, **When** the shortcut is triggered, **Then** the new task modal opens immediately
3. **Given** a user has a task selected, **When** they press "E" (edit), "D" (delete), or "Space" (toggle complete), **Then** the corresponding action is performed on the selected task
4. **Given** a user wants to navigate, **When** they press "J" and "K", **Then** they can move up and down through their task list without using the mouse
5. **Given** a user presses "/" (search), **When** the shortcut is triggered, **Then** the cursor focuses on the search input and they can begin typing immediately

---

### User Story 3.4 - Calendar View (Priority: P2)

Users can view their tasks in a calendar layout organized by due dates, providing a temporal perspective on their workload and helping with time management.

**Why this priority**: Calendar view is intuitive for date-based planning and helps users visualize their schedule. It's a common expectation in task management tools.

**Independent Test**: Can be fully tested by creating tasks with various due dates and viewing them in calendar mode with monthly, weekly, and daily views.

**Acceptance Scenarios**:

1. **Given** a user switches to calendar view, **When** the calendar renders, **Then** they see tasks displayed on their respective due dates in a monthly calendar grid
2. **Given** a user views a specific date in the calendar, **When** multiple tasks are due that day, **Then** tasks are stacked or listed under that date with overflow indicators if space is limited
3. **Given** a user wants to see more detail, **When** they switch to week view, **Then** tasks are shown in a weekly calendar with time slots and better visibility for daily planning
4. **Given** a user in calendar view, **When** they click on a task, **Then** a quick-view panel shows task details with options to edit, complete, or reschedule
5. **Given** a user wants to reschedule, **When** they drag a task to a different date in calendar view, **Then** the task's due date updates immediately and the task moves to the new date

---

### User Story 3.5 - Kanban Board View (Priority: P3)

Users can view and manage tasks in a Kanban-style board with customizable columns (e.g., To Do, In Progress, Done), using drag-and-drop to update task status.

**Why this priority**: Kanban boards are popular for visual task management and workflow visualization. They appeal to users familiar with Trello, Jira, and similar tools.

**Independent Test**: Can be fully tested by creating custom board columns, dragging tasks between columns, and verifying status updates and persistence.

**Acceptance Scenarios**:

1. **Given** a user switches to board view, **When** the board renders, **Then** they see columns representing task stages (customizable) with tasks organized vertically in each column
2. **Given** a user wants to organize their board, **When** they create, rename, or delete columns, **Then** the board updates immediately and tasks in deleted columns are moved to a default column
3. **Given** a user wants to update task progress, **When** they drag a task from one column to another, **Then** the task moves smoothly and its status/stage is updated accordingly
4. **Given** a user has many tasks in a column, **When** viewing the board, **Then** columns are scrollable independently and maintain their position when navigating
5. **Given** a user wants to focus on specific work, **When** they filter the board (by priority, tag, or project), **Then** only matching tasks appear in their respective columns

---

### User Story 3.6 - Custom Filters & Saved Presets (Priority: P3)

Users can create complex multi-criteria filters to find specific task subsets and save these filters as named presets for quick access to frequently used views.

**Why this priority**: As task databases grow, users need powerful filtering to find what they need. Saved filters enable quick switching between different work contexts.

**Independent Test**: Can be fully tested by creating various filter combinations, saving them as presets, and switching between presets to verify task lists update correctly.

**Acceptance Scenarios**:

1. **Given** a user wants to filter tasks, **When** they open the filter panel, **Then** they can combine multiple criteria (priority, status, tag, project, date range, assignee)
2. **Given** a user has created a useful filter, **When** they click "Save as Preset", **Then** they can name the filter and it appears in their saved presets list
3. **Given** a user has saved filter presets, **When** they click a preset name, **Then** the filter is instantly applied to their task list
4. **Given** a user wants quick access to common views, **When** they look at the sidebar, **Then** they see preset buttons for "Today", "This Week", "High Priority", etc.
5. **Given** a user shares work with others, **When** they have a saved filter, **Then** they can share the filter URL so others can view the same filtered task list

---

### User Story 3.7 - Enhanced Empty & Loading States (Priority: P4)

The application provides helpful, visually appealing empty states when users have no tasks, and clear loading indicators during data operations, improving perceived performance and user guidance.

**Why this priority**: Empty states are onboarding opportunities and loading states manage user expectations. Both significantly impact user experience and satisfaction.

**Independent Test**: Can be fully tested by viewing the app with no tasks, creating/deleting tasks to see empty states, and observing loading indicators during slow network conditions.

**Acceptance Scenarios**:

1. **Given** a new user logs in with no tasks, **When** they view their task list, **Then** they see a welcoming empty state with helpful tips and a prominent "Create First Task" button
2. **Given** a user applies filters that match no tasks, **When** the empty list displays, **Then** they see a relevant message suggesting they adjust filters with quick-clear option
3. **Given** a user performs an action that requires server communication, **When** the action is processing, **Then** they see appropriate loading indicators (spinners, skeleton screens) with context about what's happening
4. **Given** a user creates or edits a task, **When** the save operation is in progress, **Then** they see a loading state and the UI prevents duplicate submissions
5. **Given** a slow network connection, **When** loading task lists, **Then** skeleton screens appear showing the layout of tasks while real data loads, improving perceived performance

---

## Phase 4 - Advanced Features

### User Story 4.1 - Email Notifications for Due Dates (Priority: P1)

Users receive timely email notifications before tasks are due, with customizable notification timing preferences, ensuring they never miss important deadlines.

**Why this priority**: Notifications extend the app's value beyond active usage. Users stay informed about deadlines even when not actively using the application.

**Independent Test**: Can be fully tested by creating tasks with various due dates, setting notification preferences, and verifying emails are sent at the correct times.

**Acceptance Scenarios**:

1. **Given** a user has tasks with due dates, **When** a task is due tomorrow, **Then** the user receives an email notification at their preferred time (default: 9 AM)
2. **Given** a user wants to customize notifications, **When** they access notification settings, **Then** they can choose when to be notified (1 day, 1 hour, 1 week before due date)
3. **Given** a user receives a notification email, **When** they open it, **Then** it contains task details, due date, priority, and direct links to complete or reschedule
4. **Given** multiple tasks are due soon, **When** notification time arrives, **Then** tasks are grouped in a single digest email rather than sending multiple emails
5. **Given** a user completes a task before the notification time, **When** the notification would have been sent, **Then** no notification is sent for that completed task

---

### User Story 4.2 - Task Comments & Notes (Priority: P2)

Users can add timestamped comments and notes to tasks, creating a discussion thread or activity log that provides context and documents decision-making.

**Why this priority**: Comments add essential context to tasks, especially in collaborative environments or for complex tasks that evolve over time.

**Independent Test**: Can be fully tested by adding comments to tasks, editing/deleting comments, and verifying chronological display and persistence.

**Acceptance Scenarios**:

1. **Given** a user views a task, **When** they access the comments section, **Then** they can add a new comment and see all previous comments in chronological order
2. **Given** a user adds a comment, **When** they save it, **Then** the comment appears with timestamp, author name, and displays any formatting (bold, lists, links)
3. **Given** a user has written a comment, **When** they want to edit or delete it, **Then** they can modify their own comments within 24 hours or delete at any time
4. **Given** a task has multiple comments, **When** viewing the task, **Then** comments are collapsed by default with a count indicator and can be expanded to view full discussion
5. **Given** a user mentions another user in a comment (future: "@username"), **When** the comment is posted, **Then** the mentioned user receives a notification (if collaboration features exist)

---

### User Story 4.3 - File Attachments (Priority: P2)

Users can attach files and links to tasks, keeping all relevant materials organized with their tasks and accessible without switching between applications.

**Why this priority**: Tasks often require supporting documents (receipts, contracts, images). Attachments keep everything in one place and improve task context.

**Independent Test**: Can be fully tested by uploading various file types, attaching links, and verifying proper storage, download, and display.

**Acceptance Scenarios**:

1. **Given** a user creates or edits a task, **When** they click "Add Attachment", **Then** they can upload files (images, PDFs, documents up to 10MB each) or paste links
2. **Given** a task has attachments, **When** viewing the task, **Then** attachments are displayed with file icons, names, sizes, and quick preview for images
3. **Given** a user wants to access an attachment, **When** they click on it, **Then** images open in a lightbox viewer and documents download or open in a new tab
4. **Given** a user uploads a large file, **When** uploading, **Then** they see a progress indicator and can cancel the upload if needed
5. **Given** a user deletes a task with attachments, **When** the deletion is confirmed, **Then** associated files are also removed from storage to prevent orphaned data

---

### User Story 4.4 - Subtasks & Checklists (Priority: P3)

Users can break down complex tasks into smaller subtasks or checklist items, enabling better task decomposition and providing clear progress tracking.

**Why this priority**: Complex tasks are overwhelming. Subtasks provide structure and create a sense of progress as items are completed, improving motivation.

**Independent Test**: Can be fully tested by creating parent tasks with multiple subtasks, completing subtasks independently, and verifying progress indicators.

**Acceptance Scenarios**:

1. **Given** a user views a task, **When** they add subtasks, **Then** each subtask has its own checkbox, title, and can be completed independently
2. **Given** a parent task has subtasks, **When** viewing the task list, **Then** the parent task shows progress (e.g., "3/5 completed") and percentage bar
3. **Given** a user completes all subtasks, **When** the last subtask is checked, **Then** the parent task can be automatically marked complete (optional setting)
4. **Given** a user wants detailed subtasks, **When** they create a subtask, **Then** subtasks can have their own due dates, priorities, and notes (but not infinite nesting)
5. **Given** a subtask requires more detail, **When** a user converts it, **Then** a subtask can be promoted to a full independent task with all its information preserved

---

### User Story 4.5 - Time Tracking & Estimates (Priority: P3)

Users can estimate task duration and track actual time spent, providing data for better future planning and productivity analysis.

**Why this priority**: Time awareness improves planning accuracy. Comparing estimates to actuals helps users understand their productivity patterns.

**Independent Test**: Can be fully tested by setting time estimates, using the timer to track work sessions, and viewing time reports.

**Acceptance Scenarios**:

1. **Given** a user creates a task, **When** they set a time estimate, **Then** the estimate is saved and displayed (e.g., "Est: 2 hours")
2. **Given** a user works on a task, **When** they click "Start Timer", **Then** a timer begins tracking elapsed time and displays in real-time
3. **Given** a timer is running, **When** the user stops it, **Then** the elapsed time is added to the task's total tracked time
4. **Given** a task has estimated and tracked time, **When** viewing the task, **Then** progress is shown as percentage (e.g., "1.5h / 2h = 75%") with visual indicator
5. **Given** a user wants to understand their time usage, **When** they view analytics, **Then** they see actual vs estimated time across all tasks with trends over time

---

### User Story 4.6 - Productivity Analytics Dashboard (Priority: P4)

Users can view comprehensive analytics about their task completion patterns, productivity trends, and time allocation, enabling data-driven productivity improvements.

**Why this priority**: Analytics transform raw task data into actionable insights, helping users identify patterns, optimize workflows, and stay motivated.

**Independent Test**: Can be fully tested by creating and completing tasks over time and verifying all analytics update correctly with accurate calculations.

**Acceptance Scenarios**:

1. **Given** a user accesses the analytics dashboard, **When** it loads, **Then** they see key metrics: tasks completed today/week/month, completion rate, average time to completion
2. **Given** a user views completion trends, **When** the chart displays, **Then** they see a line graph showing tasks completed per day over the last 30 days with trend indicators
3. **Given** a user wants to understand priority distribution, **When** viewing analytics, **Then** they see pie charts showing task breakdown by priority, project, and category
4. **Given** a user has tracked time, **When** viewing time analytics, **Then** they see how much time was spent on different projects, priorities, and days of the week
5. **Given** a user wants to improve productivity, **When** viewing insights, **Then** they see personalized suggestions (e.g., "You complete most tasks on Tuesday mornings" or "High priority tasks take 2x longer than estimated")

---

### User Story 4.7 - Data Export & Integrations (Priority: P4)

Users can export their task data in multiple formats and integrate with external tools, ensuring data portability and compatibility with existing workflows.

**Why this priority**: Data export provides user confidence (no lock-in) and integrations extend the app's value by connecting to users' existing tool ecosystems.

**Independent Test**: Can be fully tested by exporting data in all formats, importing into other tools, and verifying data integrity and completeness.

**Acceptance Scenarios**:

1. **Given** a user wants to export data, **When** they access export options, **Then** they can choose format (CSV, JSON, PDF report) and scope (all tasks, filtered tasks, date range)
2. **Given** a user exports to CSV, **When** the export completes, **Then** they receive a properly formatted spreadsheet with all task fields in columns
3. **Given** a user exports to PDF, **When** the report generates, **Then** it includes a professional summary of tasks with formatting, charts, and completion statistics
4. **Given** a user wants calendar integration, **When** they access integration settings, **Then** they can subscribe to a calendar feed (iCal format) that updates automatically
5. **Given** a user uses automation tools, **When** they access API documentation, **Then** they can create webhooks that notify external services when tasks are created, updated, or completed

---

## Edge Cases (All Phases)

### Security & Data Integrity

- What happens when a password reset link is used after the password has already been reset?
- How does the system handle concurrent login attempts from different locations?
- What happens when a user tries to verify an email address that has already been verified?
- How are orphaned sessions cleaned up when the database has data inconsistencies?
- What happens when a user exports data that exceeds reasonable size limits?

### Organization & Scaling

- What happens when a user has 1000+ tasks and tries to apply filters or search?
- How does the system handle a task that belongs to both an archived project and an active category?
- What happens when a user tries to create a recurring task with conflicting rules (e.g., monthly on the 31st)?
- How are subtasks handled when a parent task is deleted or archived?
- What happens when bulk operations fail partway through (e.g., network error after processing 50 of 100 tasks)?

### UI/UX Edge Cases

- What happens when a user resizes their browser window while dragging tasks in Kanban view?
- How does the calendar view handle tasks due at midnight (transition between days)?
- What happens when keyboard shortcuts conflict with browser shortcuts?
- How does dark mode handle user-uploaded images or custom colors?
- What happens when notification emails fail to send (email service down)?

### Collaboration & Timing

- What happens when two users edit the same comment simultaneously?
- How does the system handle file upload failures during task creation?
- What happens when a user's computer clock is incorrect when tracking time?
- How are notification times handled across different timezones?
- What happens when analytics need to be calculated for a user with years of historical data?

---

## Requirements (All Phases)

### Phase 1 - Security & Foundation Requirements

#### Functional Requirements (Phase 1)

- **FR-101**: System MUST provide password reset functionality via email with time-limited secure tokens (1 hour expiration)
- **FR-102**: System MUST send verification emails to new users and restrict access until verification is complete
- **FR-103**: System MUST track all active user sessions with device, browser, location, and timestamp information
- **FR-104**: Users MUST be able to view and remotely terminate any active session
- **FR-105**: System MUST enforce password requirements: minimum 8 characters, uppercase, lowercase, number, special character
- **FR-106**: System MUST provide real-time password strength feedback during creation/change
- **FR-107**: System MUST implement progressive login lockout after 5 failed attempts (15-minute lockout)
- **FR-108**: System MUST log all security-relevant user activities (login, logout, password change, email verification, session termination)
- **FR-109**: Users MUST be able to export all their personal data in JSON format
- **FR-110**: Users MUST be able to permanently delete their account with 30-day grace period
- **FR-111**: System MUST send email notifications for security events (new login, password change, account deletion)

#### Non-Functional Requirements (Phase 1)

- **NFR-101**: Password reset emails MUST be delivered within 2 minutes
- **NFR-102**: Verification emails MUST be delivered within 1 minute of registration
- **NFR-103**: Session termination MUST take effect within 5 seconds globally
- **NFR-104**: Password validation MUST respond in real-time (< 100ms)
- **NFR-105**: Activity logs MUST be retained for minimum 90 days
- **NFR-106**: Data export generation MUST complete within 2 minutes for up to 10,000 tasks
- **NFR-107**: Account deletion MUST completely remove all user data within 30 days
- **NFR-108**: All security events MUST be logged with IP address and user agent

### Phase 2 - Organization & Productivity Requirements

#### Functional Requirements (Phase 2)

- **FR-201**: Users MUST be able to create, rename, and delete custom categories with color assignments
- **FR-202**: Users MUST be able to create and assign multiple tags to any task
- **FR-203**: System MUST allow filtering and grouping tasks by categories and tag combinations
- **FR-204**: Users MUST be able to create projects/lists and assign tasks to them
- **FR-205**: System MUST provide project progress tracking (completion percentage)
- **FR-206**: System MUST provide full-text search across task titles, descriptions, and tags
- **FR-207**: Search results MUST be ranked by relevance and recency
- **FR-208**: Users MUST be able to select multiple tasks and perform bulk operations (complete, delete, move, change priority)
- **FR-209**: Users MUST be able to manually archive completed tasks or enable auto-archiving
- **FR-210**: Archived tasks MUST be searchable and restorable but hidden from main views
- **FR-211**: Users MUST be able to create recurring tasks with daily, weekly, monthly, and yearly patterns
- **FR-212**: System MUST automatically generate next instances of recurring tasks when current instance is completed
- **FR-213**: System MUST provide quick-add interface with natural language parsing for dates and priorities

#### Non-Functional Requirements (Phase 2)

- **NFR-201**: Category and tag operations MUST complete within 500ms
- **NFR-202**: Search results MUST appear within 1 second for databases up to 10,000 tasks
- **NFR-203**: Bulk operations MUST handle up to 100 tasks simultaneously
- **NFR-204**: Project views MUST load within 2 seconds regardless of task count
- **NFR-205**: Recurring task generation MUST happen within 1 minute of instance completion
- **NFR-206**: Quick-add natural language parsing MUST have 85% accuracy rate for common patterns

### Phase 3 - Design & UX Requirements

#### Functional Requirements (Phase 3)

- **FR-301**: System MUST provide light and dark theme options with smooth transitions
- **FR-302**: User theme preferences MUST be saved and applied automatically
- **FR-303**: System MUST detect and respect user's operating system theme preference
- **FR-304**: All UI elements MUST meet WCAG 2.1 AA contrast ratios (4.5:1 for text, 3:1 for large text)
- **FR-305**: All interactive elements MUST be keyboard accessible with visible focus indicators
- **FR-306**: All images and icons MUST have appropriate alternative text
- **FR-307**: System MUST provide comprehensive keyboard shortcuts for common actions
- **FR-308**: Keyboard shortcuts MUST be discoverable via in-app help modal
- **FR-309**: System MUST provide calendar view with monthly, weekly, and daily layouts
- **FR-310**: Users MUST be able to drag tasks to different dates in calendar view to reschedule
- **FR-311**: System MUST provide Kanban board view with customizable columns
- **FR-312**: Users MUST be able to drag tasks between columns in board view
- **FR-313**: Users MUST be able to create complex multi-criteria filters
- **FR-314**: Users MUST be able to save filter combinations as named presets
- **FR-315**: System MUST provide helpful empty states with onboarding guidance
- **FR-316**: All data-loading operations MUST show appropriate loading indicators

#### Non-Functional Requirements (Phase 3)

- **NFR-301**: Theme switching MUST occur within 300ms with smooth transitions
- **NFR-302**: All pages MUST be navigable entirely by keyboard
- **NFR-303**: Focus indicators MUST be visible with 3:1 contrast ratio
- **NFR-304**: Calendar view MUST render within 1 second for current month
- **NFR-305**: Drag-and-drop operations MUST have < 16ms frame time for smooth animation
- **NFR-306**: Board view MUST support at least 8 columns with 100+ tasks total
- **NFR-307**: Filter application MUST complete within 500ms
- **NFR-308**: Skeleton screens MUST appear within 100ms of navigation

### Phase 4 - Advanced Features Requirements

#### Functional Requirements (Phase 4)

- **FR-401**: System MUST send email notifications based on user-configured timing preferences (1 hour, 1 day, 1 week before due)
- **FR-402**: Email notifications MUST include task details and direct action links
- **FR-403**: System MUST group multiple notifications into digest emails when appropriate
- **FR-404**: Users MUST be able to add, edit, and delete comments on tasks
- **FR-405**: Comments MUST display with timestamp and author information
- **FR-406**: Users MUST be able to attach files (max 10MB each) and links to tasks
- **FR-407**: System MUST provide preview functionality for attached images
- **FR-408**: Users MUST be able to create subtasks/checklists within parent tasks
- **FR-409**: Parent tasks MUST show progress indicators based on subtask completion
- **FR-410**: Users MUST be able to set time estimates and track actual time spent on tasks
- **FR-411**: System MUST provide timer functionality for tracking work sessions
- **FR-412**: System MUST display productivity analytics including completion rates, trends, and time allocation
- **FR-413**: Analytics MUST provide actionable insights and productivity suggestions
- **FR-414**: Users MUST be able to export data in CSV, JSON, and PDF formats
- **FR-415**: System MUST provide iCal feed for calendar integration
- **FR-416**: System MUST provide webhook support for external integrations

#### Non-Functional Requirements (Phase 4)

- **NFR-401**: Email notifications MUST be sent within 5 minutes of scheduled time
- **NFR-402**: Notification emails MUST be delivered within 2 minutes of being triggered
- **NFR-403**: Comment addition MUST complete within 500ms
- **NFR-404**: File uploads MUST show progress indicator and support cancellation
- **NFR-405**: File downloads MUST begin within 1 second of click
- **NFR-406**: Subtask operations MUST not degrade parent task performance
- **NFR-407**: Timer must track time with 1-second precision
- **NFR-408**: Analytics calculations MUST complete within 3 seconds for up to 10,000 tasks
- **NFR-409**: Data exports MUST generate within 2 minutes for typical user data
- **NFR-410**: Calendar feed MUST update within 5 minutes of task changes
- **NFR-411**: Webhooks MUST fire within 30 seconds of triggering event

### Key Entities (Additional)

- **Category**: Represents a user-defined task category with name, color, and icon
- **Tag**: Represents a keyword/label that can be applied to multiple tasks for flexible organization
- **Project**: Represents a collection of related tasks with name, description, and completion tracking
- **RecurrencePattern**: Defines how often a task repeats (frequency, interval, end condition)
- **Comment**: Represents a timestamped note attached to a task with author and content
- **Attachment**: Represents a file or link associated with a task with metadata (name, size, type)
- **Subtask**: Represents a smaller task nested within a parent task with its own completion status
- **TimeEntry**: Represents a work session with start time, end time, and associated task
- **FilterPreset**: Represents a saved filter configuration with name and criteria
- **ActivityLog**: Represents a user action with timestamp, action type, IP address, and details
- **Session**: Represents an authenticated user session with device, browser, location, and expiration

---

## Success Criteria (All Phases)

### Phase 1 - Security & Foundation Success Criteria

- **SC-101**: 95% of password reset requests result in successful password changes within 24 hours
- **SC-102**: 90% of new users verify their email within 1 hour of registration
- **SC-103**: Users can view and manage all active sessions with 100% accuracy
- **SC-104**: 80% of users create passwords that meet strength requirements on first attempt
- **SC-105**: Account lockout prevents 99% of brute force attempts while allowing legitimate access after cooldown
- **SC-106**: Activity logs are complete and accurate with < 0.1% missing entries
- **SC-107**: Data export completes successfully for 99% of requests
- **SC-108**: Account deletion permanently removes all user data with 100% compliance

### Phase 2 - Organization & Productivity Success Criteria

- **SC-201**: Users can organize tasks into categories and tags within 2 minutes of learning the feature
- **SC-202**: Search finds relevant tasks within 3 search attempts for 95% of queries
- **SC-203**: Bulk operations complete successfully for 99% of attempts
- **SC-204**: 70% of users who create projects organize at least 10 tasks within them
- **SC-205**: Archive feature is used by 40% of active users within first month
- **SC-206**: Recurring tasks generate correct next instances with 99.9% accuracy
- **SC-207**: Quick-add correctly parses natural language in 85% of common patterns

### Phase 3 - Design & UX Success Criteria

- **SC-301**: 60% of users enable dark mode within first session
- **SC-302**: Application achieves 100% keyboard navigability with no trapped focus
- **SC-303**: All text passes WCAG 2.1 AA contrast requirements (automated testing)
- **SC-304**: Calendar and board views are used by 50% of active users monthly
- **SC-305**: Users create and use saved filter presets averaging 3 per active user
- **SC-306**: Keyboard shortcuts increase task management speed by 30% for users who adopt them
- **SC-307**: Empty states convert 40% of new users to create their first task

### Phase 4 - Advanced Features Success Criteria

- **SC-401**: Email notifications have 95% delivery rate and 30% click-through rate
- **SC-402**: 25% of tasks have at least one comment within 3 months of feature launch
- **SC-403**: File attachments are used on 15% of tasks by active users
- **SC-404**: Tasks with subtasks show 20% higher completion rates than tasks without
- **SC-405**: Users who track time show 15% more accurate future time estimates
- **SC-406**: Analytics dashboard is viewed by 40% of active users monthly
- **SC-407**: 20% of users export their data at least once within first year
- **SC-408**: Calendar integrations maintain 99% sync accuracy with < 5-minute lag

---

## Implementation Notes

### Phased Rollout Strategy

- Each phase should be completable in 2-4 week sprints
- Phases can be released to production independently
- User feedback should inform priority adjustments between phases
- Feature flags should control progressive rollout within phases

### Testing Strategy

- Unit tests required for all business logic (80% coverage minimum)
- Integration tests for all API endpoints and database operations
- E2E tests for critical user journeys in each phase
- Accessibility testing required for Phase 3 (automated + manual)
- Load testing required before each phase goes to production
- Security testing (OWASP Top 10) required for Phase 1 and before final release

### Migration Considerations

- Phase 1: Existing users must verify email on first login after deployment
- Phase 2: Existing tasks auto-assigned to "Uncategorized" category
- Phase 3: Existing users default to light theme unless system preference detected
- Phase 4: Historical tasks analyzed for initial analytics (may require background processing)

### Performance Targets

- All phases must maintain < 2-second response time for 95th percentile
- Database queries must be optimized with proper indexing
- Frontend bundles must remain under 500KB gzipped
- Images and assets must be optimized and lazy-loaded
- API rate limiting must prevent abuse while allowing normal usage

---

## Phase 5 - Administration & System Management

### User Story 5.1 - User Management (Priority: P1)

Administrators need comprehensive user management capabilities to maintain system integrity, handle support requests, and ensure proper account lifecycle management.

**Why this priority**: User management is foundational for administration. Without it, administrators cannot handle basic support tasks like account lockouts, suspicious activity, or user data requests.

**Independent Test**: Can be fully tested by creating admin account, viewing all users, managing user states (active/suspended), and verifying role assignments work correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator, **When** they access the admin dashboard, **Then** they see a paginated list of all registered users with key information (email, username, registration date, last login, status)
2. **Given** an administrator viewing the user list, **When** they search by email/username or filter by status/registration date, **Then** the list updates to show matching users only
3. **Given** an administrator viewing a specific user, **When** they click on a user record, **Then** they see detailed user information including account statistics (total tasks, completion rate, last activity)
4. **Given** an administrator viewing user details, **When** they suspend a user account, **Then** the user is immediately logged out and cannot log in until reactivated
5. **Given** an administrator viewing user details, **When** they reset a user's password, **Then** a secure reset link is generated and can be sent to the user's email
6. **Given** an administrator, **When** they assign or revoke admin privileges for a user, **Then** the changes take effect immediately and are logged in the audit trail
7. **Given** a suspended user attempts to log in, **When** they enter valid credentials, **Then** they receive a clear message that their account has been suspended
8. **Given** an administrator, **When** they bulk export user data for GDPR compliance, **Then** they receive a secure download containing requested user information in JSON/CSV format

---

### User Story 5.2 - Target & Goal Management (Priority: P2)

Administrators can define system-wide default goals, create recommended target templates, and monitor user engagement with goal-setting features to encourage productivity.

**Why this priority**: Centralised goal management allows administrators to establish productivity benchmarks, create guided experiences for new users, and analyze goal-setting patterns across the user base.

**Independent Test**: Can be fully tested by creating default targets, assigning them to new users, creating target templates, and verifying users see and can adopt these suggestions.

**Acceptance Scenarios**:

1. **Given** an administrator accesses target management, **When** they set a system-wide default weekly task goal, **Then** all new user accounts are created with this default goal automatically applied
2. **Given** an administrator, **When** they create a target template (e.g., "Beginner: 5 tasks/week", "Professional: 15 tasks/week"), **Then** the template is available for users to select during onboarding or in settings
3. **Given** an administrator views target analytics, **When** they access the goals dashboard, **Then** they see aggregate statistics (average goals set, achievement rates, most popular targets, goal adoption rate)
4. **Given** an administrator, **When** they update a default goal value, **Then** existing users are notified of the recommended adjustment (but not forced to change)
5. **Given** an administrator creates a seasonal goal template (e.g., "New Year Sprint: 20 tasks/week"), **When** they publish it with a date range, **Then** it appears as a suggested goal to active users during that period
6. **Given** an administrator, **When** they view individual user goal history, **Then** they can see goal changes over time, achievement patterns, and identify users who might benefit from adjusted targets

---

### User Story 5.3 - System Analytics & Insights (Priority: P2)

Administrators need comprehensive visibility into system usage, user engagement patterns, and application health metrics to make informed decisions about features and infrastructure.

**Why this priority**: Data-driven decision making requires comprehensive analytics. Understanding how users interact with the system helps prioritize features, identify issues, and optimize user experience.

**Independent Test**: Can be fully tested by generating various activities across test accounts, accessing analytics dashboard, and verifying all metrics calculate correctly with proper date range filtering.

**Acceptance Scenarios**:

1. **Given** an administrator accesses the analytics dashboard, **When** the dashboard loads, **Then** they see key metrics: total users (active/inactive), tasks created/completed (daily/weekly/monthly), average completion rate, and system uptime
2. **Given** an administrator views engagement metrics, **When** they select a date range, **Then** they see user activity trends (daily active users, new registrations, returning users, churn rate) with visual charts
3. **Given** an administrator accesses productivity insights, **When** they view task statistics, **Then** they see average tasks per user, most common priorities, completion time patterns, and peak usage hours
4. **Given** an administrator views feature adoption metrics, **When** they access the features dashboard, **Then** they see usage statistics for each feature (groups, priorities, due dates, recurring tasks) with adoption percentages
5. **Given** an administrator, **When** they export analytics data for reporting, **Then** they can download comprehensive reports in CSV/Excel format with customizable date ranges and metrics
6. **Given** an administrator monitoring system health, **When** they view the technical dashboard, **Then** they see API response times, error rates, database performance metrics, and authentication success rates
7. **Given** an administrator analyzing user retention, **When** they view cohort analysis, **Then** they see user retention curves grouped by registration month with week-over-week engagement patterns

---

### User Story 5.4 - Content Moderation & Data Management (Priority: P3)

Administrators need tools to moderate user-generated content, manage inappropriate task groups, and handle data cleanup requests while maintaining user privacy and system integrity.

**Why this priority**: As the user base grows, content moderation becomes necessary to maintain a professional environment and comply with data privacy regulations.

**Independent Test**: Can be fully tested by creating flagged content, reviewing it in admin panel, taking moderation actions, and verifying users receive appropriate notifications.

**Acceptance Scenarios**:

1. **Given** a task group is flagged (automatically by keyword filter or manually reported), **When** an administrator views the moderation queue, **Then** they see the flagged item with context (user, creation date, flag reason)
2. **Given** an administrator reviewing flagged content, **When** they approve the content as acceptable, **Then** the flag is removed and the content remains visible to the user
3. **Given** an administrator reviewing inappropriate content, **When** they remove it, **Then** the content is hidden from the user, they receive a notification explaining the removal, and the action is logged
4. **Given** an administrator, **When** they configure automatic content filters, **Then** they can add keywords/patterns that trigger automatic flagging for manual review
5. **Given** a user requests account deletion (GDPR compliance), **When** an administrator processes the request, **Then** all user data is permanently deleted after a 30-day grace period, with confirmation sent to the user
6. **Given** an administrator, **When** they perform data cleanup operations, **Then** they can identify and remove orphaned records, old completed tasks (by user preference), and inactive accounts (90+ days)
7. **Given** an administrator viewing data management dashboard, **When** they access storage metrics, **Then** they see database size, task volume per user, and can identify users with excessive data storage

---

### User Story 5.5 - System Configuration & Feature Flags (Priority: P3)

Administrators can control system-wide settings, enable/disable features dynamically, and configure application behavior without code deployments, enabling rapid response to issues.

**Why this priority**: Dynamic configuration allows administrators to respond quickly to issues, test features with subsets of users, and adjust system behavior based on real-time conditions.

**Independent Test**: Can be fully tested by modifying feature flags, adjusting system settings, and verifying changes take effect immediately for affected users without requiring restarts.

**Acceptance Scenarios**:

1. **Given** an administrator accesses system configuration, **When** they view the settings panel, **Then** they see configurable options: maintenance mode, registration enabled, email notifications, rate limiting, session timeout
2. **Given** an administrator, **When** they enable maintenance mode, **Then** all users (except admins) see a maintenance message and cannot access the application until disabled
3. **Given** an administrator managing feature flags, **When** they access the feature flags panel, **Then** they see all available features with current state (enabled/disabled/percentage rollout)
4. **Given** an administrator, **When** they enable a feature for percentage rollout (e.g., "Calendar View - 25%"), **Then** approximately 25% of active users see the feature, randomly assigned and consistently maintained
5. **Given** an administrator, **When** they disable new user registration, **Then** the registration page shows an informational message and existing users can continue using the application
6. **Given** an administrator configuring rate limits, **When** they adjust API rate limit values (requests per minute/hour), **Then** the new limits apply immediately to all incoming requests
7. **Given** an administrator, **When** they configure email settings (SMTP, sender address, template defaults), **Then** all outgoing emails use the updated configuration
8. **Given** an administrator enabling emergency features, **When** they activate "read-only mode," **Then** users can view their tasks but cannot create, edit, or delete until disabled

---

### User Story 5.6 - Audit Logging & Compliance (Priority: P2)

All administrative actions must be comprehensively logged with tamper-proof audit trails, enabling compliance with data protection regulations and providing accountability.

**Why this priority**: Audit logging is critical for security, compliance (GDPR, SOC2), and debugging. It provides transparency and accountability for all administrative actions.

**Independent Test**: Can be fully tested by performing various admin actions, viewing the audit log, filtering by action type/user/date, and verifying all sensitive operations are recorded with complete context.

**Acceptance Scenarios**:

1. **Given** an administrator performs any action (user suspension, goal modification, feature flag change), **When** the action completes, **Then** it is immediately logged with timestamp, admin user, action type, affected entity, and before/after values
2. **Given** an administrator views the audit log, **When** they access the logs dashboard, **Then** they see a paginated, searchable list of all administrative actions with detailed context
3. **Given** an administrator searching audit logs, **When** they filter by action type, date range, admin user, or affected user, **Then** the log updates to show only matching entries
4. **Given** an auditor or compliance officer, **When** they export audit logs for a specific period, **Then** they receive a tamper-evident export (with checksums) containing all relevant log entries
5. **Given** a security incident requires investigation, **When** an administrator searches for suspicious activity, **Then** they can trace all actions related to a specific user account or time period
6. **Given** audit log retention policies, **When** logs exceed the retention period (e.g., 2 years), **Then** they are automatically archived to long-term storage before being removed from active database
7. **Given** critical administrative actions (privilege escalation, bulk deletions), **When** they are performed, **Then** additional verification is required and the action is highlighted in audit logs

---

### User Story 5.7 - Notification & Communication Management (Priority: P3)

Administrators can send system-wide announcements, manage notification templates, and monitor email delivery status to ensure effective communication with users.

**Why this priority**: Centralized communication management allows administrators to inform users of updates, maintenance windows, and important changes while monitoring delivery effectiveness.

**Independent Test**: Can be fully tested by creating announcements, customizing notification templates, sending test communications, and verifying delivery status tracking works correctly.

**Acceptance Scenarios**:

1. **Given** an administrator creating a system announcement, **When** they compose a message with title, body, severity level (info/warning/critical), and target audience (all/active/specific), **Then** the announcement is queued for delivery
2. **Given** an administrator publishes an announcement, **When** users next log in, **Then** they see the announcement as a prominent banner/modal (based on severity) until dismissed
3. **Given** an administrator managing notification templates, **When** they access the templates panel, **Then** they can edit email templates for all automated notifications (password reset, verification, task reminders)
4. **Given** an administrator customizing email templates, **When** they use template variables ({{username}}, {{taskCount}}, {{url}}), **Then** the variables are replaced with actual values when emails are sent
5. **Given** an administrator, **When** they view email delivery metrics, **Then** they see statistics: sent count, delivery rate, bounce rate, open rate (if tracking enabled), by email type
6. **Given** failed email deliveries, **When** an administrator views the failed delivery log, **Then** they see recipient, timestamp, error message, and can manually retry sending
7. **Given** an administrator scheduling maintenance notifications, **When** they create a scheduled announcement (e.g., "Maintenance in 24 hours"), **Then** it is automatically displayed/sent at the specified time
8. **Given** an administrator, **When** they send a test notification to their own account, **Then** they receive the notification immediately and can verify formatting before broader distribution

---

### User Story 5.8 - Role-Based Access Control (RBAC) (Priority: P1)

The system must support multiple administrator roles with granular permissions, ensuring administrators only have access to functions appropriate to their responsibilities.

**Why this priority**: RBAC is essential for security and compliance in multi-administrator environments. It follows the principle of least privilege and prevents unauthorized access to sensitive functions.

**Independent Test**: Can be fully tested by creating multiple admin accounts with different roles, attempting to access various admin functions, and verifying permission boundaries are enforced correctly.

**Acceptance Scenarios**:

1. **Given** a super administrator, **When** they access role management, **Then** they can define custom roles with specific permissions (e.g., "Content Moderator": read users, edit content, no system config)
2. **Given** a super administrator assigning roles, **When** they grant a user a specific role (e.g., "Support Agent"), **Then** that user gains admin access but only to functions within their role permissions
3. **Given** an administrator with limited permissions (e.g., "Viewer" role), **When** they attempt to access restricted functions (user deletion, system config), **Then** they receive a clear "insufficient permissions" message
4. **Given** predefined roles exist (Super Admin, User Manager, Content Moderator, Analytics Viewer, Support Agent), **When** an administrator is assigned one, **Then** they inherit all permissions defined for that role
5. **Given** a super administrator, **When** they modify role permissions (add/remove capabilities), **Then** all users with that role immediately gain or lose the affected permissions
6. **Given** an administrator performing an action, **When** the action requires specific permissions, **Then** the system validates permissions before execution and logs the authorization check
7. **Given** a support agent (limited role), **When** they view user details, **Then** they see necessary support information but sensitive fields (password hashes, tokens) are redacted
8. **Given** role escalation requests, **When** an administrator requests additional permissions, **Then** the request is logged and requires approval from a super administrator

---

### Technical Requirements for Phase 5

**Backend API Additions**:
- New AdminController with RBAC middleware enforcement
- User management endpoints (list, search, suspend, activate, export)
- Target management endpoints (CRUD operations for defaults and templates)
- Analytics aggregation service with caching for performance
- Audit logging service with write-only append operations
- Feature flag service with percentage-based rollout logic
- Content moderation queue with workflow management
- System configuration service with validation and hot-reload
- Email management service with template rendering engine
- RBAC permission checking middleware with role hierarchy

**Frontend Components**:
- Admin dashboard with navigation sidebar
- User management table with search, filter, and pagination
- Target management interface with template builder
- Analytics dashboard with charts (using Recharts or Chart.js)
- Audit log viewer with advanced filtering
- Feature flag toggle interface with rollout percentage slider
- Content moderation queue with approve/reject workflow
- System settings panel with real-time validation
- Notification composer with preview functionality
- Role management interface with permission matrix

**Database Schema**:
```sql
-- Admin roles and permissions
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL, -- Flexible permission structure
  is_system_role BOOLEAN DEFAULT FALSE, -- Prevents deletion of core roles
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User role assignments
CREATE TABLE user_admin_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- System-wide target templates
CREATE TABLE target_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'weekly_tasks', 'daily_tasks', 'completion_rate'
  difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  is_default BOOLEAN DEFAULT FALSE,
  active_from DATE,
  active_until DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for all admin actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL, -- 'user_suspend', 'goal_update', 'feature_toggle', etc.
  entity_type VARCHAR(100), -- 'user', 'task', 'system_config', etc.
  entity_id UUID,
  before_value JSONB, -- State before action
  after_value JSONB, -- State after action
  ip_address VARCHAR(45),
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Feature flags for dynamic feature control
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 100, -- 0-100 for gradual rollout
  enabled_for_user_ids UUID[], -- Specific user allowlist
  disabled_for_user_ids UUID[], -- Specific user blocklist
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System-wide announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'active', 'admins'
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track which users have dismissed announcements
CREATE TABLE user_dismissed_announcements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

-- Content moderation queue
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'task_group', 'task', 'user_profile'
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flag_reason VARCHAR(100),
  flagged_content TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'removed'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email notification tracking
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_address VARCHAR(255) NOT NULL,
  email_type VARCHAR(100) NOT NULL, -- 'password_reset', 'verification', 'announcement'
  subject VARCHAR(500),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  error_message TEXT,
  opened_at TIMESTAMP -- Optional: for tracking (requires email tracking pixel)
);

-- System configuration (key-value store)
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  data_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
  requires_restart BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes for Performance**:
```sql
-- Audit log queries
CREATE INDEX idx_audit_logs_admin_user ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- User management queries
CREATE INDEX idx_users_status ON users(account_status) WHERE account_status IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC NULLS LAST);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- Feature flag lookups
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled) WHERE enabled = true;

-- Moderation queue
CREATE INDEX idx_moderation_status ON moderation_queue(status, created_at DESC);
CREATE INDEX idx_moderation_user ON moderation_queue(user_id);

-- Email delivery tracking
CREATE INDEX idx_email_logs_user ON email_logs(recipient_user_id);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(delivery_status);
```

**Security Considerations**:
- All admin endpoints require authentication + role-based authorization
- Audit logs are append-only (no updates or deletions allowed via API)
- Sensitive user data (password hashes, tokens) redacted in admin views
- Rate limiting enforced on admin API endpoints (prevents automation abuse)
- Admin sessions have shorter timeout periods (30 minutes vs 24 hours for regular users)
- Two-factor authentication required for super administrator accounts
- IP address logging for all admin actions
- Automatic lockout after 5 failed admin authentication attempts
- Admin actions on user accounts trigger email notifications to affected users
- Bulk operations require additional confirmation step

**Performance Considerations**:
- Analytics queries use materialized views refreshed hourly
- Audit log table partitioned by month for efficient querying
- Feature flag checks cached in-memory with 5-minute TTL
- User search implements full-text search with PostgreSQL's `tsvector`
- Admin dashboard data cached with Redis for 60-second TTL
- Export operations (users, analytics) queued as background jobs
- Large datasets paginated with cursor-based pagination (not offset)

**Accessibility Requirements**:
- Admin interface follows WCAG 2.1 AA standards
- All data tables include keyboard navigation
- Charts include text-based data table alternatives
- Form validation provides clear, accessible error messages
- Confirmation dialogs for destructive actions with clear escape routes

---

### Implementation Priorities for Phase 5

**Critical Path (Must Have)**:
1. User Story 5.8 - RBAC system (security foundation)
2. User Story 5.1 - User management (core admin function)
3. User Story 5.6 - Audit logging (compliance requirement)
4. User Story 5.2 - Target management (addresses user request)

**High Value (Should Have)**:
5. User Story 5.3 - System analytics (data-driven decisions)
6. User Story 5.5 - System configuration & feature flags (operational flexibility)

**Nice to Have (Could Have)**:
7. User Story 5.4 - Content moderation (for scaling)
8. User Story 5.7 - Notification management (enhanced communication)

**Testing Requirements**:
- Unit tests for all permission checking logic (100% coverage required)
- Integration tests for all admin endpoints with various role combinations
- E2E tests for critical admin workflows (user suspension, goal assignment)
- Security testing focused on privilege escalation attempts
- Performance testing for analytics queries with large datasets
- Accessibility testing for entire admin interface

**Estimated Effort**: 6-8 weeks (full-time developer)
- Week 1-2: RBAC system + database schema + audit logging
- Week 3-4: User management + target management
- Week 5-6: System analytics + feature flags + configuration
- Week 7-8: Content moderation + notification management + testing

---

## Phase 6 - Application Hub Dashboard

### User Story 6.1 - Unified Application Portal (Priority: P1)

Users need a central hub dashboard that provides quick access to all applications in the Finance Manager stack, replacing the current To Do-centric dashboard with a true application launcher.

**Why this priority**: As the platform grows to include multiple tools (To Do, Finance Manager, future applications), users need a unified entry point to navigate between applications. This architectural change establishes proper separation of concerns.

**Independent Test**: Can be fully tested by logging in, viewing the hub dashboard with application tiles, clicking through to different applications, and returning to the hub.

**Acceptance Scenarios**:

1. **Given** a user successfully logs in, **When** they land on the application hub, **Then** they see a grid of application tiles including "To Do Manager" (active) and placeholders for upcoming applications
2. **Given** a user viewing the hub dashboard, **When** they click on the "To Do Manager" tile, **Then** they navigate to the To Do application main view (current dashboard becomes `/todo`)
3. **Given** a user in any application, **When** they click the "Home" or logo icon in the navigation, **Then** they return to the application hub
4. **Given** the hub displays application tiles, **When** rendered, **Then** each tile shows: app icon (flat design style), app name, brief description, and "Launch" action
5. **Given** placeholder tiles for unreleased applications, **When** a user hovers over them, **Then** they see a "Coming Soon" badge with estimated release timeframe
6. **Given** a user viewing the hub on mobile, **When** the layout renders, **Then** application tiles stack vertically with full-width responsive design

---

### User Story 6.2 - Persistent Information Bar (Priority: P2)

The hub dashboard features a top information bar displaying contextual user information, real-time data, and quick actions, providing at-a-glance awareness without navigation.

**Why this priority**: A persistent info bar enhances user orientation, provides quick access to account settings, and displays important real-time information that helps users stay informed.

**Independent Test**: Can be fully tested by viewing the info bar, verifying all information displays correctly, testing responsive behavior, and confirming quick actions work.

**Acceptance Scenarios**:

1. **Given** a user views the hub dashboard, **When** the page loads, **Then** the top bar displays: welcome message with username, current date and time, account settings icon, and logout button
2. **Given** the time display in the info bar, **When** one minute passes, **Then** the displayed time updates automatically without page refresh (using client-side interval)
3. **Given** a user viewing the info bar, **When** they see their username, **Then** it's accompanied by a small avatar (user's initials in a coloured circle if no profile picture)
4. **Given** a user clicks the account settings icon in the info bar, **When** activated, **Then** a dropdown menu appears with links to: Profile, Change Password, Email Preferences, Theme Settings
5. **Given** the info bar displays notifications indicator, **When** unread system notifications exist, **Then** a badge shows the count and clicking opens a notification dropdown
6. **Given** the info bar on mobile devices, **When** rendered, **Then** it collapses to show only essential items (username avatar, time, notifications) with hamburger menu for others

---

### User Story 6.3 - Quick Stats Dashboard Widget (Priority: P3)

The hub dashboard includes a quick stats section showing aggregated metrics across all applications, providing users with high-level insights without entering individual apps.

**Why this priority**: Aggregated statistics give users immediate visibility into their productivity and activities across the platform, encouraging engagement and providing value on the landing page.

**Independent Test**: Can be fully tested by completing tasks in the To Do app, returning to hub, and verifying stats update correctly with real-time or periodic refresh.

**Acceptance Scenarios**:

1. **Given** a user views the hub dashboard, **When** they look at the quick stats section, **Then** they see: total tasks (all-time), tasks completed this week, completion rate percentage, active task groups
2. **Given** a user completes a task in the To Do application, **When** they return to the hub, **Then** the quick stats refresh automatically or display a "refresh" button to update stats
3. **Given** the quick stats widget, **When** displaying metrics, **Then** each stat includes a small icon, the metric value (large font), and a label (secondary text)
4. **Given** a user clicks on a quick stat (e.g., "Tasks This Week"), **When** activated, **Then** they navigate to the relevant section in the To Do app with appropriate filters applied
5. **Given** future applications are added (e.g., Finance Manager), **When** they become active, **Then** the quick stats expand to include metrics from those apps (e.g., "Transactions This Month")
6. **Given** a user with no data yet, **When** they view quick stats, **Then** they see empty states with encouraging messages like "Start your first task" or "Track your first transaction"

---

### User Story 6.4 - Application Card Design System (Priority: P2)

Application tiles follow a consistent, accessible design system with flat iconography, clear typography, and visual states (available, coming soon, locked) that align with existing design patterns.

**Why this priority**: Consistent visual design creates a professional, cohesive experience. Establishing design patterns now ensures future applications integrate seamlessly.

**Independent Test**: Can be fully tested by viewing application tiles, verifying visual consistency, testing hover states, and confirming accessibility standards (keyboard navigation, ARIA labels).

**Acceptance Scenarios**:

1. **Given** an application tile is rendered, **When** displayed, **Then** it includes: flat icon (primary colour accent), application name (Heading3 typography), 2-line description (Text typography), visual status indicator
2. **Given** a user hovers over an active application tile, **When** the mouse enters the tile area, **Then** the tile background shifts to a subtle hover colour and displays a slight elevation shadow
3. **Given** an application tile for an unreleased app, **When** rendered, **Then** it displays with reduced opacity (70%), "Coming Soon" badge (top-right corner), and is non-interactive (cursor: not-allowed)
4. **Given** a user with insufficient permissions for an app (e.g., admin-only tool), **When** viewing the hub, **Then** that tile shows a lock icon and "Restricted Access" badge
5. **Given** the application tiles grid, **When** rendered on desktop, **Then** tiles display 3 per row with consistent spacing; on tablet: 2 per row; on mobile: 1 per row (full width)
6. **Given** keyboard navigation on the hub, **When** a user tabs through tiles, **Then** each tile receives focus styling (outline border, primary colour) and can be activated with Enter/Space keys
7. **Given** an application tile icon, **When** designed, **Then** it follows flat design principles: simple geometric shapes, solid colours (no gradients), 2-3 colour palette maximum, 64x64px minimum size

---

### User Story 6.5 - Recent Activity Feed (Priority: P3)

The hub dashboard displays a recent activity feed showing the user's latest actions across all applications, providing quick context and easy resumption of work.

**Why this priority**: A recent activity feed helps users quickly return to their workflow by showing recent tasks, transactions, or activities without navigating through applications.

**Independent Test**: Can be fully tested by performing various actions across applications (create task, complete task, future: add transaction), returning to hub, and verifying activity feed displays chronologically.

**Acceptance Scenarios**:

1. **Given** a user views the hub dashboard, **When** the recent activity section loads, **Then** they see their last 10 actions across all applications in reverse chronological order
2. **Given** an activity item in the feed, **When** rendered, **Then** it displays: action icon, action description, timestamp (relative: "2 minutes ago", "Yesterday"), source application badge
3. **Given** a user clicks on an activity item, **When** activated, **Then** they navigate to that specific item in the source application (e.g., clicking "Completed 'Bug fix task'" opens that task)
4. **Given** the activity feed with no recent actions, **When** a new user views it, **Then** they see an empty state message: "Your recent activity will appear here" with a motivational icon
5. **Given** activity items from different applications, **When** displayed, **Then** each has a colour-coded left border matching the application's primary colour (To Do: green, Finance: blue)
6. **Given** the activity feed on mobile, **When** rendered, **Then** it shows the most recent 5 items with a "View All Activity" link to a dedicated activity history page

---

### User Story 6.6 - Personalized Welcome Experience (Priority: P3)

The hub dashboard greets users with personalized messages based on time of day, achievements, and usage patterns, creating a welcoming and engaging experience.

**Why this priority**: Personalization increases user engagement and makes the application feel more human and responsive to individual user behavior.

**Independent Test**: Can be fully tested by logging in at different times of day, completing achievements, and verifying contextual messages display appropriately.

**Acceptance Scenarios**:

1. **Given** a user logs in between 5:00-11:59, **When** the hub loads, **Then** they see "Good morning, [Username]" in the welcome header
2. **Given** a user logs in between 12:00-17:59, **When** the hub loads, **Then** they see "Good afternoon, [Username]" in the welcome header
3. **Given** a user logs in between 18:00-04:59, **When** the hub loads, **Then** they see "Good evening, [Username]" in the welcome header
4. **Given** a user completes a notable achievement (e.g., 100 tasks completed), **When** they return to the hub, **Then** a celebration message displays: "🎉 Congratulations! You've completed 100 tasks!"
5. **Given** a user hasn't logged in for 7+ days, **When** they return, **Then** the hub displays: "Welcome back, [Username]! You've been away for [X] days. Here's what you missed:" with summary stats
6. **Given** a user on their first login, **When** they land on the hub, **Then** they see an onboarding card: "Welcome to Finance Manager! Let's get you started" with quick setup links
7. **Given** a user during their birthday (if profile date set), **When** they log in, **Then** the hub displays a birthday message with a special icon/animation

---

### User Story 6.7 - Application Health & Status Indicators (Priority: P3)

The hub dashboard displays real-time health status for each application, informing users of maintenance windows, incidents, or degraded performance.

**Why this priority**: Transparency about system health builds trust and prevents user frustration when issues occur. Users know immediately if problems are on their end or system-wide.

**Independent Test**: Can be fully tested by simulating maintenance mode, verifying status badges display correctly, and confirming users can access status details.

**Acceptance Scenarios**:

1. **Given** all applications are operating normally, **When** the hub loads, **Then** each application tile shows a small green "Operational" status dot (bottom-right corner)
2. **Given** an application is under scheduled maintenance, **When** the hub loads, **Then** that tile shows an amber "Maintenance" badge and displays estimated completion time on hover
3. **Given** an application is experiencing issues, **When** the hub loads, **Then** that tile shows a red "Degraded" badge and the tile is semi-transparent with click disabled
4. **Given** a user clicks on a status indicator, **When** activated, **Then** a modal displays detailed status information: current state, incident description (if any), estimated resolution
5. **Given** the hub during a system-wide maintenance window, **When** loaded, **Then** a prominent banner displays: "Scheduled Maintenance: Some features may be unavailable. Estimated completion: [time]"
6. **Given** status information updates, **When** conditions change, **Then** the hub checks for status updates every 60 seconds and updates badges without full page refresh

---

### User Story 6.8 - Favourites & Customization (Priority: P4)

Users can mark applications as favourites, reorder tiles, and customize their hub layout, creating a personalized workspace that matches their workflow.

**Why this priority**: Customization empowers users to optimize their workflow, especially as more applications are added. Power users benefit from quick access to frequently used tools.

**Independent Test**: Can be fully tested by marking apps as favourites, reordering tiles via drag-and-drop, and verifying preferences persist across sessions.

**Acceptance Scenarios**:

1. **Given** a user hovers over an application tile, **When** they click the star icon (top-right), **Then** the application is marked as favourite and moves to the top of the grid
2. **Given** a user has marked favourites, **When** they view the hub, **Then** favourite tiles appear first (regardless of original order) with a gold star icon
3. **Given** a user viewing the hub, **When** they click "Customize Layout" button, **Then** tiles enter drag-and-drop mode with visual handles and drop zones
4. **Given** a user in customize mode, **When** they drag a tile to a new position, **Then** other tiles adjust position with smooth animation, and the layout saves automatically
5. **Given** a user's customized layout, **When** they log in from a different device, **Then** their hub displays the same custom layout (stored in user preferences on backend)
6. **Given** a user clicks "Reset Layout", **When** confirmed, **Then** the hub returns to default layout: alphabetical order, no favourites, all tiles visible
7. **Given** a user with many applications, **When** they view the hub, **Then** a "Show More/Show Less" toggle controls whether all tiles display or just favourites (if more than 6 apps exist)

---

### User Story 6.9 - Profile Image Management (Priority: P2)

Users need the ability to upload, update, and remove profile images that display as avatars throughout the application, providing personalization and visual identity.

**Why this priority**: Avatar/profile images enhance user identity and make the interface more personal. This feature is essential since the info bar displays user avatars, requiring backend support for image storage and management.

**Independent Test**: Can be fully tested by uploading various image formats and sizes, viewing avatar in info bar, changing profile image, and verifying old images are cleaned up properly.

**Acceptance Scenarios**:

1. **Given** a user accesses their profile settings, **When** they view the profile image section, **Then** they see their current avatar (or initials fallback) with an "Upload New Image" button
2. **Given** a user clicks "Upload New Image", **When** the file picker opens, **Then** they can only select image files: JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp), max 5MB file size
3. **Given** a user selects a valid image file, **When** they confirm the upload, **Then** the image is validated (type, size, dimensions), uploaded to server, processed, and set as their new avatar
4. **Given** a user uploads an image larger than 512x512px, **When** processed, **Then** the server automatically resizes it to 512x512px (preserving aspect ratio) and generates thumbnails: 128x128px, 64x64px, 32x32px
5. **Given** a user's avatar displays in the info bar, **When** rendered, **Then** it uses the 64x64px thumbnail for optimal performance with lazy loading
6. **Given** a user uploads a non-square image, **When** processed, **Then** the server crops to square (centre-focused) before resizing to ensure circular avatar display works correctly
7. **Given** a user wants to remove their profile image, **When** they click "Remove Image", **Then** the avatar reverts to initials fallback and the image files are deleted from storage
8. **Given** a user uploads a new image, **When** the old image exists, **Then** the old image files are automatically deleted from storage (cleanup) after successful upload
9. **Given** a user uploads an invalid file, **When** validation fails, **Then** they see clear error messages: "File type not supported" (for non-images), "File too large (max 5MB)" (for oversized files), "Image dimensions too small (min 100x100px)"
10. **Given** a user's avatar throughout the application, **When** displayed in different contexts (info bar, profile page, admin panel), **Then** it consistently shows the same image with appropriate size variant (32px, 64px, or 128px)

---

### Technical Requirements for Phase 6

**Routing & Architecture Changes**:
- Current `/dashboard` route becomes `/todo` (To Do app main view)
- New `/` or `/hub` route becomes the main application hub landing page
- Update all navigation links to point to `/hub` as home
- Implement nested routing: `/todo/*` (tasks, progress, groups, etc.), `/finance/*` (future), `/admin/*` (Phase 5)
- Update authentication redirect: successful login lands on `/hub` instead of `/dashboard`
- To Do app subroutes: `/todo` (main tasks view), `/todo/progress` (weekly progress), `/todo/groups` (task groups management)

**Backend API Additions**:
```typescript
// New endpoints for hub functionality
GET /api/v1/hub/stats - Aggregated quick stats across all apps
GET /api/v1/hub/activity - Recent activity feed (paginated)
GET /api/v1/hub/status - Application health status
GET /api/v1/user/preferences - User hub preferences (favourites, layout)
PUT /api/v1/user/preferences - Update hub preferences
GET /api/v1/applications - List of available applications (with permissions check)

// Profile image management endpoints
POST /api/v1/user/profile/avatar - Upload new profile image (multipart/form-data)
DELETE /api/v1/user/profile/avatar - Remove profile image
GET /api/v1/user/profile/avatar/:size - Get avatar by size (32, 64, 128, 512)
GET /api/v1/user/:userId/avatar/:size - Public endpoint for viewing other users' avatars
```

**Frontend Components**:
```
apps/web/src/
  pages/
    HubDashboard.tsx (new main hub)
    ProfilePage.tsx (enhanced with avatar upload)
    todo/
      TodoPage.tsx (main To Do app view, renamed from Dashboard.tsx)
      TaskListPage.tsx
      WeeklyProgressPage.tsx
      TaskGroupsPage.tsx
      ... (all existing To Do pages move here)
  components/
    hub/
      ApplicationTile.tsx
      InfoBar.tsx
      QuickStatsWidget.tsx
      ActivityFeedItem.tsx
      StatusBadge.tsx
      WelcomeMessage.tsx
      CustomizeLayoutModal.tsx
    profile/
      AvatarUpload.tsx
      AvatarPreview.tsx
      ImageCropper.tsx (optional: for client-side cropping)
    common/
      Avatar.tsx (reusable avatar component with initials fallback)
```

**Database Schema Additions**:
```sql
-- User hub preferences
CREATE TABLE user_hub_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  favourite_apps TEXT[], -- Array of application IDs
  tile_order JSONB, -- Custom tile ordering
  show_activity_feed BOOLEAN DEFAULT TRUE,
  show_quick_stats BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log for recent actions across apps
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- 'task_created', 'task_completed', 'transaction_added', etc.
  action_description TEXT NOT NULL, -- Human-readable description
  entity_type VARCHAR(50), -- 'task', 'transaction', 'goal'
  entity_id UUID, -- ID of the affected entity
  application VARCHAR(50) NOT NULL, -- 'todo', 'finance', 'admin'
  metadata JSONB, -- Additional context (task priority, amount, etc.)
  timestamp TIMESTAMP DEFAULT NOW()
);

-- System status tracking
CREATE TABLE application_status (
  application VARCHAR(50) PRIMARY KEY, -- 'todo', 'finance', 'admin'
  status VARCHAR(20) NOT NULL DEFAULT 'operational', -- 'operational', 'maintenance', 'degraded', 'down'
  message TEXT, -- Status message for users
  updated_at TIMESTAMP DEFAULT NOW(),
  maintenance_until TIMESTAMP -- Estimated completion for maintenance
);

-- Available applications registry
CREATE TABLE applications (
  id VARCHAR(50) PRIMARY KEY, -- 'todo', 'finance', 'admin', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_path VARCHAR(255), -- Path to icon asset
  route_path VARCHAR(100) NOT NULL, -- '/todo', '/finance'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'coming_soon', 'restricted'
  required_role VARCHAR(50), -- NULL = public, 'admin' = admins only
  sort_order INTEGER DEFAULT 0,
  estimated_release DATE, -- For 'coming_soon' apps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profile images storage
CREATE TABLE user_profile_images (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  file_extension VARCHAR(10) NOT NULL, -- 'jpg', 'png', 'webp'
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL, -- 'image/jpeg', 'image/png', 'image/webp'
  storage_path VARCHAR(500) NOT NULL, -- Path to original image file
  thumbnail_512_path VARCHAR(500), -- 512x512 version (original processed)
  thumbnail_128_path VARCHAR(500), -- 128x128 version (profile page)
  thumbnail_64_path VARCHAR(500), -- 64x64 version (info bar, navigation)
  thumbnail_32_path VARCHAR(500), -- 32x32 version (mentions, small icons)
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_activity_log_user_timestamp ON user_activity_log(user_id, timestamp DESC);
CREATE INDEX idx_activity_log_app ON user_activity_log(application);
CREATE INDEX idx_applications_status ON applications(status) WHERE status = 'active';
CREATE INDEX idx_profile_images_updated ON user_profile_images(updated_at DESC);
```

**File Storage Configuration**:
```typescript
// Image storage options (choose one based on infrastructure)

// Option 1: Local filesystem (development/small deployments)
const storageConfig = {
  type: 'local',
  basePath: '/var/www/finance-manager/uploads/avatars',
  publicUrl: 'https://your-domain.com/uploads/avatars',
  maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
};

// Option 2: Cloud storage (production recommended)
const storageConfig = {
  type: 'cloud', // AWS S3, Azure Blob, Google Cloud Storage
  bucket: 'finance-manager-avatars',
  region: 'us-east-1',
  cdnUrl: 'https://cdn.your-domain.com/avatars',
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  publicRead: true, // Images are publicly accessible via CDN
  encryption: true // Server-side encryption for stored files
};

// Image processing configuration
const imageProcessing = {
  quality: 85, // JPEG/WebP quality (0-100)
  format: 'webp', // Convert all uploads to WebP for optimal size
  sizes: {
    original: 512, // Max dimension for original
    large: 128,
    medium: 64,
    small: 32
  },
  cropStrategy: 'centre', // 'centre', 'smart' (face detection), 'entropy'
  maintainAspectRatio: false, // Force square crops for circular avatars
  stripMetadata: true // Remove EXIF data for privacy/size
};
```

**Backend Implementation Details**:

```csharp
// apps/finance-api/Features/User/Services/ImageProcessingService.cs
public class ImageProcessingService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ImageProcessingService> _logger;
    
    public async Task<ProfileImageResult> ProcessAndStoreAvatar(
        IFormFile file, 
        string userId)
    {
        // 1. Validate file
        ValidateImageFile(file);
        
        // 2. Load image with ImageSharp/SkiaSharp
        using var image = await Image.LoadAsync(file.OpenReadStream());
        
        // 3. Crop to square (centre-focused)
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(512, 512),
            Mode = ResizeMode.Crop,
            Position = AnchorPositionMode.Center
        }));
        
        // 4. Generate thumbnails (512, 128, 64, 32)
        var thumbnails = await GenerateThumbnails(image, userId);
        
        // 5. Upload to storage (local or cloud)
        var storagePaths = await UploadToStorage(thumbnails, userId);
        
        // 6. Save to database
        await SaveProfileImageRecord(userId, storagePaths, file);
        
        // 7. Delete old images (cleanup)
        await DeleteOldAvatarFiles(userId);
        
        return new ProfileImageResult
        {
            Success = true,
            AvatarUrl = storagePaths.Thumbnail64Path
        };
    }
    
    private void ValidateImageFile(IFormFile file)
    {
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        var maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.Contains(file.ContentType))
            throw new ValidationException("Invalid file type. Only JPEG, PNG, and WebP allowed.");
            
        if (file.Length > maxSize)
            throw new ValidationException("File too large. Maximum size is 5MB.");
            
        if (file.Length == 0)
            throw new ValidationException("File is empty.");
            
        // Verify actual image content (not just extension)
        using var image = Image.Identify(file.OpenReadStream());
        if (image == null)
            throw new ValidationException("Invalid image file.");
            
        if (image.Width < 100 || image.Height < 100)
            throw new ValidationException("Image too small. Minimum dimensions: 100x100px.");
    }
}

// apps/finance-api/Features/User/Controllers/ProfileController.cs
[ApiController]
[Route("api/v1/user/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    [HttpPost("avatar")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5MB limit
    [RequestFormLimits(MultipartBodyLengthLimit = 5 * 1024 * 1024)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _imageProcessingService.ProcessAndStoreAvatar(file, userId);
            
            return Ok(new { 
                success = true, 
                avatarUrl = result.AvatarUrl,
                message = "Profile image updated successfully" 
            });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload avatar for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to upload image" });
        }
    }
    
    [HttpDelete("avatar")]
    public async Task<IActionResult> RemoveAvatar()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await _imageProcessingService.DeleteAvatar(userId);
        return Ok(new { success = true, message = "Profile image removed" });
    }
    
    [HttpGet("avatar/{size}")]
    public async Task<IActionResult> GetAvatar(int size)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var avatarPath = await _profileService.GetAvatarPath(userId, size);
        
        if (avatarPath == null)
            return NotFound();
            
        var fileStream = await _storageService.GetFileStream(avatarPath);
        return File(fileStream, "image/webp");
    }
    
    // Public endpoint for viewing other users' avatars (for future features)
    [HttpGet("../user/{userId}/avatar/{size}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserAvatar(string userId, int size)
    {
        var avatarPath = await _profileService.GetAvatarPath(userId, size);
        
        if (avatarPath == null)
            return NotFound();
            
        var fileStream = await _storageService.GetFileStream(avatarPath);
        return File(fileStream, "image/webp", enableRangeProcessing: true);
    }
}
```

**Frontend Implementation**:

```typescript
// apps/web/src/components/profile/AvatarUpload.tsx
export const AvatarUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Invalid file type. Please upload JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File too large. Maximum size is 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/user/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('success', 'Profile image updated successfully');
      await refreshUser(); // Refresh user data to get new avatar URL
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      showToast('error', message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile image?')) return;

    try {
      await apiClient.delete('/user/profile/avatar');
      showToast('success', 'Profile image removed');
      setPreview(null);
      await refreshUser();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove image';
      showToast('error', message);
    }
  };

  return (
    <AvatarSection>
      <Label>Profile Image</Label>
      <AvatarContainer>
        <Avatar 
          src={preview || user?.avatarUrl} 
          alt={user?.username}
          size={128}
          fallback={user?.username?.[0]?.toUpperCase()}
        />
        <AvatarActions>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="outline"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload New Image'}
          </Button>
          {user?.avatarUrl && (
            <Button
              variant="outline"
              size="small"
              onClick={handleRemoveAvatar}
              disabled={uploading}
            >
              Remove Image
            </Button>
          )}
        </AvatarActions>
      </AvatarContainer>
      <HelpText>
        Accepted formats: JPEG, PNG, WebP • Maximum size: 5MB • Recommended: Square images, at least 200x200px
      </HelpText>
    </AvatarSection>
  );
};

// apps/web/src/components/common/Avatar.tsx
interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number; // 32, 64, 128
  fallback?: string; // Initials
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  size = 64, 
  fallback,
  className 
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = fallback || alt?.[0]?.toUpperCase() || '?';

  if (!src || imageError) {
    return (
      <AvatarFallback size={size} className={className}>
        {initials}
      </AvatarFallback>
    );
  }

  return (
    <AvatarImage
      src={`${src}?size=${size}`} // Request appropriate size
      alt={alt || 'User avatar'}
      size={size}
      loading="lazy"
      onError={() => setImageError(true)}
      className={className}
    />
  );
};

const AvatarImage = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  object-fit: cover;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const AvatarFallback = styled.div<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: ${({ size }) => size * 0.4}px;
  text-transform: uppercase;
`;
```

**Database Migration**:
```sql
-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN avatar_updated_at TIMESTAMP;

-- Create profile images table (see schema above)
CREATE TABLE user_profile_images (...);
```

**Security & Best Practices for Avatar Management**:

1. **File Validation**:
   - Verify MIME type AND actual file content (prevent malicious files with fake extensions)
   - Check magic bytes/file signatures (JPEG: FF D8 FF, PNG: 89 50 4E 47)
   - Reject files with embedded scripts or malicious payloads
   - Strip all EXIF metadata to remove GPS, camera info, personal data

2. **Rate Limiting**:
   - Maximum 5 avatar uploads per user per hour (prevent abuse)
   - Temporary lockout after 10 failed upload attempts
   - Monitor for patterns indicating automated attacks

3. **Storage Security**:
   - Store avatars outside webroot if using local filesystem
   - Use unpredictable filenames: `{userId}_{timestamp}_{random}.webp`
   - Set appropriate file permissions (read-only for web server)
   - Implement Content-Security-Policy headers for image serving
   - Add `X-Content-Type-Options: nosniff` header

4. **Access Control**:
   - Authenticated users can only upload/delete their own avatars
   - Public avatar viewing uses read-only endpoints
   - CDN/storage URLs should not expose user IDs directly
   - Implement signed URLs for temporary access (if using cloud storage)

5. **Resource Management**:
   - Automatic cleanup of old avatar files when new ones uploaded
   - Scheduled job to remove orphaned avatar files (user deleted but files remain)
   - Monitor storage usage per user (alert if excessive)
   - Implement storage quotas if needed

6. **Privacy Considerations**:
   - Users can opt to hide avatar from other users (future feature)
   - Don't log avatar URLs in application logs (PII concern)
   - Include avatar data in GDPR data export
   - Permanently delete avatars when user account deleted

7. **Performance Optimization**:
   - Serve avatars via CDN with aggressive caching (Cache-Control: public, max-age=86400)
   - Use WebP format for optimal compression (80-85% quality)
   - Implement lazy loading for avatar images
   - Return appropriate thumbnail size based on request parameter
   - Consider image sprite sheets for common UI avatars (future optimization)

8. **Error Handling**:
   - Graceful fallback to initials if avatar fails to load
   - Log upload failures for monitoring (without exposing user data)
   - Return user-friendly error messages (not technical details)
   - Handle partial upload failures (cleanup temporary files)

**Required NuGet Packages** (.NET API):
```xml
<PackageReference Include="SixLabors.ImageSharp" Version="3.x" />
<PackageReference Include="SixLabors.ImageSharp.Web" Version="3.x" />
<PackageReference Include="Azure.Storage.Blobs" Version="12.x" /> <!-- If using Azure -->
<PackageReference Include="AWSSDK.S3" Version="3.x" /> <!-- If using AWS -->
```

**Required npm Packages** (Frontend):
```json
{
  "dependencies": {
    "browser-image-compression": "^2.0.2",
    "react-dropzone": "^14.2.3"
  }
}
```

**Design System Additions** (to be documented in Phase 7 - Design Guidelines):
```typescript
// Application colour palette
const appColors = {
  todo: {
    primary: '#4CAF50',
    secondary: '#81C784',
    accent: '#2E7D32'
  },
  finance: {
    primary: '#2196F3',
    secondary: '#64B5F6',
    accent: '#1565C0'
  },
  admin: {
    primary: '#FF9800',
    secondary: '#FFB74D',
    accent: '#E65100'
  }
};

// Application tile component styling
const ApplicationTile = styled(Card)`
  position: relative;
  padding: 24px;
  min-height: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not([disabled]) {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  &[disabled] {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

// Info bar styling
const InfoBar = styled.div`
  height: 64px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
`;
```

**Icon Design Requirements** (flat style):
- **To Do Manager**: Checkmark circle with tick (solid green)
- **Finance Manager**: Pie chart or coins icon (solid blue)
- **Admin Panel**: Settings gear icon (solid orange)
- **Future Apps**: Placeholder icon template (outline style with question mark)
- All icons: 64x64px, SVG format, 2-colour maximum, geometric shapes, no gradients
- Icon library: Lucide React (already in use) for consistency

**State Management**:
```typescript
// Hub context for global hub state
interface HubContextType {
  applications: Application[];
  quickStats: QuickStats;
  recentActivity: ActivityItem[];
  userPreferences: HubPreferences;
  systemStatus: ApplicationStatus[];
  updatePreferences: (prefs: Partial<HubPreferences>) => Promise<void>;
  refreshStats: () => Promise<void>;
}
```

**Accessibility Requirements**:
- All application tiles keyboard navigable (Tab, Enter, Space)
- Screen reader announces: "Launch [App Name], [Status], [Description]"
- Info bar time updates announced via ARIA live region (polite)
- Activity feed items have proper semantic HTML (list items)
- Colour is not the only indicator of status (text + icons required)
- Focus management when navigating between hub and applications
- Customize mode announces drag-and-drop state changes

**Performance Considerations**:
- Activity feed lazy-loaded (initial 10 items, load more on scroll)
- Quick stats cached with 60-second TTL
- Application status checked every 60 seconds (not per render)
- Hub preferences cached in context (avoid repeated API calls)
- Application tiles use CSS Grid for optimal layout performance
- Icons lazy-loaded with React.lazy + Suspense
- Time display uses requestAnimationFrame for smooth updates

**Mobile Responsiveness**:
- Info bar collapses to hamburger menu below 768px
- Application tiles stack vertically (full width) below 640px
- Quick stats widget becomes scrollable carousel on mobile
- Activity feed shows 3 items initially on mobile with "View More" button
- Customize layout mode disabled on mobile (predefined responsive layout)

---

### Implementation Priorities for Phase 6

**Critical Path (Must Have)**:
1. User Story 6.1 - Unified portal structure (architectural foundation)
2. User Story 6.2 - Info bar (navigation & user orientation)
3. User Story 6.4 - Design system (consistent visual language)

**High Value (Should Have)**:
4. User Story 6.3 - Quick stats widget (immediate user value)
5. User Story 6.5 - Activity feed (workflow continuity)

**Nice to Have (Could Have)**:
6. User Story 6.6 - Personalized welcome (engagement boost)
7. User Story 6.7 - Health indicators (transparency)
8. User Story 6.8 - Favourites & customization (power users)

**Testing Requirements**:
- E2E tests for hub navigation to all applications
- Visual regression tests for application tiles and layouts
- Accessibility testing for keyboard navigation and screen readers
- Responsive design testing across mobile, tablet, desktop
- Performance testing for activity feed with 1000+ items
- Unit tests for layout customization logic

**Estimated Effort**: 3-4 weeks (full-time developer)
- Week 1: Routing restructure + hub page layout + info bar
- Week 2: Application tiles + design system + status indicators
- Week 3: Quick stats + activity feed + backend endpoints
- Week 4: Personalization + customization + polish + testing

---

## Phase 7 - Design Guidelines & Standards

### User Story 7.1 - Comprehensive Design System Documentation (Priority: P1)

The project requires formal design guidelines documenting the established visual language, component patterns, and design principles to ensure consistency as the platform scales.

**Why this priority**: Without documented guidelines, design consistency degrades over time as new features are added. Formal documentation enables multiple developers to contribute while maintaining visual coherence.

**Independent Test**: Can be fully tested by having a new developer implement a feature using only the design guidelines and verifying the result matches existing component styling.

**Acceptance Scenarios**:

1. **Given** a developer needs to create a new component, **When** they reference the design guidelines, **Then** they find documented specifications for: colour palette, typography scale, spacing system, component patterns
2. **Given** the design guidelines document, **When** accessed, **Then** it includes live examples of all UI components with code snippets showing proper usage
3. **Given** a designer creating mockups, **When** they reference the guidelines, **Then** they find Figma/design tool specifications matching the implemented component library
4. **Given** the colour system, **When** documented, **Then** it specifies: primary, secondary, accent colours, semantic colours (success, error, warning, info), text hierarchy colours, background colours
5. **Given** the typography system, **When** documented, **Then** it specifies: font families, font sizes (Heading1-6, Text, TextSmall, TextSecondary), font weights, line heights, letter spacing
6. **Given** the spacing system, **When** documented, **Then** it defines a scale (4px base unit): 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px with usage guidelines
7. **Given** component documentation, **When** viewing a component guide, **Then** each component includes: visual example, props API, accessibility notes, usage do's and don'ts

---

### Technical Requirements for Phase 7

**Documentation Structure**:
```
docs/
  design-system/
    README.md (overview + quick start)
    colour-palette.md
    typography.md
    spacing-layout.md
    iconography.md
    components/
      buttons.md
      cards.md
      forms.md
      navigation.md
      data-display.md
    patterns/
      authentication-flows.md
      data-loading-states.md
      error-handling.md
      responsive-design.md
    accessibility.md
    animation-motion.md
```

**Design Tokens** (to be formalized):
```typescript
// apps/web/src/styles/tokens.ts
export const designTokens = {
  colors: {
    // Primary palette
    primary: {
      50: '#E8F5E9',
      100: '#C8E6C9',
      500: '#4CAF50', // Main brand colour
      600: '#43A047',
      700: '#388E3C',
      900: '#1B5E20'
    },
    // Semantic colours
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    
    // Neutral palette
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      500: '#9E9E9E',
      700: '#616161',
      900: '#212121'
    },
    
    // Application-specific colours
    todo: '#4CAF50',
    finance: '#2196F3',
    admin: '#FF9800'
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Fira Code", "Courier New", monospace'
    },
    fontSize: {
      h1: '32px',
      h2: '24px',
      h3: '20px',
      h4: '18px',
      h5: '16px',
      h6: '14px',
      body: '14px',
      small: '12px',
      tiny: '10px'
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px'
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.15)'
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};
```

**Icon Guidelines**:
- **Style**: Flat design with solid fills (no outlines unless specifically needed)
- **Size**: 24px default, 16px small, 32px large, 48px+ extra large
- **Colour**: Single colour (inherit from parent or theme primary)
- **Library**: Lucide React (primary), custom SVG for brand icons
- **Custom Icon Requirements**:
  - Square viewBox (0 0 24 24)
  - 2px stroke width maximum
  - No gradients or complex effects
  - Optimize with SVGO before committing

**Component Patterns**:
1. **Loading States**: Skeleton screens (no spinners) with subtle pulse animation
2. **Empty States**: Icon + message + CTA button, centred layout
3. **Error States**: Red accent, error icon, clear message, retry button
4. **Success Feedback**: Green checkmark, toast notification (4-second duration)
5. **Form Validation**: Inline errors below field, red border, error icon
6. **Modal Patterns**: Backdrop blur, centred card, close button top-right
7. **Card Hover**: Subtle lift (4px translateY), shadow increase, 300ms transition

**Accessibility Standards**:
- WCAG 2.1 AA compliance minimum
- 4.5:1 contrast ratio for normal text
- 3:1 contrast ratio for large text (18pt+)
- All interactive elements 44x44px minimum touch target
- Focus indicators visible on all focusable elements
- Semantic HTML (headings hierarchy, landmarks, lists)
- ARIA labels for icon-only buttons
- Form labels always visible (no placeholder-only labels)

**Responsive Breakpoints**:
```typescript
export const breakpoints = {
  mobile: '0px',      // 0-639px
  tablet: '640px',    // 640-1023px
  desktop: '1024px',  // 1024-1439px
  wide: '1440px'      // 1440px+
};
```

**Animation Guidelines**:
- Subtle animations only (avoid distraction)
- Respect `prefers-reduced-motion` media query
- Use CSS transitions for simple state changes
- Use Framer Motion for complex animations
- Duration: 150ms for micro-interactions, 300ms for transitions, 500ms max
- Easing: `ease-out` for entrances, `ease-in` for exits

**File Organization Standards**:
```
apps/web/src/
  components/
    ui/           # Atomic design system components
    feature/      # Feature-specific components
    layouts/      # Page layout components
  styles/
    tokens.ts     # Design tokens
    theme.ts      # Styled-components theme
    global.ts     # Global styles
  assets/
    icons/        # Custom SVG icons
    images/       # Static images
```

**Implementation Requirements**:
- Create Storybook for component documentation (optional but recommended)
- Generate design tokens JSON for design tools (Figma, Sketch)
- Automated visual regression testing with Percy or Chromatic
- Lint rules enforce design token usage (no hardcoded colours)
- Pre-commit hook validates SVG optimization

**Estimated Effort**: 1-2 weeks
- Week 1: Document existing patterns + create design tokens + write guidelines
- Week 2: Create examples + setup tooling (Storybook, linting) + team review

---

## Phase 5 - Collaboration & Advanced Features

### User Story 5.1 - Task Relationships & Linking (Priority: P2)

Users need the ability to link related tasks and events together with clear relationship types, enabling them to understand dependencies, track related work, and navigate complex projects with interconnected items.

**Why this priority**: As users manage more complex workflows, they need to express relationships between tasks (e.g., "Task B blocks Task A", "Event X relates to Task Y"). This builds on the existing task and event systems to add semantic connections.

**Independent Test**: Can be fully tested by creating multiple tasks and events, establishing various link types between them, viewing linked items from each item's detail view, and verifying that links are bidirectional and correctly typed.

**Acceptance Scenarios**:

1. **Given** a user viewing a task or event, **When** they choose to add a link, **Then** they can search for other tasks/events and select a relationship type (blocks, blocked-by, relates-to, duplicates, parent-of, child-of)
2. **Given** a user creates a link between items, **When** the link is saved, **Then** both items display the relationship with appropriate visual indicators and the linked item's key details
3. **Given** a task with blocking dependencies, **When** the user views the task, **Then** they see a clear warning if blocked tasks are incomplete and can navigate directly to blocking tasks
4. **Given** linked items, **When** a user clicks on a linked item reference, **Then** they navigate to that item's detail view with context about the originating link
5. **Given** a user deletes a task or event, **When** the deletion is confirmed, **Then** all links involving that item are automatically removed and linked items are updated
6. **Given** tasks and events linked together, **When** a user views the link section, **Then** items are clearly distinguished with icons/labels showing which are tasks vs events
7. **Given** a user has edit permissions, **When** they view a link, **Then** they can modify the relationship type or remove the link entirely

**User-Friendly ID System**:
- Each task/event receives a readable ID (e.g., `TASK-1234`, `EVENT-5678`)
- IDs are sequential within each type and never reused
- IDs are displayed prominently in UI (task card header, breadcrumbs, URL)
- IDs can be used in quick search and linking dialogs
- IDs are included in exports and integrations

**Link Type Definitions**:
- **blocks/blocked-by**: Task A must complete before Task B can start
- **relates-to**: General association without dependency
- **duplicates**: Items represent the same work (suggest merging)
- **parent-of/child-of**: Hierarchical subtask relationship
- **event-task**: Event is scheduled time for task completion

**Visual Indicators**:
- Warning badge on tasks blocked by incomplete dependencies
- Relationship icon next to each linked item (chain, hierarchy, calendar)
- Count of linked items on task cards
- Network graph view for complex link structures (optional advanced feature)

**Additional Suggested Functionality**:
- **Link validation**: Prevent circular dependencies (A blocks B blocks A)
- **Bulk linking**: Select multiple items and link them all to a parent
- **Link templates**: Quick-create common link patterns (sprint planning, project hierarchy)
- **Link notifications**: Notify when a blocking task is completed
- **Link history**: Audit trail of link creation/modification/deletion
- **Smart suggestions**: AI/heuristic suggestions for potential links based on similar titles, dates, or tags

**Technical Considerations**:
- Database schema: `TaskLinks` table with `sourceId`, `targetId`, `linkType`, `createdAt`, `createdBy`
- Bidirectional queries: Efficient lookup of all links for a given item
- Cascade deletion: Automatic cleanup when items are deleted
- Link integrity: Ensure both endpoints exist before creating link
- Performance: Index on source/target IDs for fast relationship queries

**Estimated Effort**: 2-3 weeks
- Week 1: ID system + database schema + backend API endpoints
- Week 2: Frontend link creation UI + link display components
- Week 3: Validation + notifications + testing + polish

---

### User Story 5.2 - Comments & Annotations (Priority: P2)

Users need the ability to add timestamped comments to tasks and events, enabling communication, context capture, decision documentation, and progress notes without cluttering the main task description.

**Why this priority**: As tasks evolve, users need to document updates, decisions, questions, and discussions. Comments provide a chronological record separate from the task description, supporting both individual note-taking and future team collaboration.

**Independent Test**: Can be fully tested by creating tasks/events, adding multiple comments with different importance levels, editing/deleting comments, and verifying proper timestamp display and sorting.

**Acceptance Scenarios**:

1. **Given** a user viewing a task or event, **When** they open the comments section, **Then** they see all existing comments in chronological order with author, timestamp, and content
2. **Given** a user adding a comment, **When** they type their message and submit, **Then** the comment is immediately visible with current timestamp and user information
3. **Given** a user creating a comment, **When** they mark it as important, **Then** the comment is visually distinguished (highlighted background, flag icon) and appears in important comment filters
4. **Given** a user viewing their own comment, **When** they choose to edit it, **Then** they can modify the content and the comment shows an "edited" indicator with edit timestamp
5. **Given** a user viewing their own comment, **When** they choose to delete it, **Then** they receive confirmation and the comment is permanently removed
6. **Given** a task with multiple comments, **When** a user filters by "important only", **Then** only flagged comments are displayed
7. **Given** a task with many comments, **When** a user views the task card, **Then** they see a comment count badge and can quickly jump to the comments section
8. **Given** a comment with a long timestamp, **When** displayed in the UI, **Then** relative timestamps are shown ("2 hours ago", "yesterday") with full date on hover

**Comment Features**:
- **Rich text support**: Bold, italic, bullet lists, basic Markdown formatting
- **Importance flag**: Visual indicator + filter for critical comments
- **Edit history**: Track when comments were modified (optional)
- **Mention support**: @username to reference other users (future team feature)
- **Attachment support**: Link to external resources or upload small files (future enhancement)
- **Comment pinning**: Pin important comments to top of list (optional)
- **Comment reactions**: Simple emoji reactions (optional, for team environments)

**Display Specifications**:
- **Timestamp format**: "2 hours ago" < 24h, "Yesterday at 3:45 PM" < 7 days, "Jan 15, 2026 at 3:45 PM" beyond
- **Important comment styling**: Light yellow/amber background, flag icon, bold border
- **Author display**: Username or "You" for current user's comments
- **Edit indicator**: Small "edited" text with edit timestamp in tooltip
- **Comment actions**: Edit/Delete icons only visible on hover for own comments
- **Loading states**: Skeleton comments while fetching, optimistic UI for new comments

**Additional Suggested Functionality**:
- **Comment search**: Full-text search across all comments within a task/event
- **Comment export**: Include comments in task exports (PDF, CSV)
- **Comment notifications**: Notify when someone adds a comment (team collaboration)
- **Comment templates**: Quick-insert common update patterns ("Status update", "Blocker identified")
- **Comment threading**: Replies to specific comments for discussions (team feature)
- **Comment drafts**: Auto-save comment input to prevent data loss

**Technical Considerations**:
- Database schema: `Comments` table with `taskId`, `eventId`, `userId`, `content`, `isImportant`, `createdAt`, `updatedAt`
- Soft delete: Mark deleted comments as hidden rather than removing from DB (audit trail)
- Pagination: Load comments in batches for tasks with many comments (20 per page)
- Real-time updates: WebSocket support for live comment updates (team collaboration)
- Content sanitization: XSS protection for rich text content
- Performance: Index on taskId/eventId for efficient comment queries

**Estimated Effort**: 2-3 weeks
- Week 1: Database schema + backend API (CRUD endpoints) + comment model
- Week 2: Frontend comment UI + rich text editor + importance flagging
- Week 3: Edit/delete functionality + filtering + testing + polish

---

### User Story 5.3 - Production Deployment & Security Audit (Priority: P1)

The application needs to be production-ready with comprehensive security hardening, deployment infrastructure, and accessibility over local network and internet, enabling real-world usage in a secure and reliable manner.

**Why this priority**: Before users can rely on the application for daily use, it must be properly deployed with security best practices, reliable infrastructure, and appropriate access controls. This is essential for data protection and user trust.

**Independent Test**: Can be fully tested by deploying to production environment, accessing over local network and internet, running security scans, verifying SSL/TLS certificates, testing backup/restore procedures, and confirming all security controls are active.

**Acceptance Scenarios**:

1. **Given** the application is deployed, **When** accessed via HTTPS, **Then** SSL/TLS certificates are valid, TLS 1.2+ is enforced, and browser security indicators show secure connection
2. **Given** the application is running in production, **When** accessed from local network, **Then** internal users can connect via private IP/hostname with proper authentication
3. **Given** the application is internet-accessible, **When** external requests arrive, **Then** rate limiting, CORS policies, and firewall rules protect against abuse
4. **Given** user data is stored, **When** automated backups run, **Then** encrypted backups are created daily and stored in secure location with 30-day retention
5. **Given** a security audit is performed, **When** scanning tools run, **Then** no critical or high-severity vulnerabilities are detected in dependencies, configuration, or custom code
6. **Given** an administrator views monitoring dashboard, **When** checking system health, **Then** metrics show uptime, response times, error rates, and resource usage
7. **Given** database credentials are needed, **When** configuration is checked, **Then** secrets are stored in environment variables/vault, never in code or config files

**Security Audit Checklist**:
- ✅ **Authentication**: Strong password policy, JWT token security, session management
- ✅ **Authorization**: Proper access controls, user data isolation, admin role separation
- ✅ **Input Validation**: All user inputs sanitized, SQL injection prevention, XSS protection
- ✅ **Data Protection**: Passwords hashed with bcrypt, sensitive data encrypted at rest, HTTPS only
- ✅ **API Security**: Rate limiting, CORS configured properly, API authentication required
- ✅ **Dependencies**: All npm/NuGet packages up to date, no known vulnerabilities (npm audit, Snyk)
- ✅ **Headers**: Security headers configured (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- ✅ **Logging**: Security events logged (login attempts, auth failures), PII not logged
- ✅ **Infrastructure**: Firewall configured, only necessary ports open, services run as non-root
- ✅ **Backups**: Automated encrypted backups, tested restore procedures, offsite storage

**Deployment Infrastructure Requirements**:

**Local Network Access**:
- Deploy on home server/NAS with static local IP
- Configure reverse proxy (Nginx/Traefik) for clean URLs
- mDNS/DNS setup for friendly hostname (e.g., `tasks.local`)
- SSL certificate from Let's Encrypt or self-signed for local use
- Access control via firewall (only home network IPs)

**Internet Access**:
- Domain name registered and DNS configured
- Reverse proxy with SSL termination (Let's Encrypt via certbot)
- DDoS protection via Cloudflare (optional but recommended)
- Port forwarding configured on home router (if hosting at home)
- Alternative: Cloud hosting (DigitalOcean, AWS Lightsail, Hetzner) for reliability
- VPN access option for secure remote access without exposing application publicly

**Container Deployment (Recommended)**:
```yaml
# docker-compose.yml for production
version: '3.8'
services:
  web:
    image: finance-manager-web:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://api.yourdomain.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs:ro
    networks:
      - app-network
    
  api:
    image: finance-manager-api:latest
    restart: unless-stopped
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=${DB_CONNECTION_STRING}
      - JwtSettings__Secret=${JWT_SECRET}
    ports:
      - "5000:5000"
    networks:
      - app-network
    depends_on:
      - db
    
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=financemanager
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - app-network
    
  backup:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_DB=financemanager
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - ./backups:/backups
    command: |
      sh -c "while true; do
        pg_dump -h db -U $$POSTGRES_USER $$POSTGRES_DB | gzip > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
        find /backups -name 'backup_*.sql.gz' -mtime +30 -delete
        sleep 86400
      done"
    networks:
      - app-network
    depends_on:
      - db

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

**Monitoring & Observability**:
- Application logging: Structured logs with Serilog (API) and Winston (frontend)
- Health check endpoints: `/health` for uptime monitoring
- Performance monitoring: Response time tracking, slow query detection
- Error tracking: Sentry or similar for exception capture
- Uptime monitoring: External service (UptimeRobot, Pingdom) to alert on downtime
- Resource monitoring: CPU, memory, disk usage alerts

**Backup & Disaster Recovery**:
- **Automated daily backups**: Database exported to encrypted file
- **Offsite backup**: Copy to cloud storage (Backblaze B2, AWS S3) or external drive
- **Backup testing**: Monthly restore test to verify backup integrity
- **Retention policy**: 30 daily backups, 12 weekly backups, 6 monthly backups
- **Recovery time objective**: < 1 hour to restore from backup
- **Database migration rollback**: Keep previous database state before migrations

**Performance Optimization**:
- Database connection pooling configured
- Static asset CDN or caching headers
- Database indexes on frequent queries
- API response caching for read-heavy endpoints
- Image optimization and lazy loading
- Bundle size optimization (code splitting, tree shaking)

**Documentation Requirements**:
- Deployment runbook with step-by-step instructions
- Security checklist with validation steps
- Backup/restore procedures documentation
- Incident response playbook
- System architecture diagram
- Environment variable reference

---

### CI/CD Pipeline & Automated Deployment

**GitHub Actions Workflow Structure**:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  NODE_VERSION: '20.x'
  DOTNET_VERSION: '8.0.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # --- VALIDATION STAGE ---
  code-quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
      
      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install
          dotnet restore
      
      - name: Lint frontend
        run: pnpm --filter @finance-manager/web lint
      
      - name: TypeScript type check
        run: pnpm --filter @finance-manager/web typecheck
      
      - name: Lint backend
        run: dotnet format --verify-no-changes
  
  # --- SECURITY STAGE ---
  security-scan:
    name: Security Vulnerability Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: |
          npm install -g pnpm
          pnpm audit --audit-level=high
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --all-projects --severity-threshold=high
        continue-on-error: true
      
      - name: .NET dependency check
        run: |
          dotnet list package --vulnerable --include-transitive
          dotnet list package --outdated
  
  # --- TEST STAGE ---
  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: financemanager_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
      
      - name: Restore dependencies
        run: dotnet restore
      
      - name: Build
        run: dotnet build --no-restore --configuration Release
      
      - name: Run unit tests
        run: dotnet test apps/finance-api-tests/FinanceApi.UnitTests --no-build --configuration Release --logger "trx;LogFileName=unit-tests.trx"
      
      - name: Run integration tests
        run: dotnet test apps/finance-api-tests/FinanceApi.IntegrationTests --no-build --configuration Release --logger "trx;LogFileName=integration-tests.trx"
        env:
          ConnectionStrings__DefaultConnection: "Host=localhost;Database=financemanager_test;Username=test;Password=test123"
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: backend-test-results
          path: '**/*.trx'
      
      - name: Publish code coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage.cobertura.xml
          flags: backend
  
  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install
      
      - name: Run unit tests
        run: pnpm --filter @finance-manager/web test
      
      - name: Run integration tests
        run: pnpm --filter @finance-manager/web test:integration
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: frontend-test-results
          path: apps/web/coverage/
      
      - name: Publish code coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./apps/web/coverage/coverage-final.json
          flags: frontend
  
  test-e2e:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: financemanager_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
      
      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install
          dotnet restore
      
      - name: Install Playwright browsers
        run: pnpm --filter @finance-manager/web exec playwright install --with-deps
      
      - name: Build backend
        run: dotnet build --configuration Release
      
      - name: Build frontend
        run: pnpm --filter @finance-manager/web build
      
      - name: Start application
        run: |
          dotnet run --project apps/finance-api --no-build --configuration Release &
          pnpm --filter @finance-manager/web preview &
        env:
          ConnectionStrings__DefaultConnection: "Host=localhost;Database=financemanager_test;Username=test;Password=test123"
          ASPNETCORE_ENVIRONMENT: Test
      
      - name: Wait for services
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:5000/health; do sleep 2; done'
          timeout 60 bash -c 'until curl -f http://localhost:4173; do sleep 2; done'
      
      - name: Run E2E tests
        run: pnpm --filter @finance-manager/web test:e2e
        env:
          VITE_API_URL: http://localhost:5000
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 30
  
  # --- BUILD STAGE ---
  build-and-push:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    needs: [code-quality, security-scan, test-backend, test-frontend, test-e2e]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata (tags, labels)
        id: meta-api
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/finance-api/Dockerfile
          push: true
          tags: ${{ steps.meta-api.outputs.tags }}
          labels: ${{ steps.meta-api.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Extract metadata for web
        id: meta-web
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-web
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: ${{ steps.meta-web.outputs.tags }}
          labels: ${{ steps.meta-web.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
  
  # --- DEPLOY STAGE ---
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.yourdomain.com
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/finance-manager
            docker compose -f docker-compose.staging.yml pull
            docker compose -f docker-compose.staging.yml up -d
            docker system prune -f
      
      - name: Run database migrations
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            docker exec finance-manager-api dotnet ef database update
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://staging.yourdomain.com/health || exit 1
  
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://yourdomain.com
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create database backup
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/finance-manager
            docker exec finance-manager-db pg_dump -U $DB_USER financemanager | gzip > /backups/pre-deploy-$(date +%Y%m%d_%H%M%S).sql.gz
      
      - name: Deploy to production server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/finance-manager
            docker compose pull
            docker compose up -d
            docker system prune -f
      
      - name: Run database migrations
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            docker exec finance-manager-api dotnet ef database update
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://yourdomain.com/health || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Required GitHub Secrets**:
- `SNYK_TOKEN`: Security scanning authentication
- `CODECOV_TOKEN`: Code coverage reporting
- `STAGING_HOST`: Staging server IP/hostname
- `STAGING_USER`: SSH username for staging
- `STAGING_SSH_KEY`: SSH private key for staging
- `PROD_HOST`: Production server IP/hostname
- `PROD_USER`: SSH username for production
- `PROD_SSH_KEY`: SSH private key for production
- `SLACK_WEBHOOK`: Deployment notifications (optional)

---

### Hosting Options Analysis

#### **Option 1: Self-Hosted (Home Server / NAS)**

**Best for**: Personal use, full control, no recurring costs

**Pros**:
- ✅ Zero ongoing costs (after hardware investment)
- ✅ Complete data ownership and privacy
- ✅ No bandwidth charges for internal network use
- ✅ Can utilize existing home server/NAS hardware
- ✅ Learn devops skills hands-on

**Cons**:
- ❌ Requires static IP or dynamic DNS for internet access
- ❌ Home internet upload speeds typically slower (affects remote access)
- ❌ Responsible for hardware maintenance, power outages, cooling
- ❌ Security burden entirely on you (firewall, updates, monitoring)
- ❌ No SLA or guaranteed uptime

**Setup Requirements**:
- Home server/NAS with Docker support (Synology, QNAP, or custom build)
- Static IP or dynamic DNS service (No-IP, DuckDNS, Cloudflare)
- Port forwarding on router (80, 443, or custom ports)
- SSL certificate (Let's Encrypt via certbot or reverse proxy)
- Backup solution (external drive + cloud backup recommended)

**Monthly Cost**: £0 (electricity ~£5-15/month depending on hardware)

**Internet Access Options**:
- Direct port forwarding (simple but exposes home IP)
- VPN access only (WireGuard/Tailscale for secure remote access)
- Cloudflare Tunnel (free, hides home IP, no port forwarding needed)
- Reverse SSH tunnel to VPS (£3-5/month VPS + free home hosting)

**Recommended Configuration**:
```yaml
# Using Cloudflare Tunnel (no port forwarding needed)
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    networks:
      - app-network
```

---

#### **Option 2: Cloud VPS (DigitalOcean, Hetzner, Linode)**

**Best for**: Reliable uptime, easy scaling, professional hosting

**Pros**:
- ✅ Predictable monthly costs
- ✅ Fast, symmetric bandwidth (100Mbps-1Gbps+)
- ✅ Data centre reliability (99.9%+ uptime)
- ✅ Easy to scale resources (RAM, CPU, storage)
- ✅ Automated backups available
- ✅ Professional support and documentation

**Cons**:
- ❌ Monthly recurring costs
- ❌ Data transfer limits (though usually generous)
- ❌ Less control than bare metal
- ❌ Potential privacy concerns (data on third-party servers)

**Provider Comparison**:

| Provider | Specs | Price/Month | Notes |
|----------|-------|-------------|-------|
| **Hetzner** | 2 vCPU, 4GB RAM, 40GB SSD, 20TB traffic | €4.51 (~£3.85) | Best value, EU-based |
| **DigitalOcean** | 2 vCPU, 4GB RAM, 80GB SSD, 4TB traffic | $24 (~£19) | Excellent docs, managed DB available |
| **Linode** | 2 vCPU, 4GB RAM, 80GB SSD, 4TB traffic | $24 (~£19) | Good performance, Akamai network |
| **Vultr** | 2 vCPU, 4GB RAM, 80GB SSD, 3TB traffic | $18 (~£14.50) | Many regions, competitive pricing |
| **OVH** | 2 vCPU, 4GB RAM, 40GB SSD, Unmetered | €4.89 (~£4.15) | Similar to Hetzner, more regions |

**Recommended Starter**: Hetzner CPX21 (€4.51/month) or Vultr ($12/month for 2GB plan for minimal setup)

**Setup Requirements**:
- SSH access to VPS
- Docker + Docker Compose installed
- Domain name pointed to VPS IP (£10-15/year)
- SSL certificate via Let's Encrypt (free, auto-renewal)
- Firewall configuration (UFW or cloud provider firewall)

---

#### **Option 3: Cloud Platform (AWS, Azure, Google Cloud)**

**Best for**: Enterprise features, compliance requirements, future scaling to large user base

**Pros**:
- ✅ Comprehensive service ecosystem (managed DB, load balancers, CDN, etc.)
- ✅ Global availability zones for redundancy
- ✅ Advanced monitoring and analytics built-in
- ✅ Compliance certifications (GDPR, SOC2, etc.)
- ✅ Free tier available (limited, but useful for testing)

**Cons**:
- ❌ Expensive for small projects (can easily exceed £50-100/month)
- ❌ Complex pricing (per resource, per hour, per GB transferred)
- ❌ Steeper learning curve
- ❌ Easy to overspend without careful monitoring
- ❌ Overkill for personal/small projects

**Service Options**:

**AWS**:
- EC2 t3.small (2 vCPU, 2GB RAM): ~$0.0208/hour (~£12/month)
- RDS PostgreSQL db.t3.micro: ~$0.017/hour (~£10/month)
- Application Load Balancer: ~£18/month
- **Total**: ~£40-50/month minimum

**Azure**:
- B2s VM (2 vCPU, 4GB RAM): ~£24/month
- Azure Database for PostgreSQL: ~£15/month
- Application Gateway: ~£18/month
- **Total**: ~£57/month minimum

**Google Cloud**:
- e2-small (2 vCPU, 2GB RAM): ~£12/month
- Cloud SQL PostgreSQL: ~£8/month
- Cloud Load Balancing: ~£15/month
- **Total**: ~£35/month minimum

**Recommendation**: Only choose this if you plan to scale significantly or need compliance features. Otherwise, use VPS or self-hosted.

---

#### **Option 4: Managed Platform-as-a-Service (Heroku, Render, Railway, Fly.io)**

**Best for**: Zero devops overhead, fast deployment, prototyping

**Pros**:
- ✅ Deploy with git push (no server management)
- ✅ Automatic SSL, scaling, health checks
- ✅ Built-in database hosting
- ✅ Easy rollbacks and CI/CD integration
- ✅ Focus on code, not infrastructure

**Cons**:
- ❌ More expensive than VPS for equivalent resources
- ❌ Less control over environment
- ❌ Vendor lock-in (harder to migrate)
- ❌ Cold start issues on free/cheap tiers
- ❌ Limited to platform-supported tech stacks

**Provider Comparison**:

| Provider | Specs | Price/Month | Notes |
|----------|-------|-------------|-------|
| **Railway** | 512MB RAM, 1GB disk, 100GB transfer | $5 + usage | Great DX, generous free tier |
| **Render** | 512MB RAM, free SSL, auto-deploy | $7/service (web+api) = $14 | Good docs, reliable |
| **Fly.io** | 256MB RAM, 1GB disk | $0 (1 app free) then ~$1.94/GB RAM | Edge network, fast globally |
| **Heroku** | 512MB RAM, limited hours free | $7/dyno ($14 for web+api) | Original PaaS, reliable but pricey |

**Recommended**: Railway or Render for ease of use, Fly.io for global performance

---

#### **Option 5: Hybrid (Self-Hosted + Cloud Backup/CDN)**

**Best for**: Cost optimization with reliability

**Pros**:
- ✅ Primary hosting at home (free)
- ✅ Cloud backup/failover for reliability
- ✅ CDN for static assets (fast, cheap)
- ✅ Best of both worlds

**Cons**:
- ❌ More complex setup
- ❌ Multiple systems to manage

**Architecture**:
- Primary hosting: Home server/NAS
- Backup/failover: Small VPS (£3-5/month) that monitors and takes over if home server down
- Database backups: Cloud storage (Backblaze B2, AWS S3 Glacier - £1-2/month for 100GB)
- Static assets: Cloudflare CDN (free tier often sufficient)
- Monitoring: UptimeRobot (free tier for 50 monitors)

**Monthly Cost**: £5-10 (VPS + backup storage)

---

### Recommended Hosting Strategy by Scenario

**Scenario 1: Personal Use Only (You + Family)**
- **Choice**: Self-hosted on home server
- **Access**: Local network + Tailscale VPN for remote access
- **Cost**: ~£0/month (electricity only)
- **Complexity**: Moderate (one-time setup)

**Scenario 2: Personal Use + Occasional Remote Access**
- **Choice**: Self-hosted + Cloudflare Tunnel
- **Cost**: £0/month
- **Complexity**: Low (Cloudflare handles SSL and DNS)

**Scenario 3: Learning DevOps + Reliable Access**
- **Choice**: Hetzner VPS (CPX21)
- **Cost**: ~£4/month
- **Complexity**: Moderate (SSH, Docker, Nginx)

**Scenario 4: Sharing with Friends/Family**
- **Choice**: Hetzner VPS or Render
- **Cost**: £4-15/month depending on PaaS vs VPS
- **Complexity**: Low (Render) or Moderate (Hetzner)

**Scenario 5: Future SaaS Product**
- **Choice**: Start with VPS, migrate to AWS/Azure when scaling
- **Cost**: £4/month initially, scale as needed
- **Complexity**: High (requires proper architecture planning)

---

### Docker Configuration for Deployment

**Production Dockerfiles**:

```dockerfile
# apps/finance-api/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Finance Manager.sln", "./"]
COPY ["apps/finance-api/FinanceApi.csproj", "apps/finance-api/"]
RUN dotnet restore "apps/finance-api/FinanceApi.csproj"
COPY . .
WORKDIR "/src/apps/finance-api"
RUN dotnet build "FinanceApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FinanceApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "FinanceApi.dll"]
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
WORKDIR /app/apps/web
RUN pnpm build

FROM nginx:alpine AS final
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf for SPA routing**:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://api:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

**Estimated Effort**: 3-4 weeks
- Week 1: Security audit + hardening + dependency updates + secret management
- Week 2: Docker setup + CI/CD pipeline (GitHub Actions) + hosting decision
- Week 3: Deployment automation + monitoring + backup automation
- Week 4: Documentation + testing + staging environment validation

---

## Implementation Priority Summary

### Immediate Focus (Phase 5):
1. **Task Relationships & Linking (US 5.1)** - Builds on existing task system, adds valuable organization
2. **Comments & Annotations (US 5.2)** - Enhances individual tasks with context and history
3. **Production Deployment (US 5.3)** - Makes application usable in real-world scenarios

### Integration Points:
- **US 5.1** integrates with existing Task and Event entities, requires user-friendly ID system
- **US 5.2** integrates with Task and Event detail views, adds comment model
- **US 5.3** is infrastructure-focused, required before public/production use

### Dependencies:
- US 5.1 and US 5.2 can be developed in parallel (different data models, minimal overlap)
- US 5.3 should be completed before exposing application to external users
- All three build on existing Phase 1-4 features without blocking other enhancements


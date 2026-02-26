# WIP Limits & Task Status Feature Specification

**Feature**: Work-in-progress limits with enriched task status workflow, inspired by Kanban methodology, enforcing focus by limiting concurrent active tasks

**Priority**: P2 (Critical productivity feature — prevents context-switching overload and "everything in progress" paralysis)

**Business Value**: Forces intentional focus by limiting how many tasks can be actively worked on simultaneously. Replaces the binary complete/incomplete model with a richer status workflow, unlocking Kanban-style views, better progress tracking, and meaningful statistics about task flow.

**Dependencies**: None (foundational — other features build on this)

---

## User Stories

### US-55.1: Task Status Workflow (P1)

**Why P1**: The binary complete/incomplete model is insufficient for real task management. Users need to distinguish between tasks they haven't looked at, tasks they're actively working on, tasks blocked by external factors, and tasks they've finished. This is the foundation for WIP limits, Kanban views, and workflow analytics.

**Independent Test**: Create 5 tasks. Move task 1 to "In Progress", verify status badge shows. Move task 2 to "In Progress". Move task 1 to "Blocked" — verify it shows blocked indicator with reason prompt. Complete task 2 — verify it moves to "Completed" with timestamp. Verify task 3-5 remain "Not Started". Check statistics page shows correct counts per status.

**Acceptance Scenarios**:

1. **Given** a user creates a new task
   **When** the task is saved
   **Then** the task status defaults to "Not Started" and the UI displays a grey status indicator

2. **Given** a user views a task with status "Not Started"
   **When** they click the status indicator or select "Start Working" from the task menu
   **Then** the task status changes to "In Progress", the indicator turns blue, and `StartedAt` timestamp is recorded

3. **Given** a user is working on a task (status: "In Progress")
   **When** they click "Mark as Blocked"
   **Then** a prompt asks for a blocking reason (optional free text), the task status changes to "Blocked", and the indicator turns amber/orange

4. **Given** a task is in "Blocked" status
   **When** the user clicks "Unblock" or "Resume"
   **Then** the task returns to "In Progress" status and the blocking reason is cleared

5. **Given** a user completes a task (any previous status)
   **When** they check the completion checkbox or click "Complete"
   **Then** the task status changes to "Completed", `CompletedAt` is set, and the existing `Completed` boolean is also set to `true` for backward compatibility

6. **Given** a user views the task list
   **When** tasks have different statuses
   **Then** each task displays a colour-coded status badge: grey (Not Started), blue (In Progress), amber (Blocked), green (Completed)

7. **Given** a user wants to filter tasks
   **When** they select a status filter (e.g., "In Progress" only)
   **Then** only tasks with the selected status are displayed, and the filter persists across page navigation

8. **Given** a user views the Tasks page
   **When** they switch to "Board View" (Kanban)
   **Then** tasks are displayed in columns: Not Started | In Progress | Blocked | Completed, with drag-and-drop between columns

---

### US-55.2: WIP Limit Configuration (P2)

**Why P2**: Without limits, the status workflow is just decoration. WIP limits are the enforcement mechanism that creates real behavioural change — forcing users to finish work before starting new work.

**Independent Test**: Set WIP limit to 3. Start 3 tasks (move to "In Progress"). Try to start a 4th task — verify warning appears showing 3 active tasks. Dismiss warning and verify task remains "Not Started". Change WIP limit to 5. Start the 4th task — verify it succeeds. Set a per-group limit of 1 for "Side Projects". Start 1 side project task. Try to start another in the same group — verify group-specific warning appears.

**Acceptance Scenarios**:

1. **Given** a user opens Settings
   **When** they navigate to the "Productivity" section
   **Then** they see a "WIP Limit" setting with a numeric input (default: 3, range: 1-20)

2. **Given** a user has set a WIP limit of 3
   **When** they already have 3 tasks in "In Progress" status and try to start a 4th
   **Then** a modal appears showing: "You've reached your WIP limit (3/3)", the list of current in-progress tasks, and options to "Go Back" or "Start Anyway" (soft enforcement)

3. **Given** the WIP limit warning modal is shown
   **When** the user clicks "Start Anyway"
   **Then** the task moves to "In Progress" (soft limit, not hard block), and a toast warns "You're over your WIP limit — consider finishing something first"

4. **Given** a user has set a WIP limit
   **When** they complete an in-progress task, bringing the count below the limit
   **Then** a subtle celebration toast appears: "Nice! You're back within your WIP limit (2/3)"

5. **Given** a user views the dashboard or tasks page header
   **When** they have active WIP limits configured
   **Then** a WIP counter is visible: "Active: 2/3" with colour coding (green if under, amber if at, red if over)

6. **Given** a user wants per-group WIP limits
   **When** they edit a TaskGroup's settings
   **Then** they can set an optional group-specific WIP limit (e.g., "Side Projects: max 1 in progress")

7. **Given** a user has both a global WIP limit (3) and a group limit ("Side Projects": 1)
   **When** they try to start a 2nd side project task (but global is at 2/3)
   **Then** the group-specific limit triggers first: "Side Projects WIP limit reached (1/1)"

---

### US-55.3: User Settings Infrastructure (P2)

**Why P2**: WIP limits require persistent, per-user configuration. This establishes a `UserSettings` table that other features (energy defaults, Eisenhower auto-categorisation, notification preferences) will also use.

**Independent Test**: Create and retrieve user settings via API. Verify default values are returned for a user with no explicit settings. Update WIP limit to 5, refresh, verify persistence. Verify settings are user-scoped (user A's settings don't affect user B).

**Acceptance Scenarios**:

1. **Given** a new user registers
   **When** they access settings for the first time
   **Then** default settings are created: `wipLimit: 3`, `wipEnforcement: 'soft'`, `showWipCounter: true`

2. **Given** a user updates their WIP limit
   **When** they save the settings
   **Then** the new value is persisted and immediately reflected in the UI without page reload

3. **Given** a user accesses the API directly
   **When** they call `GET /api/v1/settings`
   **Then** they receive their settings (or defaults if none set), and cannot access other users' settings

4. **Given** an admin views user management
   **When** they view a user's profile
   **Then** they can see (but not modify) that user's productivity settings

5. **Given** a user changes `wipEnforcement` from "soft" to "hard"
   **When** they exceed the WIP limit
   **Then** the "Start Anyway" option is removed — the task cannot be started until WIP is reduced

---

### US-55.4: Kanban Board View (P3)

**Why P3**: Important for visual workflow management but the list view with status badges provides functional parity. The board view is ergonomically superior for drag-and-drop triage but not essential for WIP limits to work.

**Independent Test**: Navigate to Tasks page. Switch to "Board View". Verify 4 columns render (Not Started, In Progress, Blocked, Completed). Create a task — verify it appears in "Not Started" column. Drag it to "In Progress" — verify status updates and WIP counter increments. Filter by group — verify all columns filter simultaneously.

**Acceptance Scenarios**:

1. **Given** a user is on the Tasks page
   **When** they click the "Board View" toggle (currently showing "List View")
   **Then** the display switches to a Kanban-style board with columns for each status, and the preference is saved in localStorage

2. **Given** a user views the board
   **When** tasks exist in different statuses
   **Then** each column shows a count badge and tasks are ordered by priority (Critical first) then due date

3. **Given** a user drags a task card from "Not Started" to "In Progress"
   **When** they drop it
   **Then** the task status updates via API, the card animates to its new column, and the WIP counter updates

4. **Given** a user drags a task to "In Progress" and the WIP limit is reached
   **When** they drop it
   **Then** the WIP limit warning appears (same as list view behaviour) and the card returns to its original column if cancelled

5. **Given** a user has group and priority filters active
   **When** they switch between list and board views
   **Then** the same filters apply to both views and filter state is preserved

---

## Data Model Changes

### New: TaskStatus Enum

```csharp
public enum TaskStatus
{
    NotStarted = 0,
    InProgress = 1,
    Blocked = 2,
    Completed = 3
}
```

### Modified: Task Entity

```csharp
// New fields
public TaskStatus Status { get; set; } = TaskStatus.NotStarted;
public DateTime? StartedAt { get; set; }
public string? BlockedReason { get; set; } // max 500 chars
```

### New: UserSettings Entity

```csharp
public class UserSettings
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    
    // WIP settings
    public int WipLimit { get; set; } = 3;
    public string WipEnforcement { get; set; } = "soft"; // "soft" | "hard"
    public bool ShowWipCounter { get; set; } = true;
    
    // Future extensibility
    public string? Preferences { get; set; } // JSON blob for non-critical settings
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation
    public User User { get; set; }
}
```

### Modified: TaskGroup Entity

```csharp
// New field
public int? WipLimit { get; set; } // null = no group-specific limit
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `PATCH` | `/api/v1/tasks/{id}/status` | Update task status (with WIP validation) |
| `GET` | `/api/v1/tasks/wip-summary` | Get current WIP counts (global + per-group) |
| `GET` | `/api/v1/settings` | Get user settings |
| `PUT` | `/api/v1/settings` | Update user settings |

### Database Indexes

```sql
CREATE INDEX IX_Tasks_UserId_Status ON Tasks (UserId, Status);
CREATE INDEX IX_Tasks_UserId_Status_GroupId ON Tasks (UserId, Status, GroupId);
CREATE UNIQUE INDEX IX_UserSettings_UserId ON UserSettings (UserId);
```

---

## Edge Cases

1. **Migration of existing completed tasks**: All tasks with `Completed = true` should have `Status = Completed` in the migration. All others get `Status = NotStarted`.
2. **Backward compatibility**: The `Completed` boolean must remain in sync with `Status`. Setting `Status = Completed` also sets `Completed = true`. Toggling `Completed` via the existing endpoint should update `Status` accordingly.
3. **Subtask WIP**: Subtasks don't count towards WIP limits — only root-level tasks do.
4. **Blocked tasks and WIP**: Blocked tasks DO count towards WIP (they're started work that's stalled). This incentivises unblocking rather than just parking tasks.
5. **Bulk operations**: Bulk completing subtasks should update parent status if all children complete.
6. **Statistics impact**: Weekly progress and historical charts need to account for the new statuses.

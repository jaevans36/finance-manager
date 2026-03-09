# Energy-Based Tagging & Smart Suggestions Feature Specification

**Feature**: Tag tasks by required energy/cognitive load and get intelligent "What Can I Do Now?" suggestions based on current energy level, time available, and task context

**Priority**: P2 (Addresses the reality that not all hours are equal — a parent after a full work day has different capacity than morning-fresh focus time)

**Business Value**: Prevents the common failure mode of staring at a task list full of complex items when you're exhausted. By tagging tasks with energy requirements and providing time-aware suggestions, the system matches tasks to your current capacity. This dramatically increases completion rates for low-energy tasks that would otherwise be perpetually deferred.

**Dependencies**: Phase 55 (Task Status & WIP Limits) — Status field enables filtering by "Not Started" and "In Progress". Phase 56 (Eisenhower Matrix) — optional but enriches suggestions with urgency/importance data.

---

## User Stories

### US-57.1: Energy Level Tagging (P2)

**Why P2**: The energy tag is the foundation for smart suggestions. Without it, the system can't match tasks to capacity. Must be simple (3 levels) and fast to set — any friction in tagging will lead to users abandoning it.

**Independent Test**: Create 3 tasks. Tag task 1 as "High Energy" (complex AI work). Tag task 2 as "Medium Energy" (moderate effort). Tag task 3 as "Low Energy" (painting a wall, admin). Verify energy badges display correctly on each task. Filter by "Low Energy" — verify only task 3 shows.

**Acceptance Scenarios**:

1. **Given** a user creates or edits a task
   **When** they view the task form
   **Then** they see an optional "Energy Level" selector with 3 options:
   - **High** (🔴 / brain icon) — "Deep focus, complex problem-solving"
   - **Medium** (🟡 / lightning icon) — "Moderate concentration, routine work"
   - **Low** (🟢 / leaf icon) — "Minimal effort, wind-down activities"

2. **Given** a user sets an energy level on a task
   **When** the task is saved and displayed in the list
   **Then** a small coloured energy indicator appears on the task card (red dot/amber dot/green dot)

3. **Given** a user leaves the energy level unset
   **When** the task is saved
   **Then** no energy indicator appears and the task is treated as "any energy" in suggestions

4. **Given** a user views the task list or calendar
   **When** they use the energy filter
   **Then** they can filter to show only High, Medium, or Low energy tasks (multi-select)

5. **Given** a user wants to tag multiple tasks quickly
   **When** they select multiple tasks and choose "Set Energy Level"
   **Then** a bulk action sets the energy level for all selected tasks

---

### US-57.2: Estimated Duration (P2)

**Why P2**: Time awareness is critical for the "What Can I Do Now?" feature. If you have 30 minutes before picking up the kids, showing 4-hour tasks is useless. A simple duration estimate makes suggestions time-aware.

**Independent Test**: Create a task with estimated duration of 30 minutes. Create another with 2 hours. Open "What Can I Do Now?" with 45 minutes available. Verify the 30-minute task appears but the 2-hour task does not.

**Acceptance Scenarios**:

1. **Given** a user creates or edits a task
   **When** they view the task form
   **Then** they see an optional "Estimated Time" field with preset buttons: 15m, 30m, 1h, 2h, 4h, and a custom input

2. **Given** a user sets an estimated time of 30 minutes
   **When** the task is displayed in the list
   **Then** a small time badge shows "30m" next to the task title

3. **Given** a user leaves estimated time unset
   **When** the task is considered for suggestions
   **Then** it is included regardless of time constraint (no time filtering applied)

4. **Given** a user views the Tasks page
   **When** they sort by estimated time
   **Then** tasks are ordered from shortest to longest (null values at the end)

---

### US-57.3: "What Can I Do Now?" Smart Suggestions (P1)

**Why P1**: This is the killer feature that makes energy tagging and duration estimates actionable. Without it, the tags are just decoration. This panel turns the system from a passive list into an active productivity coach.

**Independent Test**: Set up 10 tasks with varying energy levels, durations, and priorities. Open "What Can I Do Now?" — select "Low Energy" and "30 minutes available". Verify results show only Low energy tasks under 30 minutes, sorted by urgency then due date. Change to "High Energy" and "2 hours" — verify the list changes to show complex tasks. Verify Q1 Eisenhower tasks are prioritised over Q4 tasks.

**Acceptance Scenarios**:

1. **Given** a user clicks the "What Can I Do Now?" button (prominent placement in header/sidebar)
   **When** the suggestion panel opens
   **Then** they see two prompts:
   - "How much energy do you have?" — High / Medium / Low buttons
   - "How much time do you have?" — preset buttons: 15m, 30m, 1h, 2h, 4h, "No limit"

2. **Given** a user selects "Low Energy" and "30 minutes"
   **When** the suggestions load
   **Then** the panel shows matching tasks filtered by:
   - Energy level ≤ selected (Low only)
   - Estimated duration ≤ 30 minutes (or unset)
   - Status is "Not Started" or "In Progress" (from Phase 55)
   - Not completed
   Sorted by: Urgency (Q1 first, from Phase 56) → Due date (soonest) → Priority

3. **Given** no tasks match the current energy + time criteria
   **When** the suggestions panel loads
   **Then** it shows "Nothing matches right now" with suggestions:
   - "You could review blocked tasks" (link to blocked filter)
   - "Or try a different energy level"
   - "Or create a quick task" (link to create)

4. **Given** a user selects "High Energy" and "No limit"
   **When** the suggestions load
   **Then** all incomplete tasks with High energy (or unset) are shown, sorted by importance/urgency

5. **Given** a user picks a task from the suggestion panel
   **When** they click "Start This"
   **Then** the task moves to "In Progress" status (Phase 55), the panel closes, and the task detail opens

6. **Given** a user uses the suggestion panel
   **When** they dismiss it
   **Then** their last energy + time selection is remembered for next time (stored in localStorage)

7. **Given** a user hasn't tagged any tasks with energy levels
   **When** they open "What Can I Do Now?"
   **Then** the time filter still works (showing tasks under the selected duration), and a prompt suggests: "Tag your tasks with energy levels for better suggestions"

---

### US-57.4: Energy Dashboard Widget (P3)

**Why P3**: Nice-to-have visualisation. The suggestion panel (US-57.3) provides the primary value. The dashboard widget adds long-term insights but isn't needed for day-to-day use.

**Independent Test**: Navigate to dashboard. Verify the "Energy Distribution" widget shows a breakdown of tasks by energy level. Verify the "Best Time to Work" insight calculates peak completion times. Complete 5 low-energy tasks in the evening — verify the widget updates to show "Evenings: best for low-energy work".

**Acceptance Scenarios**:

1. **Given** a user views the dashboard
   **When** they have tasks with energy tags
   **Then** an "Energy Distribution" widget shows a doughnut chart: X% High, Y% Medium, Z% Low energy tasks

2. **Given** a user has completed tasks over time
   **When** they view the energy widget
   **Then** an insight shows completion patterns: "You complete most low-energy tasks between 8-10pm" (based on `CompletedAt` timestamps vs energy level)

3. **Given** a user has many high-energy tasks pending
   **When** they view the widget
   **Then** a suggestion appears: "You have 12 high-energy tasks queued — consider breaking some into smaller low-energy steps"

---

## Data Model Changes

### New: EnergyLevel Enum

```csharp
public enum EnergyLevel
{
    Low = 0,
    Medium = 1,
    High = 2
}
```

### Modified: Task Entity

```csharp
// New fields
public EnergyLevel? EnergyLevel { get; set; }    // null = any/unset
public int? EstimatedMinutes { get; set; }         // null = unestimated
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/tasks/suggestions` | Smart suggestions (query: energy, maxMinutes) |
| `PATCH` | `/api/v1/tasks/{id}/energy` | Set energy level |
| `PATCH` | `/api/v1/tasks/{id}/estimate` | Set estimated duration |
| `POST` | `/api/v1/tasks/bulk-energy` | Bulk set energy level |
| `GET` | `/api/v1/statistics/energy-distribution` | Energy breakdown stats |

### Database Indexes

```sql
CREATE INDEX IX_Tasks_UserId_EnergyLevel ON Tasks (UserId, EnergyLevel);
CREATE INDEX IX_Tasks_UserId_EnergyLevel_EstimatedMinutes ON Tasks (UserId, EnergyLevel, EstimatedMinutes);
```

---

## Edge Cases

1. **Null energy + suggestions**: Tasks without energy level are included in all energy filters (they're "any energy").
2. **Null duration + time filter**: Tasks without estimated minutes are included when time filter is applied (they might fit).
3. **Energy level changes**: Changing energy level on a parent task does NOT cascade to subtasks.
4. **Integration with Eisenhower**: The suggestion engine prioritises Q1 > Q2 > Q3 > Q4 within the energy/time-filtered results.
5. **Integration with WIP**: If the user is at their WIP limit, suggestions should show in-progress tasks first ("Continue working on...") before suggesting new tasks to start.
6. **Completion time accuracy**: The "Best Time to Work" insight uses `CompletedAt` timestamps, which may be inaccurate if users batch-complete tasks. Note this limitation in the UI.
7. **Zero results**: When no tasks match, always provide actionable alternatives rather than an empty state.

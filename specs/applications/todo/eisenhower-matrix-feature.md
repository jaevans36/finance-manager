# Eisenhower Matrix Feature Specification

**Feature**: Two-dimensional task categorisation using Urgency and Importance axes, with a dedicated matrix view for visual triage and decision-making

**Priority**: P2 (High-value productivity framework — prevents "everything is on fire" feeling by forcing explicit categorisation)

**Business Value**: The Eisenhower Matrix is one of the most proven prioritisation frameworks. By adding dedicated Urgency and Importance dimensions (independent of the existing Priority field), users gain a structured way to triage work, defer low-value tasks, and focus on what genuinely matters. The visual matrix view makes the categorisation intuitive and actionable.

**Dependencies**: Phase 55 (Task Status & WIP Limits) — the Status field enables richer matrix interactions (e.g., filtering by in-progress items, deferred = not started)

---

## User Stories

### US-56.1: Urgency and Importance Classification (P2)

**Why P2**: The two new axes are the foundation of the Eisenhower Matrix. Without them, the matrix view has nothing to display. These must be added as optional fields so non-matrix users aren't burdened with extra input.

**Independent Test**: Create 4 tasks. Set Task 1 to Urgent + Important. Set Task 2 to Not Urgent + Important. Set Task 3 to Urgent + Not Important. Set Task 4 to Not Urgent + Not Important. Navigate to Matrix view — verify each task appears in the correct quadrant. Edit Task 1 to Not Urgent — verify it moves from Q1 to Q2.

**Acceptance Scenarios**:

1. **Given** a user creates or edits a task
   **When** they view the task form
   **Then** they see optional "Urgency" and "Importance" selectors with values: High, Medium, Low (defaulting to unset/null)

2. **Given** a user sets Urgency to "High" and Importance to "High"
   **When** they save the task
   **Then** the task is classified as Quadrant 1 (Do First) and displays a Q1 badge/indicator

3. **Given** a user leaves Urgency and Importance unset
   **When** they save the task
   **Then** the task appears as "Unclassified" in the matrix view's overflow section, with a prompt to categorise it

4. **Given** a task has an existing Priority of "Critical" and DueDate within 3 days
   **When** the user opens the Eisenhower classification for the first time
   **Then** the system auto-suggests Urgency: High, Importance: High (user can override)

5. **Given** a task's DueDate is more than 2 weeks away and Priority is "Low"
   **When** the user opens the Eisenhower classification
   **Then** the system auto-suggests Urgency: Low, Importance: Low (Q4 — consider deferring)

6. **Given** a user views a task in the task list
   **When** the task has Eisenhower classification set
   **Then** a small quadrant indicator (Q1/Q2/Q3/Q4) appears alongside the priority badge

7. **Given** a user wants to classify multiple tasks quickly
   **When** they use the "Bulk Classify" action on selected tasks
   **Then** a modal allows setting Urgency and Importance for all selected tasks at once

---

### US-56.2: Eisenhower Matrix View (P2)

**Why P2**: The visual matrix is what makes this framework actionable. Without it, the urgency/importance fields are just metadata. The 2x2 grid provides instant visual clarity on where to focus.

**Independent Test**: Navigate to the Matrix view. Verify 4 quadrants render with correct labels and colours. Verify tasks appear in correct quadrants based on their classification. Drag a task from Q4 to Q1 — verify urgency and importance update. Filter by group "Work" — verify only Work tasks appear. Check the "Unclassified" section shows tasks without urgency/importance set.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Eisenhower Matrix page
   **When** the page loads
   **Then** a 2x2 grid displays with quadrants:
   - **Q1 (top-left)**: "Do First" — red/urgent colour — Urgent + Important
   - **Q2 (top-right)**: "Schedule" — blue/calm colour — Not Urgent + Important
   - **Q3 (bottom-left)**: "Delegate" — amber colour — Urgent + Not Important
   - **Q4 (bottom-right)**: "Eliminate" — grey colour — Not Urgent + Not Important

2. **Given** tasks exist with Eisenhower classification
   **When** the matrix view loads
   **Then** each quadrant shows task cards with title, priority badge, due date, and group colour indicator, sorted by due date (soonest first)

3. **Given** a user drags a task from one quadrant to another
   **When** they drop it in the target quadrant
   **Then** the task's Urgency and Importance values update via API to match the target quadrant, and the card animates to its new position

4. **Given** tasks exist without Eisenhower classification
   **When** the matrix view loads
   **Then** an "Unclassified" section appears below/beside the matrix showing unclassified task count with a "Classify Now" prompt

5. **Given** a user clicks "Classify Now" on an unclassified task
   **When** the classification picker appears
   **Then** they can click one of the 4 quadrants to instantly assign it, or set Urgency/Importance individually

6. **Given** a user views the matrix with many tasks
   **When** a quadrant has more than 5 tasks
   **Then** the quadrant shows the first 5 with a "+N more" expander, and within-quadrant sorting is by due date then priority

7. **Given** a user applies group or priority filters
   **When** the matrix re-renders
   **Then** all 4 quadrants filter simultaneously, and empty quadrants show "No tasks" placeholder

8. **Given** a user is on a mobile viewport
   **When** they view the matrix
   **Then** the grid collapses to a stacked layout (Q1 on top, Q4 on bottom) with horizontal swipe between quadrants

---

### US-56.3: Auto-suggestion Engine (P3)

**Why P3**: Helpful but not essential. Users can manually classify. Auto-suggestion reduces friction and helps users who are unsure how to categorise a task.

**Independent Test**: Create a task with Priority "Critical" and DueDate tomorrow. Open the Eisenhower classification — verify it auto-suggests Q1. Create a task with no DueDate and Priority "Low" — verify it suggests Q4. Override the suggestion — verify the override is saved. Create a task with DueDate in 3 weeks and Priority "High" — verify it suggests Q2.

**Acceptance Scenarios**:

1. **Given** a task has Priority "Critical" or "High" AND DueDate within 7 days
   **When** the user opens Eisenhower classification
   **Then** the system suggests Urgency: High, Importance: High (Q1) with explanation "High priority + imminent deadline"

2. **Given** a task has Priority "High" AND DueDate more than 7 days away (or no date)
   **When** the user opens Eisenhower classification
   **Then** the system suggests Urgency: Low, Importance: High (Q2) with explanation "Important but not time-sensitive — schedule it"

3. **Given** a task has Priority "Low" AND DueDate within 3 days
   **When** the user opens Eisenhower classification
   **Then** the system suggests Urgency: High, Importance: Low (Q3) with explanation "Time-sensitive but low priority — delegate if possible"

4. **Given** a task has Priority "Low" or "Medium" AND DueDate far away or unset
   **When** the user opens Eisenhower classification
   **Then** the system suggests Urgency: Low, Importance: Low (Q4) with explanation "Consider deferring or eliminating"

5. **Given** a user overrides the auto-suggestion
   **When** they save the task
   **Then** the manual classification is saved and the system does not re-suggest on future edits

6. **Given** a user has many unclassified tasks
   **When** they click "Auto-classify All"
   **Then** a confirmation dialog shows proposed classifications for each task, the user can approve or adjust individual tasks, then bulk-save

---

## Data Model Changes

### New: UrgencyLevel & ImportanceLevel Enums

```csharp
public enum UrgencyLevel
{
    Low = 0,
    Medium = 1,
    High = 2
}

public enum ImportanceLevel
{
    Low = 0,
    Medium = 1,
    High = 2
}
```

### Modified: Task Entity

```csharp
// New fields
public UrgencyLevel? Urgency { get; set; }      // null = unclassified
public ImportanceLevel? Importance { get; set; }  // null = unclassified
```

### Quadrant Mapping

| Urgency | Importance | Quadrant | Action |
|---------|-----------|----------|--------|
| High | High | Q1 — Do First | Tackle immediately |
| Low | High | Q2 — Schedule | Plan and schedule — most productive quadrant |
| High | Low | Q3 — Delegate | Handle quickly or delegate |
| Low | Low | Q4 — Eliminate | Defer, batch, or remove |
| Medium (either) | Any | Nearest quadrant | Round based on the higher axis |

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `PATCH` | `/api/v1/tasks/{id}/classify` | Set urgency + importance |
| `POST` | `/api/v1/tasks/bulk-classify` | Bulk set classification |
| `GET` | `/api/v1/tasks/matrix` | Get tasks grouped by quadrant |
| `GET` | `/api/v1/tasks/{id}/suggest-classification` | Get auto-suggestion for a task |
| `POST` | `/api/v1/tasks/auto-classify` | Auto-classify unclassified tasks (preview) |

### Database Indexes

```sql
CREATE INDEX IX_Tasks_UserId_Urgency_Importance ON Tasks (UserId, Urgency, Importance);
```

---

## Edge Cases

1. **Medium values**: When Urgency or Importance is "Medium", map to nearest quadrant: Medium+High → same as High+High (Q1); Medium+Low → same as High+Low (Q3). Display a "borderline" indicator.
2. **Null handling**: Tasks with null Urgency/Importance appear in the "Unclassified" overflow, not in any quadrant.
3. **Subtasks**: Subtasks inherit parent's classification by default but can be overridden.
4. **Completed tasks**: Don't show in the matrix by default. Optional toggle to show completed tasks (greyed out).
5. **Group colours**: Task cards in the matrix should show their group's colour indicator for quick visual grouping.
6. **Responsive design**: On mobile, the matrix collapses to a tabbed or stacked view.
7. **Integration with WIP limits (Phase 55)**: Q1 tasks that are "In Progress" show the WIP counter. Starting a Q4 task when at WIP limit should surface a stronger warning.

# Subtasks Feature Specification

**Feature**: Hierarchical task management with nested subtasks for breaking down complex work into manageable pieces

**Priority**: P2 (Important for power users and complex project management)

**Business Value**: Enables users to organize complex projects by breaking large tasks into smaller, actionable steps. Improves task clarity, progress tracking, and completion satisfaction through incremental achievements.

---

## User Stories

### US-13.5.1: Create and Manage Subtasks (P2)

**Why P2**: Core productivity feature requested by power users. Essential for managing complex projects and multi-step workflows. Significantly improves task organization and completion tracking.

**Independent Test**: Create parent task "Launch Website", add 3 subtasks ("Design mockups", "Write content", "Deploy code"), mark 2 as complete, verify parent shows 2/3 progress, complete last subtask, verify parent auto-completes.

**Acceptance Scenarios**:

1. **Given** a user is viewing a task detail page  
   **When** they click "Add Subtask" button  
   **Then** a new subtask creation form appears inline below the task with fields: Title (required), Description (optional), Priority, Due Date

2. **Given** a user creates a subtask  
   **When** they enter a title and save  
   **Then** the subtask appears indented below the parent task with completion checkbox, and parent task shows subtask count (e.g., "0/1 subtasks completed")

3. **Given** a parent task has multiple subtasks  
   **When** user completes 2 out of 3 subtasks  
   **Then** parent task displays progress indicator "67% complete (2/3 subtasks)" and visual progress bar

4. **Given** a parent task has subtasks  
   **When** all subtasks are marked complete  
   **Then** parent task automatically marks as complete with notification "All subtasks completed! Parent task marked as done."

5. **Given** a user completes a parent task manually  
   **When** they check the parent task's completion checkbox  
   **Then** system prompts "Complete all subtasks too?" with Yes/No options, and respects user choice

6. **Given** a user is viewing subtasks  
   **When** they expand/collapse parent task  
   **Then** subtasks smoothly animate in/out with chevron icon rotating and state persisted in localStorage

7. **Given** a subtask exists  
   **When** user clicks on it  
   **Then** subtask detail view opens with all standard task fields (description, priority, due date, notes, attachments if implemented)

---

### US-13.5.2: Nested Subtasks (Multi-Level Hierarchy) (P3)

**Why P3**: Advanced feature for complex projects. Nice to have but not essential for initial launch. Many users satisfied with 1 level of subtasks.

**Independent Test**: Create task "Build App" → subtask "Backend API" → sub-subtask "Auth System" → sub-sub-subtask "JWT Implementation", verify 3-level nesting displays correctly with proper indentation.

**Acceptance Scenarios**:

1. **Given** a subtask exists  
   **When** user clicks "Add Subtask" on that subtask  
   **Then** a nested subtask is created (sub-subtask) indented further, supporting up to 5 levels of nesting

2. **Given** multi-level subtasks exist  
   **When** displayed in task list  
   **Then** each level is visually indented 20px more than parent with connecting lines showing hierarchy

3. **Given** nested subtasks span multiple levels  
   **When** user completes leaf-level subtasks  
   **Then** progress rolls up through levels (bottom-up): sub-subtask complete → subtask progress updates → parent progress updates

4. **Given** a user tries to nest beyond 5 levels  
   **When** they attempt to add 6th level subtask  
   **Then** system shows message "Maximum nesting depth reached (5 levels). Consider breaking this into a separate parent task."

5. **Given** deeply nested tasks exist  
   **When** user views breadcrumb trail  
   **Then** full hierarchy path displays: "Project > Phase > Task > Subtask > Sub-subtask"

---

### US-13.5.3: Drag-and-Drop Subtask Management (P2)

**Why P2**: Critical for usability and user satisfaction. Keyboard-only reordering is clunky. Drag-and-drop transforms subtask management from tedious to delightful.

**Independent Test**: Create parent with 4 subtasks in order A,B,C,D. Drag B to position 3. Verify order becomes A,C,B,D. Drag D into another task. Verify D moves and both parent progress bars update.

**Acceptance Scenarios**:

1. **Given** a parent task has multiple subtasks  
   **When** user hovers over a subtask  
   **Then** drag handle icon (⋮⋮) appears on left side and cursor changes to grab cursor

2. **Given** a user grabs a subtask drag handle  
   **When** they drag it up or down within the same parent  
   **Then** other subtasks slide smoothly to make space, showing drop target indicator, and order updates on drop

3. **Given** a user is dragging a subtask  
   **When** they drag it over a different parent task  
   **Then** that parent task highlights with blue border and text "Drop here to move subtask"

4. **Given** a user drops a subtask into different parent task  
   **When** drop completes  
   **Then** subtask moves to new parent, both old and new parent progress bars update, and animation confirms the move

5. **Given** a user drags a subtask to root level (no parent)  
   **When** they drop it in the main task list (outside any parent)  
   **Then** subtask becomes a standalone parent task and relationships update

6. **Given** drag-and-drop is in progress  
   **When** user presses ESC key or drags outside valid drop zone  
   **Then** drag operation cancels, subtask returns to original position with "wiggle" animation

7. **Given** a parent task is collapsed  
   **When** user drags a subtask over it  
   **Then** parent automatically expands after 1 second hover to show subtask drop zones

---

### US-13.5.4: Subtask Quick Actions & Bulk Operations (P3)

**Why P3**: Efficiency feature for power users managing many subtasks. Not essential for launch but significantly improves UX for complex workflows.

**Independent Test**: Create parent with 10 subtasks, select 5 using checkboxes, click "Bulk Complete", verify 5 selected subtasks mark complete simultaneously and parent progress updates.

**Acceptance Scenarios**:

1. **Given** a parent task has subtasks  
   **When** user clicks "Quick Add" button  
   **Then** inline text area appears allowing rapid creation of multiple subtasks (one title per line, Enter to add next)

2. **Given** quick add mode is active  
   **When** user types multiple lines and clicks "Create All"  
   **Then** all subtasks create simultaneously with loading indicator and success confirmation showing count created

3. **Given** a parent task has multiple incomplete subtasks  
   **When** user clicks "Bulk Complete" button  
   **Then** confirmation dialog asks "Mark all X incomplete subtasks as complete?" with Yes/No options

4. **Given** user selects subtasks via checkboxes  
   **When** they use bulk action menu  
   **Then** options display: Complete Selected, Delete Selected, Change Priority, Set Due Date, Move to Another Task

5. **Given** subtasks are selected  
   **When** user applies bulk action (e.g., Change Priority to High)  
   **Then** all selected subtasks update simultaneously with undoable action and toast notification

6. **Given** a parent task has many subtasks  
   **When** user right-clicks on parent task  
   **Then** context menu includes: "Complete All Subtasks", "Delete All Subtasks", "Expand/Collapse All", "Convert to Checklist"

---

### US-13.5.5: Subtask Progress Visualization (P2)

**Why P2**: Essential for at-a-glance understanding of project status. Users need immediate visual feedback on complex task completion without opening details.

**Independent Test**: Create task with 10 subtasks, complete 3, verify task list shows mini progress bar with "30%" and "3/10" label visible without opening task.

**Acceptance Scenarios**:

1. **Given** a task has subtasks  
   **When** displayed in task list view  
   **Then** horizontal progress bar appears below task title showing percentage complete with color gradient (red → yellow → green)

2. **Given** a parent task has mixed subtask states  
   **When** viewed in task list  
   **Then** task shows icon badge indicating subtask count and fractional completion "○ 3/7" with badge color matching progress (grey <33%, yellow 33-66%, green >66%)

3. **Given** a parent task is expanded  
   **When** user views subtask list  
   **Then** each subtask shows its own mini icon if it has nested subtasks, creating visual hierarchy

4. **Given** a task with subtasks appears on dashboard  
   **When** in "Today" or "Upcoming" widget  
   **Then** progress ring or bar displays around/below the task card for quick status check

5. **Given** a user hovers over parent task progress bar  
   **When** cursor is over the bar  
   **Then** tooltip displays: "3 of 7 subtasks complete (43%), 2 overdue, 1 due today, 4 upcoming"

6. **Given** subtasks have different priorities  
   **When** viewing parent task detail  
   **Then** subtask list can be grouped by priority or due date showing section headers with mini progress bars

7. **Given** subtask completion changes  
   **When** user marks subtask complete/incomplete  
   **Then** parent task progress bar animates smoothly to new percentage with number counting up/down

---

## Additional Requirements & Considerations

### Data Model Requirements

**Subtask Relationship**:
- Self-referential `ParentTaskId` field on Task entity (nullable, foreign key to Task.Id)
- `TaskHierarchy` helper class for efficient tree queries
- Index on `ParentTaskId` for fast subtask lookups
- `Depth` field to enforce maximum nesting (5 levels)
- `Order` field within parent for user-defined sequencing

**Computed Fields**:
- `SubtaskCount` (total number of direct children)
- `CompletedSubtaskCount` (completed direct children)
- `HasSubtasks` (boolean, true if SubtaskCount > 0)
- `ProgressPercentage` (CompletedSubtaskCount / SubtaskCount * 100)

**Deletion Behavior**:
- Cascade delete: Deleting parent deletes all subtasks (configurable)
- Orphan mode: Deleting parent promotes subtasks to root level (user choice)
- Soft delete: Mark as deleted but retain for recovery (recommended)

### API Endpoints

**New Endpoints**:
- `POST /api/tasks/{id}/subtasks` - Create subtask under parent
- `GET /api/tasks/{id}/subtasks` - List all subtasks (with ?depth=all for full tree)
- `PUT /api/tasks/{id}/reorder` - Reorder subtasks (accepts array of IDs)
- `PUT /api/tasks/{id}/move` - Move subtask to different parent (or root)
- `POST /api/tasks/{id}/subtasks/bulk` - Create multiple subtasks at once
- `PUT /api/tasks/{id}/subtasks/bulk-complete` - Mark all subtasks complete

**Modified Endpoints**:
- `GET /api/tasks` - Include `hasSubtasks`, `subtaskCount`, `progressPercentage` in response
- `GET /api/tasks/{id}` - Include full subtask tree with `?includeSubtasks=true` query param
- `DELETE /api/tasks/{id}` - Support `?deleteMode=cascade|orphan` query param

### Frontend Components

**New Components**:
- `SubtaskList.tsx` - Displays subtask tree with expand/collapse
- `SubtaskItem.tsx` - Individual subtask row with drag handle
- `SubtaskForm.tsx` - Inline creation form
- `SubtaskProgress.tsx` - Progress bar/ring component
- `SubtaskBulkActions.tsx` - Bulk operation toolbar
- `SubtaskDragLayer.tsx` - Custom drag preview
- `SubtaskQuickAdd.tsx` - Multi-line quick add form

**Modified Components**:
- `TaskItem.tsx` - Add progress bar and expand/collapse logic
- `TaskDetail.tsx` - Integrate SubtaskList component
- `TaskForm.tsx` - Add "Add Subtask" option after creation
- `Dashboard.tsx` - Show subtask progress in widgets

### Drag-and-Drop Library

**Recommendation**: Use `@dnd-kit/core` and `@dnd-kit/sortable`
- Modern, accessible, TypeScript-first
- Better performance than react-dnd
- Built-in support for nested sortable lists
- Touch-device compatible
- Customizable animations

**Alternative**: `react-beautiful-dnd` (if @dnd-kit has issues)
- Battle-tested, used by Atlassian
- Beautiful animations out of box
- More documentation/examples
- Larger bundle size

### Performance Considerations

**Query Optimization**:
- Use recursive CTE for fetching entire subtask tree in single query
- Implement pagination for parents with 50+ subtasks
- Lazy load nested subtasks (load 1 level at a time)
- Cache subtask counts and progress percentages (update on change)

**Rendering Optimization**:
- Virtualize long subtask lists (react-window/react-virtuoso)
- Memoize SubtaskItem components
- Debounce drag-and-drop reorder API calls (300ms)
- Use optimistic UI updates for instant feedback

**Database**:
- Index on (ParentTaskId, Order) for fast sorted retrieval
- Index on (ParentTaskId, Completed) for progress calculations
- Consider materialized path or nested set model for deep hierarchies (if performance issues)

### UI/UX Guidelines

**Visual Hierarchy**:
- Indentation: 20px per level (max 100px for 5 levels)
- Connecting lines: Subtle grey vertical/horizontal lines showing structure
- Font size: Reduce by 1px per level (14px → 13px → 12px, minimum 12px)
- Opacity: Slight fade for deeper levels (100% → 95% → 90%)

**Colors & Indicators**:
- Progress bar: 0-33% red, 33-66% yellow, 66-100% green
- Overdue subtask: Red dot indicator
- Subtask count badge: Circle with number, colored by progress
- Drag handle: Grey when idle, blue when dragging

**Animations**:
- Expand/collapse: 200ms ease-out
- Drag-and-drop: 150ms ease-in-out
- Progress bar changes: 300ms ease-out with number counting
- Subtask creation: Fade-in 200ms

**Accessibility**:
- Keyboard navigation: Tab through subtasks, Enter to expand/collapse
- Screen readers: Announce "Task with 3 subtasks, 2 complete"
- Drag alternative: Move up/down buttons for keyboard users
- Focus indicators: Clear blue outline on focused subtask

### Mobile Considerations

**Touch Interactions**:
- Long press to activate drag mode (500ms)
- Swipe left/right for quick actions (complete, delete)
- Tap to expand/collapse (no separate icon tap)
- Pull-to-refresh after reordering

**Responsive Layout**:
- Reduce indentation to 12px per level on mobile
- Stack progress bar below task title on narrow screens
- Use bottom sheet for subtask detail instead of modal
- Floating action button (FAB) for "Add Subtask"

**Gestures**:
- Swipe right on parent: Expand all subtasks
- Swipe left on parent: Collapse all subtasks
- Two-finger tap: Enter bulk selection mode
- Pinch: Collapse/expand hierarchy (experimental)

### Edge Cases & Error Handling

**Circular Dependencies**:
- Prevent task from becoming subtask of itself
- Prevent task from becoming subtask of its own descendant
- Validate on backend: Check if target parent is in current task's subtree

**Orphaned Subtasks**:
- If parent deleted with cascade disabled, subtasks become root tasks
- Show notification: "3 subtasks promoted to main task list"
- Provide undo option to restore parent and hierarchy

**Incomplete Parent/Complete Subtasks**:
- If all subtasks complete but parent incomplete, show suggestion badge
- If parent complete but subtasks incomplete, show warning icon
- Allow users to configure auto-complete behavior in settings

**Deep Nesting**:
- Warn at 4 levels: "Consider breaking this into separate tasks"
- Block at 5 levels: "Maximum depth reached"
- Provide "Convert to Parent Task" button on deep subtasks

**Large Subtask Count**:
- Paginate at 50 subtasks per parent
- Show "Load More" button or infinite scroll
- Provide "Show All" option with warning for 100+

**Concurrent Edits**:
- Optimistic UI updates for snappy UX
- Websocket/polling for real-time sync in multi-device scenarios
- Conflict resolution: Last write wins with toast notification

### Testing Strategy

**Unit Tests**:
- Subtask creation with valid/invalid parents
- Progress calculation with various completion states
- Drag-and-drop reorder logic
- Circular dependency detection
- Depth validation (max 5 levels)

**Integration Tests**:
- API endpoints for subtask CRUD operations
- Cascade delete vs orphan behavior
- Bulk operations (create, complete, delete)
- Tree traversal queries (recursive CTE)
- Move subtask between parents

**E2E Tests**:
- Create parent → add 3 subtasks → complete 2 → verify progress
- Drag subtask to reorder within parent
- Drag subtask to different parent
- Expand/collapse subtask tree
- Quick add multiple subtasks
- Bulk complete all subtasks
- Delete parent with cascade/orphan modes

**Performance Tests**:
- Load parent with 100 subtasks (<500ms)
- Render 500 tasks with subtasks in list view (<1s)
- Drag-and-drop with 50 subtasks (smooth 60fps)
- Recursive query for 5-level deep tree (<100ms)

**Accessibility Tests**:
- Keyboard-only subtask management
- Screen reader announces hierarchy correctly
- Focus order follows visual order
- Drag alternative (buttons) works without mouse

### Privacy & Security

**Authorization**:
- Users can only create subtasks under their own tasks
- Subtasks inherit parent task permissions
- Moving subtask verifies user owns both old and new parent

**Rate Limiting**:
- Bulk subtask creation: Max 100 subtasks per request
- Reordering: Max 1 request per second per user
- Prevent abuse of recursive queries

**Data Validation**:
- Subtask title: Non-empty, max 500 chars
- Parent ID: Must exist and belong to user
- Depth: Must not exceed 5 levels
- Order: Positive integer

---

## Success Metrics

**Adoption KPIs**:
- 40%+ of tasks have at least 1 subtask within 30 days
- 20%+ of power users use 3+ levels of nesting
- Average 3-5 subtasks per parent task
- 70%+ of subtasks completed before parent completion

**Usability Metrics**:
- Drag-and-drop success rate >95% (drop in intended location)
- Average time to create subtask <10 seconds
- Expand/collapse interaction <2 clicks
- <5% of users hit 5-level depth limit

**Performance Metrics**:
- Subtask list render time <300ms for 50 subtasks
- Drag operation maintains 60fps
- Progress bar updates within 100ms of subtask state change
- Recursive tree query <100ms for 5-level hierarchy

**Business Impact**:
- Increase task completion rate by 15% (smaller subtasks are easier to complete)
- Reduce average task duration (breaking work into steps reduces procrastination)
- Increase user engagement (more frequent interactions with subtasks)
- Reduce support tickets about organizing complex projects

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Database schema changes
- Basic API endpoints (create, list, delete)
- Simple subtask list display (no drag-and-drop yet)
- Progress calculation logic

### Phase 2: Core UI (Week 2)
- SubtaskList and SubtaskItem components
- Expand/collapse functionality
- Inline subtask creation form
- Progress bar visualization
- Basic keyboard navigation

### Phase 3: Drag-and-Drop (Week 3)
- Integrate @dnd-kit library
- Reorder within parent
- Move between parents
- Promote to root level
- Drag animations and previews

### Phase 4: Advanced Features (Week 4)
- Nested subtasks (multi-level)
- Quick add (multi-line input)
- Bulk operations (complete all, delete all)
- Mobile touch gestures
- Accessibility enhancements

### Phase 5: Polish & Testing (Week 5)
- Performance optimization
- Comprehensive test suite
- User documentation
- Admin controls (enable/disable feature)
- Migration for existing tasks

---

## Open Questions

1. **Auto-completion behavior**: Should parent auto-complete when all subtasks complete be default ON or OFF? Survey users?
2. **Maximum subtask count**: Should we limit to 100 subtasks per parent? What's reasonable?
3. **Subtask templates**: Should users be able to save/reuse common subtask lists (e.g., "Website Launch" template)?
4. **Subtask due dates**: Should subtasks inherit parent due date by default? Override capability?
5. **Progress calculation**: Include nested subtasks in progress or only direct children?
6. **Calendar integration**: Should subtasks appear as separate calendar items or grouped under parent?
7. **Notifications**: Notify when subtask due date approaches, or only when all subtasks complete?
8. **Search**: Should search results show parent task when subtask matches, or show matched subtask directly?

---

## Related Specifications

- Phase 4: Basic Task Management - Foundation for subtask functionality
- Phase 8: Task Groups - Similar hierarchical structuring (groups vs subtasks)
- Phase 12: Calendar View - Subtasks need calendar representation
- Phase 17: Advanced Reporting - Subtask completion metrics for reports
- Phase 24: Usage Analytics - Track subtask feature adoption

---

## Migration Plan

### Existing Tasks
- All current tasks become potential parent tasks (ParentTaskId = NULL)
- Add database columns: ParentTaskId, Depth, Order, HasSubtasks
- Run migration to index existing tasks
- No breaking changes to existing functionality

### Rollout Strategy
1. **Beta to 10% users**: Enable subtasks feature flag
2. **Collect feedback**: Survey UX, performance, bugs
3. **Iterate**: Fix issues, improve UX based on feedback
4. **Full release**: Enable for 100% of users
5. **Documentation**: Update help docs, create video tutorials
6. **Marketing**: Announce feature in newsletter, blog post

### Backward Compatibility
- Tasks without subtasks behave identically to current implementation
- API endpoints maintain existing contracts
- Frontend gracefully handles tasks with/without subtasks
- Mobile app updates to support subtasks (or hide feature if unsupported version)

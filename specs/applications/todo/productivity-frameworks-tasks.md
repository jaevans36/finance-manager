# Productivity Frameworks — Task Breakdown

> Phases 55-57: Task Status & WIP Limits, Eisenhower Matrix, Energy Tagging & Smart Suggestions  
> Task IDs: T1389-T1487 (99 tasks)  
> Estimated total effort: ~6 weeks

---

## Phase 55: Task Status & WIP Limits (Priority: P2)

**Purpose**: Replace the binary complete/incomplete task model with a richer status workflow (Not Started → In Progress → Blocked → Completed), add user-configurable WIP limits to enforce focus, and create a Kanban board view.

**Estimated Effort**: 2.5 weeks (37 tasks)

**Dependencies**: None — this is foundational for Phases 56-57

### Backend: Task Status (Week 1, Days 1-2)

- [ ] T1389 [P] [US-55.1] Create `TaskStatus` enum (`NotStarted`, `InProgress`, `Blocked`, `Completed`) in `Features/Tasks/Models/Task.cs` - 1h
- [ ] T1390 [US-55.1] Add `Status`, `StartedAt`, `BlockedReason` fields to `Task` entity - 1h
- [ ] T1391 [US-55.1] Create EF Core migration: add Status (default NotStarted), StartedAt, BlockedReason columns + composite index `(UserId, Status)` - 2h
- [ ] T1392 [US-55.1] Write data migration: set `Status = Completed` for all existing `Completed = true` tasks, `NotStarted` for all others - 1h
- [ ] T1393 [US-55.1] Update `TaskDto` to include `Status`, `StartedAt`, `BlockedReason` fields - 1h
- [ ] T1394 [US-55.1] Create `UpdateTaskStatusRequest` DTO with validation (valid transitions, BlockedReason required when blocking) - 1h
- [ ] T1395 [US-55.1] Add `UpdateTaskStatusAsync` method to `ITaskService`/`TaskService` — validates state transitions, syncs `Completed` boolean, sets `StartedAt`/`CompletedAt` timestamps - 3h
- [ ] T1396 [US-55.1] Add `PATCH /api/v1/tasks/{id}/status` endpoint to `TasksController` - 2h
- [ ] T1397 [US-55.1] Update existing `UpdateTaskAsync` to sync Status when `Completed` field changes (backward compat) - 1h
- [ ] T1398 [US-55.1] Update `GetTasksAsync` to support `?status=InProgress` filter parameter - 1h
- [ ] T1399 [US-55.1] Write unit tests for `TaskService.UpdateTaskStatusAsync` — valid transitions, invalid transitions, timestamp logic, backward compat sync - 3h
- [ ] T1400 [US-55.1] Write integration tests for status endpoint — PATCH, filter by status, migration correctness - 3h

### Backend: User Settings & WIP Limits (Week 1, Days 3-5)

- [ ] T1401 [P] [US-55.3] Create `UserSettings` entity with `WipLimit`, `WipEnforcement`, `ShowWipCounter`, `Preferences` (JSON) fields - 1h
- [ ] T1402 [US-55.3] Add `UserSettings` DbSet, entity configuration, and migration - 2h
- [ ] T1403 [US-55.3] Create `IUserSettingsService`/`UserSettingsService` with `GetOrCreateSettingsAsync`, `UpdateSettingsAsync` - 3h
- [ ] T1404 [US-55.3] Create `SettingsController` with `GET /api/v1/settings` and `PUT /api/v1/settings` endpoints - 2h
- [ ] T1405 [US-55.2] Add optional `WipLimit` field to `TaskGroup` entity + migration - 1h
- [ ] T1406 [US-55.2] Create `IWipService`/`WipService` — `GetWipSummaryAsync` (global + per-group counts), `ValidateWipAsync` (check limits before status change) - 3h
- [ ] T1407 [US-55.2] Add `GET /api/v1/tasks/wip-summary` endpoint - 1h
- [ ] T1408 [US-55.2] Integrate WIP validation into `UpdateTaskStatusAsync` — return WIP warning/block when limit exceeded - 2h
- [ ] T1409 [US-55.2] Update `UpdateTaskGroupRequest` DTO to accept optional `WipLimit` - 1h
- [ ] T1410 [US-55.3] Write unit tests for `UserSettingsService` — defaults, persistence, validation - 2h
- [ ] T1411 [US-55.2] Write unit tests for `WipService` — global limits, group limits, soft/hard enforcement - 3h
- [ ] T1412 [US-55.2] Write integration tests for settings and WIP endpoints - 3h

### Frontend: Task Status UI (Week 2, Days 1-3)

- [ ] T1413 [P] [US-55.1] Add `TaskStatus` type and update `Task` interface in `taskService.ts` - 1h
- [ ] T1414 [P] [US-55.1] Create `StatusBadge` component — colour-coded badge (grey/blue/amber/green) with status text - 2h
- [ ] T1415 [US-55.1] Create `StatusSelector` component — dropdown or button group to change task status - 2h
- [ ] T1416 [US-55.1] Add `updateTaskStatus` method to `taskService.ts` — `PATCH /tasks/{id}/status` - 1h
- [ ] T1417 [US-55.1] Integrate `StatusBadge` into `TaskItem` component — display current status - 2h
- [ ] T1418 [US-55.1] Integrate `StatusSelector` into `TaskDetailModal` — allow status changes with transition validation - 2h
- [ ] T1419 [US-55.1] Add status filter to `TasksPage` — filter bar with multi-select status chips - 2h
- [ ] T1420 [US-55.1] Update `CreateTaskForm` to optionally set initial status (default: Not Started) - 1h

### Frontend: WIP Limits UI (Week 2, Days 3-5)

- [ ] T1421 [P] [US-55.3] Create `settingsService.ts` — `getSettings`, `updateSettings` API methods - 1h
- [ ] T1422 [P] [US-55.2] Create `WipCounter` component — "Active: 2/3" with colour coding (green/amber/red) - 2h
- [ ] T1423 [US-55.2] Create `WipLimitWarningModal` — shows current in-progress tasks, "Go Back" / "Start Anyway" buttons - 3h
- [ ] T1424 [US-55.2] Integrate WIP validation into `StatusSelector` — check limits before allowing "In Progress" - 2h
- [ ] T1425 [US-55.2] Add `WipCounter` to page header/dashboard layout - 1h
- [ ] T1426 [US-55.3] Create `ProductivitySettings` page/section — WIP limit input, enforcement toggle, show counter toggle - 3h
- [ ] T1427 [US-55.2] Add group-level WIP limit setting to `TaskGroupItem` edit form - 1h

### Frontend: Kanban Board View (Week 3, Days 1-2)

- [ ] T1428 [P] [US-55.4] Create `KanbanBoard` component — 4-column layout with status headers and task counts - 4h
- [ ] T1429 [US-55.4] Create `KanbanColumn` component — droppable column with task cards, empty state - 2h
- [ ] T1430 [US-55.4] Create `KanbanCard` component — compact task card with priority badge, due date, group colour - 2h
- [ ] T1431 [US-55.4] Add drag-and-drop functionality using `@dnd-kit/core` — status updates on drop with WIP validation - 3h
- [ ] T1432 [US-55.4] Add list/board view toggle to `TasksPage` — persist preference in localStorage - 1h
- [ ] T1433 [US-55.4] Ensure filters (group, priority, status) apply to both list and board views - 1h

### Testing: Phase 55 (Week 3, Days 3-5)

- [ ] T1434 [US-55.1] Write Jest tests for `StatusBadge` and `StatusSelector` components - 2h
- [ ] T1435 [US-55.2] Write Jest tests for `WipCounter` and `WipLimitWarningModal` components - 2h
- [ ] T1436 [US-55.4] Write Jest tests for `KanbanBoard`, `KanbanColumn`, `KanbanCard` components - 3h
- [ ] T1437 [US-55.3] Write Jest tests for `ProductivitySettings` page - 2h
- [ ] T1438 Write E2E test: task status workflow (create → in progress → blocked → unblock → complete) - 3h
- [ ] T1439 Write E2E test: WIP limit enforcement (reach limit → warning → start anyway → complete → under limit) - 3h
- [ ] T1440 Write E2E test: Kanban board drag-and-drop status changes - 3h

**Checkpoint**: Tasks display rich status. Users can configure WIP limits. Kanban board view works with drag-and-drop. All existing tests still pass. Status changes sync with legacy Completed boolean.

---

## Phase 56: Eisenhower Matrix (Priority: P2)

**Purpose**: Add Urgency and Importance dimensions to tasks and provide a visual 2x2 matrix view for triage. Auto-suggest classifications based on existing Priority and DueDate data.

**Estimated Effort**: 2 weeks (32 tasks)

**Dependencies**: Phase 55 must be complete (Status field used in matrix interactions)

### Backend: Classification Fields (Week 1, Days 1-2)

- [ ] T1441 [P] [US-56.1] Create `UrgencyLevel` and `ImportanceLevel` enums in `Features/Tasks/Models/Task.cs` - 1h
- [ ] T1442 [US-56.1] Add nullable `Urgency` and `Importance` fields to `Task` entity - 1h
- [ ] T1443 [US-56.1] Create EF Core migration: add Urgency, Importance columns + composite index `(UserId, Urgency, Importance)` - 1h
- [ ] T1444 [US-56.1] Update `TaskDto` to include `Urgency`, `Importance`, computed `Quadrant` (Q1-Q4 or null) - 1h
- [ ] T1445 [US-56.1] Create `ClassifyTaskRequest` DTO with Urgency/Importance validation - 1h
- [ ] T1446 [US-56.1] Add `ClassifyTaskAsync` method to `ITaskService`/`TaskService` - 2h
- [ ] T1447 [US-56.1] Add `PATCH /api/v1/tasks/{id}/classify` endpoint - 1h
- [ ] T1448 [US-56.1] Add `POST /api/v1/tasks/bulk-classify` endpoint with batch validation - 2h
- [ ] T1449 [US-56.2] Add `GET /api/v1/tasks/matrix` endpoint — returns tasks grouped by quadrant + unclassified - 2h

### Backend: Auto-suggestion Engine (Week 1, Days 3-4)

- [ ] T1450 [P] [US-56.3] Create `IClassificationSuggestionService`/`ClassificationSuggestionService` — suggest urgency/importance based on Priority + DueDate rules - 3h
- [ ] T1451 [US-56.3] Add `GET /api/v1/tasks/{id}/suggest-classification` endpoint — returns suggested Urgency, Importance, Quadrant, and reasoning text - 1h
- [ ] T1452 [US-56.3] Add `POST /api/v1/tasks/auto-classify` endpoint — preview bulk suggestions for all unclassified tasks - 2h

### Backend: Testing (Week 1, Day 5)

- [ ] T1453 [US-56.1] Write unit tests for `ClassifyTaskAsync` — valid values, null handling, quadrant computation - 2h
- [ ] T1454 [US-56.3] Write unit tests for `ClassificationSuggestionService` — all Priority×DueDate combinations, edge cases - 3h
- [ ] T1455 [US-56.1] Write integration tests for classify, bulk-classify, and matrix endpoints - 3h

### Frontend: Classification UI (Week 2, Days 1-2)

- [ ] T1456 [P] [US-56.1] Add `UrgencyLevel`, `ImportanceLevel`, `Quadrant` types to `Task` interface - 1h
- [ ] T1457 [P] [US-56.1] Create `QuadrantBadge` component — small Q1/Q2/Q3/Q4 indicator with colour coding - 2h
- [ ] T1458 [US-56.1] Create `ClassificationPicker` component — dual-axis selector for Urgency and Importance (2×3 grid or dual sliders) - 3h
- [ ] T1459 [US-56.1] Add `classifyTask`, `bulkClassifyTasks`, `getMatrixTasks`, `getSuggestion` to `taskService.ts` - 2h
- [ ] T1460 [US-56.1] Integrate `QuadrantBadge` into `TaskItem` component — display alongside priority badge - 1h
- [ ] T1461 [US-56.1] Integrate `ClassificationPicker` into `TaskDetailModal` with auto-suggestion display - 2h
- [ ] T1462 [US-56.3] Create `AutoSuggestionChip` component — shows suggested classification with "Accept" / "Override" actions - 2h

### Frontend: Matrix View (Week 2, Days 3-4)

- [ ] T1463 [P] [US-56.2] Create `EisenhowerMatrixPage` with responsive 2×2 grid layout - 4h
- [ ] T1464 [US-56.2] Create `MatrixQuadrant` component — card container with header (Q1-Q4 label + action name), task list, colour theme - 3h
- [ ] T1465 [US-56.2] Create `MatrixTaskCard` component — compact card with title, priority, due date, group colour, status badge - 2h
- [ ] T1466 [US-56.2] Add drag-and-drop between quadrants using `@dnd-kit/core` — update Urgency/Importance on drop - 3h
- [ ] T1467 [US-56.2] Create `UnclassifiedSection` component — overflow area for tasks without Urgency/Importance set, with "Classify Now" quick-action - 2h
- [ ] T1468 [US-56.2] Add group and priority filters to Matrix page — filter all quadrants simultaneously - 1h
- [ ] T1469 [US-56.2] Add Matrix page to app router and navigation (icon: Grid/LayoutGrid from Lucide) - 1h

### Testing: Phase 56 (Week 2, Day 5)

- [ ] T1470 [US-56.1] Write Jest tests for `QuadrantBadge`, `ClassificationPicker`, `AutoSuggestionChip` - 2h
- [ ] T1471 [US-56.2] Write Jest tests for `EisenhowerMatrixPage`, `MatrixQuadrant`, `MatrixTaskCard` — rendering, filtering, empty states - 3h
- [ ] T1472 Write E2E test: classify a task via detail modal, verify it appears in correct matrix quadrant, drag to different quadrant - 3h

**Checkpoint**: Tasks have optional Urgency/Importance fields. Eisenhower Matrix page shows 4 quadrants. Drag-and-drop classification works. Auto-suggestion engine proposes classifications. Unclassified tasks have a clear path to being classified.

---

## Phase 57: Energy Tagging & Smart Suggestions (Priority: P2)

**Purpose**: Add energy level and estimated duration fields to tasks, build a "What Can I Do Now?" suggestion panel that matches tasks to current capacity.

**Estimated Effort**: 1.5 weeks (30 tasks)

**Dependencies**: Phase 55 (Status field for filtering). Phase 56 optional (Eisenhower data enriches suggestions).

### Backend: Energy & Duration Fields (Week 1, Days 1-2)

- [ ] T1473 [P] [US-57.1] Create `EnergyLevel` enum (`Low`, `Medium`, `High`) in `Features/Tasks/Models/Task.cs` - 1h
- [ ] T1474 [US-57.1] Add nullable `EnergyLevel` and `EstimatedMinutes` fields to `Task` entity - 1h
- [ ] T1475 [US-57.1] Create EF Core migration: add EnergyLevel, EstimatedMinutes columns + indexes - 1h
- [ ] T1476 [US-57.1] Update `TaskDto`, `CreateTaskRequest`, `UpdateTaskRequest` to include new fields - 1h
- [ ] T1477 [US-57.1] Add `PATCH /api/v1/tasks/{id}/energy` and `PATCH /api/v1/tasks/{id}/estimate` endpoints - 1h
- [ ] T1478 [US-57.1] Add `POST /api/v1/tasks/bulk-energy` endpoint for bulk energy tagging - 1h

### Backend: Suggestions Engine (Week 1, Days 2-3)

- [ ] T1479 [P] [US-57.3] Create `ISuggestionService`/`SuggestionService` — filter by energy level, max duration, status (not completed), sort by Urgency → DueDate → Priority - 3h
- [ ] T1480 [US-57.3] Add `GET /api/v1/tasks/suggestions?energy=Low&maxMinutes=30` endpoint - 2h
- [ ] T1481 [US-57.4] Add `GET /api/v1/statistics/energy-distribution` endpoint — count by energy level, completion rates per level - 2h

### Backend: Testing (Week 1, Days 4-5)

- [ ] T1482 [US-57.1] Write unit tests for energy/duration field handling — validation, null behaviour, filter combinations - 2h
- [ ] T1483 [US-57.3] Write unit tests for `SuggestionService` — energy filtering, time filtering, sort order, edge cases (no results, no tags) - 3h
- [ ] T1484 [US-57.1] Write integration tests for energy, estimate, bulk-energy, suggestions, and distribution endpoints - 3h

### Frontend: Energy Tagging UI (Week 2, Days 1-2)

- [ ] T1485 [P] [US-57.1] Add `EnergyLevel`, `EstimatedMinutes` to `Task` interface and service methods - 1h
- [ ] T1486 [P] [US-57.1] Create `EnergyBadge` component — colour-coded dot/icon (red=High, amber=Medium, green=Low) - 1h
- [ ] T1487 [US-57.1] Create `EnergySelector` component — 3-button toggle (High/Medium/Low) with descriptions - 2h
- [ ] T1488 [US-57.2] Create `DurationInput` component — preset buttons (15m, 30m, 1h, 2h, 4h) + custom input - 2h
- [ ] T1489 [US-57.1] Integrate `EnergyBadge` into `TaskItem` component - 1h
- [ ] T1490 [US-57.1] Integrate `EnergySelector` and `DurationInput` into `TaskDetailModal` and `CreateTaskForm` - 2h
- [ ] T1491 [US-57.1] Add energy level filter to `TasksPage` filter bar - 1h

### Frontend: Smart Suggestions Panel (Week 2, Days 3-4)

- [ ] T1492 [P] [US-57.3] Create `WhatCanIDoPanel` component — slide-in panel with energy and time selectors - 4h
- [ ] T1493 [US-57.3] Create `SuggestionCard` component — task card with "Start This" action button - 2h
- [ ] T1494 [US-57.3] Create `EmptySuggestions` component — helpful alternatives when no tasks match - 1h
- [ ] T1495 [US-57.3] Add `getSuggestions` method to `taskService.ts` - 1h
- [ ] T1496 [US-57.3] Add "What Can I Do Now?" button to main navigation/header - 1h
- [ ] T1497 [US-57.3] Integrate with WIP limits (Phase 55): show in-progress tasks first, respect WIP when starting - 2h
- [ ] T1498 [US-57.3] Persist last energy + time selection in localStorage - 1h

### Frontend: Dashboard Widget (Week 2, Day 4)

- [ ] T1499 [US-57.4] Create `EnergyDistributionWidget` component — doughnut chart showing task breakdown by energy level - 2h
- [ ] T1500 [US-57.4] Add widget to dashboard page alongside existing statistics widgets - 1h

### Testing: Phase 57 (Week 2, Day 5)

- [ ] T1501 [US-57.1] Write Jest tests for `EnergyBadge`, `EnergySelector`, `DurationInput` components - 2h
- [ ] T1502 [US-57.3] Write Jest tests for `WhatCanIDoPanel`, `SuggestionCard`, `EmptySuggestions` — selection, filtering, empty states - 3h
- [ ] T1503 Write E2E test: tag tasks with energy + duration → open "What Can I Do Now?" → verify filtering → start a task - 3h

**Checkpoint**: Tasks can be tagged with energy level and estimated duration. "What Can I Do Now?" panel suggests tasks matching current capacity. Energy distribution widget shows on dashboard. Suggestions integrate with WIP limits and Eisenhower classification.

---

## Phase Dependencies

```
Phase 55 (Task Status & WIP Limits) ─── foundational ──→ Phase 56 (Eisenhower Matrix)
     │                                                         │
     └──────────────────────── foundational ──→ Phase 57 (Energy Tagging)
                                                               │
                                              Phase 56 enriches ┘ (optional: urgency sort)
```

- **Phase 55** must be complete before 56 or 57 (Status field is required)
- **Phase 56 and 57** can run in parallel after Phase 55, but 57's suggestion sort is enriched if 56's Urgency/Importance data exists
- Recommended order: 55 → 56 → 57

---

## Effort Summary

| Phase | Tasks | Backend | Frontend | Testing | Total |
|-------|-------|---------|----------|---------|-------|
| 55 — Task Status & WIP Limits | 52 tasks | ~35h | ~32h | ~18h | ~2.5 weeks |
| 56 — Eisenhower Matrix | 32 tasks | ~20h | ~26h | ~8h | ~2 weeks |
| 57 — Energy Tagging | 31 tasks | ~15h | ~22h | ~8h | ~1.5 weeks |
| **Total** | **115 tasks** | **~70h** | **~80h** | **~34h** | **~6 weeks** |

---

## Success Criteria

### Phase 55
- [ ] Tasks have 4 statuses with validated state transitions
- [ ] WIP limits are configurable per user and per group
- [ ] Kanban board view with drag-and-drop
- [ ] Existing `Completed` boolean stays in sync with `Status`
- [ ] All pre-existing 300 tests still pass
- [ ] 18+ new tests across unit, integration, and E2E

### Phase 56
- [ ] Tasks can be classified by Urgency and Importance (both optional)
- [ ] Eisenhower Matrix page displays 4 quadrants with drag-and-drop
- [ ] Auto-suggestion engine proposes classifications based on Priority + DueDate
- [ ] Unclassified tasks have clear CTA to classify
- [ ] 8+ new tests

### Phase 57
- [ ] Tasks can be tagged with energy level and estimated duration
- [ ] "What Can I Do Now?" panel filters by energy + time
- [ ] Suggestions integrate with Status (Phase 55) and optionally Eisenhower (Phase 56)
- [ ] Energy distribution dashboard widget
- [ ] 8+ new tests

---

## Future Enhancements (Not in Scope)

- **Delegation feature**: Q3 tasks could be delegated to other users (requires multi-user task sharing)
- **AI classification**: Use LLM to auto-classify tasks based on title/description semantics
- **Pomodoro integration**: Tie estimated duration to Pomodoro timer sessions
- **Energy-based scheduling**: Auto-suggest which time of day to tackle tasks based on historical energy patterns
- **Recurring task energy defaults**: Set energy level on recurring task templates

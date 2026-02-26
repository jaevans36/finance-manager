# Feature Specification: Recurring Events

**Feature ID**: `003-recurring-events`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: Events Feature (Phase 13)

## Overview

Add support for recurring events that repeat on a schedule (daily, weekly, monthly, yearly). Users need to schedule repeating appointments, meetings, or reminders without manually creating individual events.

## Rationale

Many real-world events recur on predictable schedules:
- Weekly team meetings
- Monthly bill payments
- Annual birthdays, anniversaries, holidays
- Daily medication reminders

Currently, users must create each occurrence manually, which is tedious and error-prone. Recurring events solve this with a single "parent" event that generates instances.

## User Scenarios & Testing

### User Story 1 - Create Recurring Events (Priority: P1)

**Why this priority**: Foundation feature - must exist before any recurrence functionality is useful.

**Independent Test**: Create events with different recurrence patterns, verify correct instances are generated in calendar view.

**Acceptance Scenarios**:

1. **Given** a user creating an event, **When** they select "Repeat: Daily", **Then** they see options for end date or number of occurrences
2. **Given** a user creating a weekly recurring event, **When** they select specific days (Mon, Wed, Fri), **Then** instances only appear on those weekdays
3. **Given** a user creating a monthly event on the 15th, **When** they view future months, **Then** the event appears on the 15th of each month
4. **Given** a user creating a yearly birthday event, **When** they view next year's calendar, **Then** the event appears on the same date
5. **Given** a user setting "End after 10 occurrences", **When** they view the calendar, **Then** exactly 10 instances are created and no more

### User Story 2 - Edit Recurring Events (Priority: P1)

**Why this priority**: Users must be able to modify recurring patterns or fix mistakes - essential functionality.

**Independent Test**: Edit various aspects of recurring events, verify changes apply correctly to future instances.

**Acceptance Scenarios**:

1. **Given** a recurring event, **When** user edits with "This event only", **Then** only that instance is modified (becomes exception)
2. **Given** a recurring event, **When** user edits with "This and future events", **Then** the recurrence pattern updates from that date forward
3. **Given** a recurring event, **When** user edits with "All events", **Then** all past and future instances reflect the change
4. **Given** an event with exceptions, **When** viewing the series, **Then** exceptions are visually indicated
5. **Given** a user changing weekly recurrence from Mon/Wed to Tue/Thu, **When** saved, **Then** future instances appear on correct days

### User Story 3 - Delete Recurring Events (Priority: P1)

**Why this priority**: Users need to cancel recurring events or remove individual occurrences.

**Independent Test**: Delete recurring events with different scope options, verify correct instances are removed.

**Acceptance Scenarios**:

1. **Given** a recurring event instance, **When** user deletes with "This event only", **Then** that occurrence is removed but series continues
2. **Given** a recurring event instance, **When** user deletes with "This and future events", **Then** all instances from that date forward are removed
3. **Given** a recurring event, **When** user deletes with "All events", **Then** the entire series is removed from the calendar
4. **Given** deleted occurrences, **When** viewing the calendar, **Then** those dates show no event badge
5. **Given** a series with some instances deleted, **When** user edits the series, **Then** deleted instances remain deleted

### User Story 4 - Recurrence UI/UX (Priority: P2)

**Why this priority**: Enhances usability but core functionality works without it.

**Independent Test**: Create recurring events through UI, verify all options are accessible and intuitive.

**Acceptance Scenarios**:

1. **Given** a user in the event form, **When** they click "Repeat" dropdown, **Then** they see: None, Daily, Weekly, Monthly, Yearly, Custom
2. **Given** "Custom" recurrence selected, **When** they configure pattern, **Then** a human-readable summary displays ("Every 2 weeks on Monday and Wednesday")
3. **Given** a recurring event in the calendar, **When** hovering over it, **Then** the tooltip shows recurrence pattern (🔄 Weekly)
4. **Given** a user viewing event details, **When** modal opens, **Then** recurrence information is prominently displayed
5. **Given** complex recurrence rules, **When** viewing the event, **Then** the pattern is explained in plain language

### User Story 5 - Recurrence Exceptions (Priority: P3)

**Why this priority**: Handles edge cases and real-world scenarios but not essential for MVP.

**Independent Test**: Create and manage exception instances, verify they behave independently while maintaining series relationship.

**Acceptance Scenarios**:

1. **Given** a recurring event, **When** user modifies one instance's time, **Then** that instance becomes an exception
2. **Given** an exception instance, **When** viewing the calendar, **Then** it displays with modified details but indicates it's part of a series
3. **Given** a series with exceptions, **When** user updates the series, **Then** exceptions retain their custom properties
4. **Given** an exception, **When** user clicks "Restore to series defaults", **Then** exception reverts to matching the series pattern
5. **Given** multiple exceptions in a series, **When** exporting calendar data, **Then** exceptions are preserved

## Technical Architecture

### Database Schema

```typescript
// Event entity additions
interface Event {
  // ... existing fields
  recurrenceRule: string | null; // RFC 5545 RRULE format
  recurrenceParentId: string | null; // Reference to parent series
  recurrenceDate: Date | null; // Original date for this occurrence
  isRecurrenceException: boolean; // True if this is a modified instance
}

// Example RRULE strings:
// "FREQ=DAILY;COUNT=10" - Daily for 10 occurrences
// "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261231" - Mon/Wed/Fri until Dec 31
// "FREQ=MONTHLY;BYMONTHDAY=15" - 15th of every month
// "FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=1" - June 1st every year
```

### Backend Implementation

**Service Layer** (`EventService`):
- `expandRecurrenceInstances(event, startDate, endDate)` - Generate virtual instances
- `createRecurringSeries(baseEvent, recurrenceRule)` - Create parent event
- `updateRecurrence(eventId, scope, data)` - Handle "this", "future", "all" edits
- `deleteRecurrence(eventId, scope)` - Handle scoped deletions
- Use `rrule` library for RRULE parsing and expansion

**API Endpoints** (no new endpoints needed):
- `GET /api/v1/events?startDate=X&endDate=Y` - Returns expanded instances
- `POST /api/v1/events` - Accepts recurrenceRule in request body
- `PUT /api/v1/events/{id}?scope=this|future|all` - Update with scope
- `DELETE /api/v1/events/{id}?scope=this|future|all` - Delete with scope

### Frontend Implementation

**UI Components**:
- `RecurrenceSelector` - Dropdown with preset patterns + custom option
- `RecurrenceCustomForm` - Advanced pattern configuration
- `RecurrenceSummary` - Human-readable display ("Every Monday")
- `RecurrenceEditModal` - Scope selection (this/future/all)

**State Management**:
- Calendar page fetches events with date range
- Backend expands recurrence instances on-the-fly
- Frontend treats instances as regular events
- Edit/delete operations show scope selection modal

**Libraries**:
- `rrule` (npm package) - Client-side RRULE generation and display
- Integrate with existing EventForm component

## Task Breakdown: Phase 14 - Recurring Events (5 weeks)

### Week 1: Backend Foundation (Days 1-5)

**Backend: Database Schema & Migration**
- [ ] T428 [P] Add recurrence fields to Event entity (recurrenceRule, recurrenceParentId, recurrenceDate, isRecurrenceException) - 2h
- [ ] T429 Create EF Core migration for recurrence fields - 1h
- [ ] T430 Apply migration and verify database schema - 1h

**Backend: RRULE Library Integration**
- [ ] T431 Install `Ical.Net` NuGet package for RRULE support - 1h
- [ ] T432 Create `RecurrenceHelper` utility class for RRULE parsing - 3h
- [ ] T433 Write unit tests for RecurrenceHelper (15 tests covering all patterns) - 4h

**Backend: EventService Enhancements**
- [ ] T434 Implement `ExpandRecurrenceInstances` method in EventService - 4h
- [ ] T435 Update `GetEventsAsync` to expand recurring events for date range - 3h
- [ ] T436 Write unit tests for recurrence expansion logic (10 tests) - 3h

**Checkpoint**: Backend can store and expand basic recurring events

### Week 2: Backend CRUD Operations (Days 6-10)

**Backend: Create Recurring Events**
- [ ] T437 Update `CreateEventAsync` to handle recurrenceRule parameter - 2h
- [ ] T438 Add validation for RRULE format in EventValidator - 2h
- [ ] T439 Write integration tests for creating recurring events (5 tests) - 3h

**Backend: Edit Recurring Events**
- [ ] T440 Implement `UpdateRecurrenceScope` enum (This, Future, All) - 1h
- [ ] T441 Update `UpdateEventAsync` to handle scope parameter - 4h
- [ ] T442 Implement logic for "this only" (create exception) - 3h
- [ ] T443 Implement logic for "future events" (update RRULE with UNTIL) - 3h
- [ ] T444 Implement logic for "all events" (update parent) - 2h
- [ ] T445 Write unit tests for scoped updates (12 tests) - 4h

**Backend: Delete Recurring Events**
- [ ] T446 Update `DeleteEventAsync` to handle scope parameter - 3h
- [ ] T447 Implement soft-delete for "this only" (mark as deleted exception) - 2h
- [ ] T448 Write integration tests for scoped deletions (6 tests) - 3h

**Checkpoint**: Full CRUD operations work with scope selection

### Week 3: API & Documentation (Days 11-15)

**Backend: API Endpoints**
- [ ] T449 Update EventsController POST to accept recurrenceRule - 2h
- [ ] T450 Update EventsController PUT to accept scope query parameter - 2h
- [ ] T451 Update EventsController DELETE to accept scope query parameter - 2h
- [ ] T452 Add OpenAPI documentation for recurrence parameters - 2h
- [ ] T453 Update Events.http with recurring event test scenarios (10 scenarios) - 2h

**Backend: Performance Optimization**
- [ ] T454 Add database indexes on recurrenceParentId and recurrenceDate - 1h
- [ ] T455 Implement caching for frequently accessed recurring series - 3h
- [ ] T456 Write performance tests for large recurrence expansions - 3h

**Documentation**
- [ ] T457 Write API documentation for recurring events - 2h
- [ ] T458 Document RRULE format and examples in README - 2h
- [ ] T459 Create developer guide for recurrence patterns - 2h

**Checkpoint**: API complete, documented, and performant

### Week 4: Frontend UI Components (Days 16-20)

**Frontend: TypeScript Types**
- [ ] T460 [P] Update Event interface with recurrence fields - 1h
- [ ] T461 [P] Create RecurrencePattern type and enums - 2h
- [ ] T462 [P] Create RecurrenceScope enum (This, Future, All) - 1h

**Frontend: Recurrence Selector**
- [ ] T463 Create RecurrenceSelector component with preset patterns - 4h
- [ ] T464 Create RecurrenceCustomForm for advanced patterns - 6h
- [ ] T465 Add RecurrenceSummary component for human-readable display - 3h
- [ ] T466 Integrate rrule.js library for client-side RRULE generation - 2h
- [ ] T467 Write component tests for RecurrenceSelector (8 tests) - 3h

**Frontend: EventForm Integration**
- [ ] T468 Add recurrence selector to EventForm - 3h
- [ ] T469 Update EventForm submission to include recurrenceRule - 2h
- [ ] T470 Add recurrence summary display in EventForm - 2h
- [ ] T471 Write tests for EventForm with recurrence (5 tests) - 2h

**Checkpoint**: Users can create recurring events through UI

### Week 5: Edit/Delete & Polish (Days 21-25)

**Frontend: Edit/Delete Modals**
- [ ] T472 Create RecurrenceEditModal component (This/Future/All selector) - 4h
- [ ] T473 Integrate RecurrenceEditModal into event edit flow - 3h
- [ ] T474 Create RecurrenceDeleteModal component (scope selector) - 3h
- [ ] T475 Integrate RecurrenceDeleteModal into event delete flow - 2h
- [ ] T476 Write component tests for edit/delete modals (6 tests) - 2h

**Frontend: Calendar Display**
- [ ] T477 Add recurrence indicator icon (🔄) to recurring events in calendar - 2h
- [ ] T478 Update event tooltips to show recurrence pattern - 2h
- [ ] T479 Add "Part of recurring series" badge to EventItem component - 2h
- [ ] T480 Update DayTaskListModal to group recurring instances - 3h

**Frontend: E2E Tests**
- [ ] T481 Write E2E test for creating daily recurring event - 3h
- [ ] T482 Write E2E test for creating weekly recurring event with custom days - 3h
- [ ] T483 Write E2E test for editing recurring event (all scopes) - 4h
- [ ] T484 Write E2E test for deleting recurring event (all scopes) - 3h
- [ ] T485 Write E2E test for exception instances - 3h

**Documentation & Review**
- [ ] T486 Update user guide with recurring events instructions - 2h
- [ ] T487 Create video demo of recurring events feature - 2h
- [ ] T488 Code review and refactoring - 4h
- [ ] T489 Performance testing with large recurring series - 2h

**Checkpoint**: Complete recurring events feature ready for production

## Effort Summary

**Total Tasks**: 62 tasks (T428-T489)  
**Total Estimated Time**: ~150 hours (5 weeks)  
**Priority Breakdown**:
- P1 (Must Have): 45 tasks - Core CRUD and expansion logic
- P2 (Should Have): 12 tasks - UI/UX enhancements
- P3 (Nice to Have): 5 tasks - Advanced features like exception handling

## Dependencies

- **Phase 13 (Events)**: Must be complete
- **Database**: PostgreSQL with EF Core migrations
- **Libraries**: Ical.Net (backend), rrule.js (frontend)

## Known Limitations

1. **RRULE Complexity**: Not all RFC 5545 recurrence patterns will be supported initially (e.g., BYHOUR, BYMINUTE)
2. **Timezone Handling**: Recurring events cross daylight saving time boundaries may need special handling
3. **Performance**: Very long-running series (100+ years) may need pagination
4. **Calendar View**: Only shows instances within the visible date range

## Success Criteria

- ✅ Users can create recurring events with daily, weekly, monthly, yearly patterns
- ✅ Users can edit/delete with scope selection (this, future, all)
- ✅ Calendar displays all instances correctly in date range
- ✅ Exception instances work correctly
- ✅ RRULE format is standard-compliant (RFC 5545)
- ✅ Performance is acceptable for series up to 10 years
- ✅ All tests pass (90%+ code coverage on recurrence logic)

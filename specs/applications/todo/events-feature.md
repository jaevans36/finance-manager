# Feature Specification: Events & Tasks Distinction

**Feature ID**: `002-events-feature`  
**Created**: 2026-01-07  
**Status**: Draft  
**Priority**: P2  
**Dependencies**: Calendar View (Phase 12)

## Overview

Extend the To Do application to distinguish between **Tasks** (action items to complete) and **Events** (scheduled occurrences or appointments). This feature recognises the fundamental difference between things users need to *do* versus things that are *happening*.

## Rationale

Current implementation treats everything as a "task," but users manage two distinct types of calendar items:

- **Tasks**: Action-oriented items requiring completion (e.g., "Submit report", "Call plumber")
- **Events**: Time-based occurrences requiring attendance or awareness (e.g., "Team meeting", "Doctor's appointment", "Birthday party")

Conflating these creates UX friction where users must track completion status for non-completable items or vice versa.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Events (Priority: P1)

Users need to create time-based events with start/end times, distinguishing them from tasks that require completion.

**Why this priority**: Foundation for events functionality - must be able to create events before any other event features are meaningful.

**Independent Test**: Create events with various configurations (all-day, timed, recurring), verify they appear in calendar and lists with correct time information.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new event with title, date, and time, **Then** the event appears in their calendar with time displayed
2. **Given** a user creating an event, **When** they specify start and end times, **Then** the event shows duration and time span
3. **Given** a user creating an event, **When** they mark it as "all-day", **Then** the event displays without specific times
4. **Given** a user creating an event, **When** they add a location, **Then** the location is displayed alongside event details

---

### User Story 2 - Visual Distinction (Priority: P2)

Users need clear visual differentiation between tasks and events in all views to quickly understand the nature of each item.

**Why this priority**: Without visual distinction, the feature provides no value - users won't know which items are tasks vs events.

**Independent Test**: Create mix of tasks and events, verify distinct visual indicators (icons, colours, styling) appear consistently across calendar, dashboard, and list views.

**Acceptance Scenarios**:

1. **Given** a user viewing the calendar, **When** they see a day with both tasks and events, **Then** events display with distinct visual styling (icon, colour, or badge)
2. **Given** a user viewing the dashboard task list, **When** tasks and events are displayed together, **Then** events show a calendar icon or badge to distinguish them
3. **Given** a user viewing an event detail, **When** the modal opens, **Then** the header clearly indicates "Event" rather than "Task"
4. **Given** colour-blind users, **When** they view mixed tasks and events, **Then** distinction relies on icons or patterns, not colour alone

---

### User Story 3 - Event-Specific Properties (Priority: P2)

Events have different metadata requirements than tasks: start/end times, location, attendees, rather than priority/completion status.

**Why this priority**: Events need proper data structure to provide value - without time and location context, they're no different from tasks.

**Independent Test**: Create events with various properties (times, location, notes), edit these properties, verify they persist and display correctly.

**Acceptance Scenarios**:

1. **Given** a user creating an event, **When** they specify start and end times, **Then** the duration is calculated and displayed (e.g., "2 hours")
2. **Given** a user viewing an event, **When** the detail modal opens, **Then** event-specific fields (time, location) are shown, and task-specific fields (priority, completion) are hidden
3. **Given** a user editing an event, **When** they change the time, **Then** calendar display updates to reflect new timing
4. **Given** a user with overlapping events, **When** they view the calendar day, **Then** conflicts are visually indicated

---

### User Story 4 - Filtering & Sorting (Priority: P3)

Users need to filter calendar views to show only tasks, only events, or both, and sort by relevant criteria for each type.

**Why this priority**: As users accumulate items, filtering becomes essential for focused views, but depends on core create/display functionality.

**Independent Test**: Create multiple tasks and events, apply filters (show only tasks, only events, both), verify correct items display and counts update.

**Acceptance Scenarios**:

1. **Given** a user viewing the calendar, **When** they toggle "Show Tasks" filter, **Then** only task indicators appear on calendar dates
2. **Given** a user viewing the calendar, **When** they toggle "Show Events" filter, **Then** only event indicators appear on calendar dates
3. **Given** a user viewing the dashboard, **When** they filter by "Events", **Then** the task list shows only scheduled events sorted by date/time
4. **Given** a user with events and tasks, **When** they view statistics, **Then** separate counts for tasks and events are displayed

---

### User Story 5 - Event Notifications & Reminders (Priority: P4)

Users need advance reminders for upcoming events to ensure they don't miss appointments or scheduled occurrences.

**Why this priority**: Enhancement feature that adds value but isn't essential for basic event management. Depends on core event functionality.

**Independent Test**: Create events with various reminder settings (15 min, 1 hour, 1 day before), verify reminders trigger at correct times.

**Acceptance Scenarios**:

1. **Given** a user creates an event, **When** they set a reminder (e.g., "15 minutes before"), **Then** they receive a notification at the specified time
2. **Given** a user with upcoming events, **When** they view the dashboard, **Then** events occurring today or tomorrow are highlighted in an "Upcoming Events" section
3. **Given** a user with an event starting soon, **When** the start time approaches, **Then** a browser notification appears (if permissions granted)
4. **Given** a user with all-day events, **When** they view the calendar, **Then** all-day events appear at the top of the day view

---

## Data Model

### Existing Task Entity

```typescript
interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string | null;  // ISO date string (YYYY-MM-DD)
  completed: boolean;
  completedAt: string | null;
  userId: string;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### New Event Entity

```typescript
interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: string;  // ISO 8601 datetime string
  endDate: string;    // ISO 8601 datetime string
  isAllDay: boolean;
  location: string | null;
  userId: string;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  reminderMinutes: number | null;  // Minutes before event to remind (15, 30, 60, 1440)
  createdAt: string;
  updatedAt: string;
}
```

### Unified Calendar Item Type (Frontend)

```typescript
type ItemType = 'task' | 'event';

interface CalendarItem {
  id: string;
  type: ItemType;
  title: string;
  description: string | null;
  date: string;  // ISO date string for display
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  
  // Task-specific fields (only present if type === 'task')
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  completed?: boolean;
  completedAt?: string | null;
  
  // Event-specific fields (only present if type === 'event')
  startTime?: string;  // ISO 8601 datetime
  endTime?: string;    // ISO 8601 datetime
  isAllDay?: boolean;
  location?: string | null;
  reminderMinutes?: number | null;
}
```

## Database Schema Changes

### New Event Table (SQL Server / PostgreSQL)

```sql
CREATE TABLE Events (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsAllDay BIT NOT NULL DEFAULT 0,
    Location NVARCHAR(500),
    UserId UNIQUEIDENTIFIER NOT NULL,
    GroupId UNIQUEIDENTIFIER,
    ReminderMinutes INT,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Events_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Events_Groups FOREIGN KEY (GroupId) REFERENCES TaskGroups(Id) ON DELETE SET NULL,
    CONSTRAINT CHK_Events_EndAfterStart CHECK (EndDate >= StartDate)
);

CREATE INDEX IX_Events_UserId ON Events(UserId);
CREATE INDEX IX_Events_StartDate ON Events(StartDate);
CREATE INDEX IX_Events_UserId_StartDate ON Events(UserId, StartDate);
```

### Prisma Schema Addition

```prisma
model Event {
  id               String      @id @default(uuid())
  title            String      @db.VarChar(200)
  description      String?
  startDate        DateTime
  endDate          DateTime
  isAllDay         Boolean     @default(false)
  location         String?     @db.VarChar(500)
  userId           String
  user             User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  groupId          String?
  group            TaskGroup?  @relation(fields: [groupId], references: [id], onDelete: SetNull)
  reminderMinutes  Int?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  @@index([userId])
  @@index([startDate])
  @@index([userId, startDate])
  @@map("Events")
}
```

## API Endpoints

### Event CRUD Operations

```
POST   /api/v1/events           Create new event
GET    /api/v1/events           Get all events for authenticated user (with filters)
GET    /api/v1/events/:id       Get specific event by ID
PUT    /api/v1/events/:id       Update event
DELETE /api/v1/events/:id       Delete event
```

### Combined Calendar Data

```
GET    /api/v1/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD&type=all|tasks|events
```

Returns unified array of tasks and events for calendar rendering:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "task",
      "title": "Submit report",
      "date": "2026-01-15",
      "priority": "High",
      "completed": false,
      "groupId": "uuid",
      "groupName": "Work",
      "groupColour": "#3b82f6"
    },
    {
      "id": "uuid",
      "type": "event",
      "title": "Team Meeting",
      "date": "2026-01-15",
      "startTime": "2026-01-15T14:00:00Z",
      "endTime": "2026-01-15T15:00:00Z",
      "isAllDay": false,
      "location": "Conference Room A",
      "groupId": "uuid",
      "groupName": "Work",
      "groupColour": "#3b82f6"
    }
  ],
  "summary": {
    "totalTasks": 12,
    "totalEvents": 5,
    "completedTasks": 8
  }
}
```

## UI/UX Considerations

### Visual Design

1. **Icons** (using Lucide React):
   - Tasks: `CheckCircle` icon (existing)
   - Events: `Calendar` icon for general events
   - Events with time: `Clock` icon for timed events
   - Location: `MapPin` icon for events with location
   - All-day events: `CalendarDays` icon

2. **Colour Coding**:
   - Tasks maintain existing priority-based colours (Critical=red, High=orange, Medium=blue, Low=grey)
   - Events use distinct event colour (purple: `#8b5cf6`) or inherit group colour with event icon overlay

3. **Badge Design**:
   - Task badges show count with CheckCircle icon: `✓ 3`
   - Event badges show count with Calendar icon: `📅 2` → `<Calendar size={12} /> 2`
   - Mixed days show separate badges: `<CheckCircle size={12} /> 3 • <Calendar size={12} /> 2`

4. **Calendar Day Cells**:
   ```tsx
   <DayCell>
     <DayNumber>15</DayNumber>
     <Badges>
       {taskCount > 0 && <TaskBadge><CheckCircle size={12} />{taskCount}</TaskBadge>}
       {eventCount > 0 && <EventBadge><Calendar size={12} />{eventCount}</EventBadge>}
     </Badges>
   </DayCell>
   ```

### Modal Design Patterns

#### Create/Edit Task Modal
- Title: "Add Task" / "Edit Task"
- Fields: Title, Description, Priority, Due Date, Group
- Actions: Save, Cancel, Delete (if editing)

#### Create/Edit Event Modal
- Title: "Add Event" / "Edit Event"
- Fields: Title, Description, Start Date/Time, End Date/Time, All-Day Toggle, Location, Group, Reminder
- Time picker component (hours and minutes)
- Actions: Save, Cancel, Delete (if editing)

#### Quick Add Modal (Calendar Click)
- Show type selector at top: `[ Task | Event ]` toggle buttons
- Dynamically show relevant fields based on selection
- Pre-fill date from clicked calendar cell

### Dashboard Integration

**New Sections**:

1. **Upcoming Events** (above or alongside task list):
   - Shows next 5-10 events chronologically
   - Each event displays: `<Calendar size={16} />` icon, title, time, `<MapPin size={14} />` location (if present)
   - Click to view/edit event details
   - Hover shows full event details tooltip

2. **Today's Schedule**:
   - Combined view of tasks due today and events happening today
   - Events show `<Clock size={16} />` icon with start time
   - Tasks show `<CheckCircle size={16} />` icon with priority badge
   - Sorted chronologically (events by start time, tasks by priority)
   - Visual separation between morning/afternoon/evening using dividers

3. **Filter Toggle** (existing filters section):
   - Add "Item Type" filter using `ToggleButton` pattern: `All | Tasks | Events`
   - Uses existing `ToggleGroup` component style
   - Integrates with existing group and priority filters

## Implementation Phases

### Phase 13: Events Foundation (Week 1)

**T301-T310: Backend - Event Entity & API**

- T301: Create Event entity in database (Prisma schema, migration)
- T302: Implement Event CRUD endpoints (Controller, Service, DTOs)
- T303: Add Event validation (title required, end >= start, userId ownership)
- T304: Implement GET /api/v1/calendar unified endpoint
- T305: Add event filtering (date range, group, userId)
- T306: Write Event service unit tests
- T307: Write Event controller integration tests
- T308: Add Event to Swagger documentation
- T309: Implement event-group relationship
- T310: Add database indexes for Event queries

**T311-T320: Frontend - Event Types & Services**

- T311: Create Event TypeScript interfaces
- T312: Create CalendarItem union type
- T313: Implement eventService (CRUD operations)
- T314: Implement calendarService (unified items fetch)
- T315: Create Event form validation logic
- T316: Add Event to form components (Create/Edit)
- T317: Create type guard utilities (isTask, isEvent)
- T318: Update existing services to handle unified data
- T319: Create Event-specific styled components
- T320: Add Event icons to icon library

### Phase 14: Event UI Components (Week 2)

**T321-T330: Event Modals & Forms**

- T321: Create CreateEventModal component (using Lucide `Calendar` icon in header)
- T322: Create EditEventModal component (using Lucide `Clock` icon for time fields)
- T323: Implement time picker component with `Clock` icon (hours/minutes)
- T324: Implement all-day toggle with conditional time display
- T325: Implement location input field
- T326: Implement reminder selector dropdown
- T327: Add event validation feedback (UI errors)
- T328: Implement event delete confirmation
- T329: Add event form keyboard shortcuts (save on Ctrl+Enter)
- T330: Implement event colour/icon preview

**T331-T340: Calendar Integration**

- T331: Update calendar day cells to show task and event badges separately
- T332: Implement badge visual distinction (icons, colours)
- T333: Update QuickAddModal to include type selector (Task/Event toggle)
- T334: Update DayTaskListModal to show tasks and events together
- T335: Implement event list item styling (distinct from tasks)
- T336: Add time display to event list items
- T337: Update calendar filters to include type filter (All/Tasks/Events)
- T338: Implement event click handler (opens EditEventModal)
- T339: Add event count to calendar month summary
- T340: Update calendar loading states for events

### Phase 15: Dashboard & List Views (Week 3)

**T341-T350: Dashboard Integration**

- T341: Create "Upcoming Events" section component
- T342: Implement event list with chronological sorting
- T343: Add time and location display to event cards
- T344: Create "Today's Schedule" unified view
- T345: Implement chronological sorting (events by time, tasks by priority)
- T346: Add visual time-of-day separators (morning/afternoon/evening)
- T347: Update dashboard filters to include item type selector
- T348: Implement event statistics (total events, upcoming count)
- T349: Add event group filtering
- T350: Update dashboard search to include events

**T351-T360: Event List Management**

- T351: Create dedicated Events page (/events route)
- T352: Implement event list view (similar to task list)
- T353: Add event sorting (by start date, title, group)
- T354: Implement event batch operations (delete multiple)
- T355: Add event export functionality (CSV/iCal)
- T356: Implement event drag-and-drop reordering
- T357: Add event quick actions (edit, delete, duplicate)
- T358: Implement event search with time range filters
- T359: Add past events archive view
- T360: Implement event pagination

### Phase 16: Advanced Features (Week 4)

**T361-T370: Notifications & Reminders**

- T361: Implement browser notification permission request
- T362: Create notification service (frontend)
- T363: Implement reminder scheduling logic
- T364: Add reminder notification triggers
- T365: Implement upcoming events dashboard widget
- T366: Add event conflict detection
- T367: Implement conflict warnings in UI
- T368: Add event reminder preferences to user settings
- T369: Implement "snooze" functionality for reminders
- T370: Add notification history log

**T371-T380: Polish & UX Enhancements**

- T371: Implement event duration calculation and display
- T372: Add event time zone support
- T373: Implement recurring events (daily, weekly, monthly patterns)
- T374: Add event attendees field (for future collaboration)
- T375: Implement event import from calendar files (.ics)
- T376: Add event colour customization
- T377: Implement event templates (common event types)
- T378: Add event notes/agenda field with markdown support
- T379: Implement event attachment uploads
- T380: Add event accessibility improvements (ARIA labels, keyboard navigation)

### Phase 17: Testing & Documentation (Week 5)

**T381-T390: Testing**

- T381: Write Event component unit tests
- T382: Write Event service tests
- T383: Write Event API integration tests
- T384: Implement E2E tests for event creation workflow
- T385: Implement E2E tests for event editing workflow
- T386: Implement E2E tests for calendar with mixed tasks/events
- T387: Test event notifications and reminders
- T388: Test event filtering and sorting
- T389: Perform cross-browser testing for events
- T390: Perform mobile responsiveness testing for events

**T391-T400: Documentation & Deployment**

- T391: Update API documentation with Event endpoints
- T392: Create Event feature user guide
- T393: Update QUICKSTART.md with Events examples
- T394: Document Event vs Task differences in README
- T395: Create Event data migration guide (if needed)
- T396: Update database documentation with Event schema
- T397: Create Event troubleshooting guide
- T398: Update security audit for Event permissions
- T399: Perform final code review for Events feature
- T400: Deploy Events feature to production

## Acceptance Criteria

### Functional Requirements

**FR-029**: Users can create events with title, date/time, and optional location  
**FR-030**: Events display visually distinct from tasks in all views  
**FR-031**: Users can specify all-day or timed events  
**FR-032**: Calendar shows separate indicators for tasks and events  
**FR-033**: Users can filter calendar to show tasks only, events only, or both  
**FR-034**: Event modals show event-specific fields (time, location) and hide task fields (priority, completion)  
**FR-035**: Dashboard shows upcoming events section sorted chronologically  
**FR-036**: Users can edit event times and dates  
**FR-037**: Users can set reminders for events (15min, 1hr, 1day before)  
**FR-038**: Event notifications trigger at specified reminder times  
**FR-039**: Statistics display separate counts for tasks and events  
**FR-040**: Users can delete events with confirmation  

### Non-Functional Requirements

**NFR-013**: Event API responses must return within 200ms for typical queries  
**NFR-014**: Calendar must render smoothly with 100+ tasks and events  
**NFR-015**: Event notifications must trigger within 30 seconds of scheduled time  
**NFR-016**: Event data must maintain referential integrity with users and groups  
**NFR-017**: Event filtering must not degrade performance with large datasets  
**NFR-018**: Time display must respect browser timezone  
**NFR-019**: Event CRUD operations must maintain audit trail  
**NFR-020**: Event modals must be keyboard-accessible (tab navigation, shortcuts)  

## Migration Strategy

### Database Migration

1. Create Event table with all required fields
2. Add foreign key relationships (UserId, GroupId)
3. Add appropriate indexes
4. No data migration required (clean slate for events)

### Frontend Migration

1. Update calendar service to fetch unified data (tasks + events)
2. Add type discrimination logic throughout components
3. Gradually introduce event-specific UI components
4. Maintain backward compatibility with existing task flows

### Rollout Plan

1. **Week 1**: Backend + types (no UI changes, API ready)
2. **Week 2**: Event creation + calendar display (users can create/view events)
3. **Week 3**: Dashboard integration + list management (full event parity with tasks)
4. **Week 4**: Notifications + advanced features (enhanced functionality)
5. **Week 5**: Testing + documentation (production-ready)

## Future Enhancements

- **Recurring Events**: Repeat patterns (daily, weekly, monthly, yearly)
- **Event Attendees**: Invite other users to events (requires collaboration features)
- **Calendar Sync**: Two-way sync with Google Calendar, Outlook, iCal
- **Event Reminders**: Multiple reminders per event, custom reminder times
- **Event Templates**: Quick creation of common event types
- **Time Zone Support**: Multi-timezone events for remote teams
- **Event Attachments**: Upload documents related to events
- **Event Notes**: Rich text agenda/notes per event
- **Conflict Detection**: Warn about overlapping events
- **Calendar Sharing**: Share calendar with other users (read-only or editable)

## Success Metrics

- **Adoption**: >50% of users create at least one event within 2 weeks of release
- **Engagement**: Average user creates 3+ events per week
- **Satisfaction**: <5% user confusion about task vs event distinction (measured via support tickets)
- **Performance**: Calendar loads in <500ms with 50 tasks + 50 events
- **Retention**: No decrease in task creation after event feature launch (indicates successful coexistence)

## Open Questions

1. Should events support completion status (e.g., "attended" vs "missed")? **Decision: No - events are time-based occurrences, not action items requiring completion.**

2. Should events support priority levels? **Decision: No - priority is task-specific (urgency/importance of completion). Events have inherent priority via start time.**

3. How to handle recurring events (daily standups, weekly meetings)? **Decision: Defer to future phase - requires complex recurrence rules and instance management.**

4. Should we allow converting tasks to events and vice versa? **Decision: Yes - add "Convert to Event/Task" option in edit modals. Useful for items that change nature (meeting → action item).**

5. Should calendar export tasks and events to .ics format? **Decision: Yes - add export functionality in Phase 16. Standard format for calendar interoperability.**

6. How to handle time zones for remote teams? **Decision: Store all times in UTC, display in user's browser timezone. Full timezone management deferred to future enhancement.**

## Dependencies

- **Phase 12 (Calendar View)**: Must be complete before Events can be integrated into calendar
- **Task Groups**: Events use existing TaskGroup entity for organization
- **Authentication**: Event ownership tied to authenticated users
- **Frontend UI Library**: Time picker component may require new UI library (e.g., react-datepicker)

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| User confusion between tasks and events | High | Clear visual distinction, onboarding tooltips, help documentation |
| Performance degradation with mixed data | Medium | Optimize queries with indexes, implement pagination, lazy loading |
| Calendar rendering complexity | Medium | Use existing react-calendar library, incremental rendering for badges |
| Time zone handling bugs | Low | Store UTC, display local, extensive testing across timezones |
| Notification permission denial | Low | Graceful degradation, show in-app notifications, persistent reminders widget |

## Rollback Plan

If critical issues arise post-deployment:

1. **Database**: Event table remains but endpoints return empty arrays
2. **Frontend**: Hide event creation UI, filter out events from API responses
3. **Calendar**: Display tasks only, ignore event data
4. **Users**: No data loss - events preserved in database, accessible once issues resolved

This allows graceful rollback without data migration or loss.

---

**Notes**: This specification follows SpecKit conventions and integrates with existing To Do application architecture. All task IDs (T301-T400) continue the existing numbering scheme from previous phases.

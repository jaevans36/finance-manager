# Feature Specification: Dashboard Widgets & Redesign

**Feature ID**: `005-dashboard-widgets`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: Events Feature (Phase 13)

## Overview

Transform the dashboard from a simple task list into an information-rich hub with widgets showing time/date, upcoming events, quick calculator, statistics, and customizable layouts. Users can configure which widgets to display and how they're arranged.

## Rationale

The current dashboard is too minimalist - it only shows a task list. Users want a **command centre** when they open the app: what time is it, what's happening today, what needs my attention? A widget-based system provides flexibility while keeping the interface clean.

**Business Value**:
- Increases app stickiness (users check it more often)
- Provides at-a-glance information without navigation
- Personalization increases user satisfaction
- Reduces cognitive load (information is surfaced, not hunted)

## Widget System Philosophy

### Core Principles

1. **Progressive Disclosure**: Start with sensible defaults, allow customization
2. **Performance First**: All widgets must render in <100ms
3. **Responsive Design**: Adapt gracefully from mobile to desktop
4. **Accessibility**: Keyboard navigable, screen reader friendly
5. **No Bloat**: Each widget must justify its existence

### Widget Architecture

**Widget Interface**:
```typescript
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: { row: number; column: number };
  size: { width: number; height: number }; // Grid units
  settings: WidgetSettings;
  isEnabled: boolean;
}

type WidgetType = 
  | 'clock-date'
  | 'upcoming-events'
  | 'task-statistics'
  | 'quick-calculator'
  | 'recent-activity'
  | 'weekly-progress';
```

## User Scenarios & Testing

### User Story 1 - Time & Date Widget (Priority: P1)

**Why this priority**: Foundation widget - most users want to see current time/date prominently.

**Independent Test**: Display current time, date, day of week in multiple time zones, verify updates every second.

**Acceptance Scenarios**:

1. **Given** dashboard loads, **When** viewing time widget, **Then** current time displays in HH:MM:SS format with live updates
2. **Given** time widget settings, **When** user selects 12-hour format, **Then** time shows with AM/PM indicator
3. **Given** time widget, **When** user adds timezone "New York", **Then** additional clock appears showing NY time
4. **Given** date display, **When** viewing widget, **Then** full date shows as "Saturday, 18 January 2026"
5. **Given** widget settings, **When** user toggles "Show seconds", **Then** seconds appear/disappear from time display

### User Story 2 - Upcoming Events Widget (Priority: P1)

**Why this priority**: Core dashboard value - users need to see what's coming soon.

**Independent Test**: Show next 5 events/tasks chronologically, with colour coding and quick actions.

**Acceptance Scenarios**:

1. **Given** events in next 7 days, **When** viewing widget, **Then** up to 5 events display in chronological order
2. **Given** events with different times, **When** viewing, **Then** each shows relative time ("in 2 hours", "tomorrow at 3pm")
3. **Given** overdue tasks, **When** viewing widget, **Then** they appear at top with red indicator
4. **Given** event in widget, **When** user clicks, **Then** event details modal opens
5. **Given** task in widget, **When** user clicks checkbox, **Then** task marks complete and removes from widget

### User Story 3 - Quick Calculator Widget (Priority: P2)

**Why this priority**: Power user feature - convenient for quick calculations without leaving app.

**Independent Test**: Perform basic arithmetic, verify calculations are accurate, test history persistence.

**Acceptance Scenarios**:

1. **Given** calculator widget, **When** user types "125 + 378", **Then** result "503" displays immediately
2. **Given** calculator, **When** user presses Enter, **Then** calculation is added to history
3. **Given** calculation history, **When** viewing, **Then** last 10 calculations show with copy buttons
4. **Given** calculator, **When** user types "15% of 200", **Then** result "30" displays
5. **Given** calculation error, **When** invalid expression entered, **Then** "Invalid expression" message shows

### User Story 4 - Task Statistics Widget (Priority: P2)

**Why this priority**: Motivational - users want to see their productivity patterns.

**Independent Test**: Show completion rates, streak counts, and trend charts.

**Acceptance Scenarios**:

1. **Given** tasks completed this week, **When** viewing widget, **Then** completion rate displays as percentage with bar chart
2. **Given** consecutive days with completed tasks, **When** viewing, **Then** current streak count shows prominently
3. **Given** task history, **When** viewing widget, **Then** 7-day completion trend displays as sparkline
4. **Given** no tasks completed today, **When** viewing, **Then** motivational message displays ("Start your day!")
5. **Given** weekly goal setting, **When** user sets goal of 20 tasks/week, **Then** progress bar shows completion towards goal

### User Story 5 - Widget Customization (Priority: P2)

**Why this priority**: Personalization is key to dashboard value - users have different needs.

**Independent Test**: Add, remove, reorder, and resize widgets, verify preferences persist.

**Acceptance Scenarios**:

1. **Given** dashboard, **When** user clicks "Customize Dashboard", **Then** widget library modal opens showing all available widgets
2. **Given** widget library, **When** user clicks "Add Calculator", **Then** calculator widget appears on dashboard
3. **Given** widgets on dashboard, **When** user drags a widget, **Then** it moves to new position with smooth animation
4. **Given** a widget, **When** user clicks remove icon, **Then** confirmation dialog appears and widget is removed on confirm
5. **Given** dashboard customization, **When** user refreshes page, **Then** widget configuration is preserved

## Widget Specifications

### Clock & Date Widget

**Features**:
- Live-updating time (refreshes every second)
- Multiple timezone support (add up to 3 additional zones)
- Configurable time format (12h/24h)
- Full date display with day of week
- Optional seconds display
- Configurable date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)

**Size**: Small (2x1 grid units)

**Settings**:
```typescript
interface ClockSettings {
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  dateFormat: 'UK' | 'US' | 'ISO';
  additionalTimezones: string[]; // IANA timezone identifiers
}
```

### Upcoming Events Widget

**Features**:
- Shows next 5 events/tasks chronologically
- Relative time display ("in 30 minutes", "tomorrow")
- Colour-coded by priority/category
- Quick action buttons (complete task, view event)
- Overdue items highlighted
- Empty state with motivational message

**Size**: Medium (3x2 grid units)

**Settings**:
```typescript
interface UpcomingEventsSettings {
  itemCount: number; // 3, 5, or 10
  showTasks: boolean;
  showEvents: boolean;
  daysAhead: number; // 1, 3, 7, or 14
}
```

### Quick Calculator Widget

**Features**:
- Inline calculation (type expression, see instant result)
- Supports +, -, *, /, %, parentheses
- Percentage calculations ("15% of 200")
- Calculation history (last 10 results)
- Copy result to clipboard
- Keyboard-friendly (Enter to add to history)

**Size**: Small (2x2 grid units)

**Libraries**: `mathjs` for expression parsing

### Task Statistics Widget

**Features**:
- Completion rate (today, this week, this month)
- Current streak (consecutive days with completed tasks)
- 7-day completion trend (sparkline chart)
- Weekly goal progress bar
- Motivational messages for milestones

**Size**: Medium (3x2 grid units)

**Settings**:
```typescript
interface StatisticsSettings {
  showStreak: boolean;
  showWeeklyGoal: boolean;
  weeklyGoalCount: number;
  timeRange: 'week' | 'month';
}
```

### Recent Activity Widget

**Features**:
- Last 10 actions (task completed, event created, etc.)
- Time of each action
- Undo button for reversible actions
- Filterable by action type

**Size**: Medium (3x3 grid units)

### Weekly Progress Widget

**Features**:
- Visual calendar showing completed tasks per day
- Heatmap-style colour intensity
- Click day to see tasks completed
- Motivational comparison to previous week

**Size**: Large (4x2 grid units)

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
interface DashboardConfig {
  id: string;
  userId: string;
  widgets: WidgetConfig[];
  layout: LayoutType; // 'grid' | 'masonry'
  createdAt: Date;
  updatedAt: Date;
}

interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: { row: number; column: number };
  size: { width: number; height: number };
  settings: Record<string, any>; // JSONB column
  isEnabled: boolean;
}
```

**API Endpoints**:
- `GET /api/v1/dashboard/config` - Get user's dashboard configuration
- `PUT /api/v1/dashboard/config` - Update dashboard configuration
- `GET /api/v1/dashboard/statistics` - Get task statistics data
- `GET /api/v1/dashboard/recent-activity` - Get recent activity feed
- `GET /api/v1/dashboard/upcoming` - Get upcoming events/tasks

### Frontend Components

**Widget System**:
- `WidgetContainer` - Drag-and-drop grid container
- `Widget` - Base widget component with header/footer
- `WidgetLibrary` - Modal for adding new widgets
- `WidgetSettings` - Generic settings panel

**Individual Widgets**:
- `ClockDateWidget`
- `UpcomingEventsWidget`
- `QuickCalculatorWidget`
- `TaskStatisticsWidget`
- `RecentActivityWidget`
- `WeeklyProgressWidget`

**State Management**:
- Dashboard config stored in context
- Widget data fetched on mount with polling for live data
- Optimistic updates for widget reordering

**Libraries**:
- `react-grid-layout` - Drag-and-drop grid system
- `recharts` - Charts for statistics widget
- `mathjs` - Expression evaluation for calculator
- `date-fns` - Date formatting and manipulation

## Task Breakdown: Phase 16 - Dashboard Widgets (5 weeks)

### Week 1: Backend Infrastructure (Days 1-5)

**Database Schema**
- [ ] T568 [P] Create DashboardConfig entity - 2h
- [ ] T569 [P] Create WidgetConfig entity - 2h
- [ ] T570 Create EF Core migrations - 1h
- [ ] T571 Apply migrations and verify schema - 1h

**Dashboard Config Service**
- [ ] T572 Create DashboardConfigService - 4h
- [ ] T573 Implement GetDashboardConfig method - 2h
- [ ] T574 Implement UpdateDashboardConfig method - 3h
- [ ] T575 Implement default dashboard creation logic - 2h
- [ ] T576 Write unit tests for config service (12 tests) - 4h

**Statistics Service**
- [ ] T577 Create DashboardStatisticsService - 4h
- [ ] T578 Implement GetTaskStatistics (completion rates, streaks) - 5h
- [ ] T579 Implement GetRecentActivity - 3h
- [ ] T580 Implement GetUpcomingItems - 3h
- [ ] T581 Write unit tests for statistics service (15 tests) - 5h

**Checkpoint**: Backend services operational

### Week 2: API & Frontend Setup (Days 6-10)

**API Endpoints**
- [ ] T582 Create DashboardController - 3h
- [ ] T583 GET /api/v1/dashboard/config endpoint - 2h
- [ ] T584 PUT /api/v1/dashboard/config endpoint - 3h
- [ ] T585 GET /api/v1/dashboard/statistics endpoint - 2h
- [ ] T586 GET /api/v1/dashboard/recent-activity endpoint - 2h
- [ ] T587 GET /api/v1/dashboard/upcoming endpoint - 2h
- [ ] T588 Write integration tests for dashboard endpoints (10 tests) - 4h

**Frontend TypeScript Types**
- [ ] T589 [P] Create Widget interfaces and types - 2h
- [ ] T590 [P] Create DashboardConfig interface - 1h
- [ ] T591 [P] Create Statistics interface - 1h

**Frontend Service**
- [ ] T592 Create dashboardService.ts - 4h
- [ ] T593 Write service tests (8 tests) - 2h

**Widget System Foundation**
- [ ] T594 Install react-grid-layout and configure - 2h
- [ ] T595 Create WidgetContainer component - 5h
- [ ] T596 Create Widget base component - 4h
- [ ] T597 Create WidgetLibrary modal - 5h

**Checkpoint**: API complete, widget system foundation ready

### Week 3: Core Widgets (Days 11-15)

**Clock & Date Widget**
- [ ] T598 Create ClockDateWidget component - 5h
- [ ] T599 Implement live time updates (useInterval hook) - 2h
- [ ] T600 Implement timezone support - 4h
- [ ] T601 Create ClockDateSettings panel - 3h
- [ ] T602 Write component tests (8 tests) - 3h

**Upcoming Events Widget**
- [ ] T603 Create UpcomingEventsWidget component - 6h
- [ ] T604 Implement relative time display (date-fns) - 2h
- [ ] T605 Implement quick actions (complete task, view event) - 4h
- [ ] T606 Create UpcomingEventsSettings panel - 3h
- [ ] T607 Write component tests (10 tests) - 3h

**Quick Calculator Widget**
- [ ] T608 Install mathjs library - 1h
- [ ] T609 Create QuickCalculatorWidget component - 6h
- [ ] T610 Implement expression evaluation - 3h
- [ ] T611 Implement calculation history - 3h
- [ ] T612 Write component tests (10 tests) - 3h

**Checkpoint**: Core widgets functional

### Week 4: Statistics & Activity Widgets (Days 16-20)

**Task Statistics Widget**
- [ ] T613 Install recharts library - 1h
- [ ] T614 Create TaskStatisticsWidget component - 6h
- [ ] T615 Implement completion rate display - 3h
- [ ] T616 Implement streak calculation and display - 4h
- [ ] T617 Implement 7-day trend sparkline - 4h
- [ ] T618 Create StatisticsSettings panel - 3h
- [ ] T619 Write component tests (12 tests) - 4h

**Recent Activity Widget**
- [ ] T620 Create RecentActivityWidget component - 5h
- [ ] T621 Implement activity feed display - 3h
- [ ] T622 Implement undo functionality - 4h
- [ ] T623 Write component tests (8 tests) - 3h

**Weekly Progress Widget**
- [ ] T624 Create WeeklyProgressWidget component - 6h
- [ ] T625 Implement heatmap visualization - 5h
- [ ] T626 Implement day detail modal - 4h
- [ ] T627 Write component tests (10 tests) - 3h

**Checkpoint**: All widgets complete

### Week 5: Customization & Polish (Days 21-25)

**Widget Customization**
- [ ] T628 Implement drag-and-drop for widget reordering - 6h
- [ ] T629 Implement widget resize functionality - 4h
- [ ] T630 Create WidgetSettings modal - 5h
- [ ] T631 Implement widget add/remove - 3h
- [ ] T632 Implement save/reset configuration - 3h

**Dashboard Page Integration**
- [ ] T633 Refactor DashboardPage to use widget system - 6h
- [ ] T634 Implement default dashboard for new users - 2h
- [ ] T635 Add "Customize Dashboard" button and flow - 3h
- [ ] T636 Implement loading states for all widgets - 3h
- [ ] T637 Implement error states for all widgets - 3h

**Testing**
- [ ] T638 Write E2E test for dashboard customization - 5h
- [ ] T639 Write E2E test for all widgets - 5h
- [ ] T640 Write E2E test for widget persistence - 3h
- [ ] T641 Performance testing (100 tasks/events) - 3h

**Documentation**
- [ ] T642 Write user guide for dashboard widgets - 3h
- [ ] T643 Document widget development guide - 3h
- [ ] T644 Create widget design guidelines - 2h

**Final Review**
- [ ] T645 Accessibility audit (keyboard navigation, screen readers) - 4h
- [ ] T646 Responsive design testing (mobile, tablet, desktop) - 3h
- [ ] T647 Code review and refactoring - 4h

**Checkpoint**: Complete dashboard widgets feature

## Effort Summary

**Total Tasks**: 80 tasks (T568-T647)  
**Total Estimated Time**: ~210 hours (5 weeks)  
**Widget Priorities**:
- Clock/Date: P1 (universal need)
- Upcoming Events: P1 (core value)
- Task Statistics: P2 (motivational)
- Quick Calculator: P2 (convenience)
- Recent Activity: P3 (nice-to-have)
- Weekly Progress: P3 (nice-to-have)

## Dependencies

- **Phase 13**: Events feature for upcoming events widget
- **Phase 14**: Recurring events for accurate upcoming items display
- **Design System**: Widget styling should follow theme standards

## Design Considerations

### Mobile Experience

- Widgets stack vertically on mobile
- Simplified widgets for small screens (e.g., clock shows only time, not multiple timezones)
- Touch-friendly hit targets (48px minimum)
- No drag-and-drop on mobile (use reorder buttons)

### Performance

- Widgets render independently (failure in one doesn't break others)
- Lazy loading for widget content
- Debounce configuration updates
- Cache widget data with 5-minute TTL
- Limit polling frequency (30 seconds minimum)

### Accessibility

- All widgets keyboard navigable (Tab, Enter, Escape)
- Focus indicators clear and visible
- ARIA labels for all interactive elements
- Screen reader announces widget updates
- Reduced motion support (disable animations)

## Success Criteria

- ✅ Users can add/remove/reorder widgets
- ✅ All widgets render in <100ms
- ✅ Widget configuration persists across sessions
- ✅ Clock updates every second without performance impact
- ✅ Calculator handles complex expressions accurately
- ✅ Statistics calculate correctly for all time ranges
- ✅ Dashboard responsive on all screen sizes
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ No performance degradation with 1000+ tasks/events

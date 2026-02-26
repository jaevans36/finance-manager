# Feature Specification: Global Navigation Header

**Feature ID**: `006-global-header`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: Dashboard Widgets (Phase 16)

## Overview

Replace the current per-page navigation with a persistent header bar containing app branding, navigation links, real-time clock, notifications, and user menu. This creates a consistent navigation experience across all pages.

## Rationale

The current navigation is fragmented - each page has its own layout with inconsistent elements. Users have to hunt for navigation options. A **global header** provides:
- Consistent navigation muscle memory
- Always-visible time (no need to check phone/system clock)
- Notifications in one place
- Professional, polished appearance

**Business Value**:
- Reduces cognitive load (consistent UI patterns)
- Faster navigation between pages
- Real-time information (clock, notifications) always visible
- Modern SaaS app aesthetic

## Design Philosophy

### Core Principles

1. **Sticky Header**: Always visible, even when scrolling
2. **Minimal Height**: Keep vertical space for content (60px max)
3. **Responsive**: Collapse to hamburger menu on mobile
4. **Fast**: No render-blocking, no layout shifts
5. **Theme-Aware**: Respects light/dark mode

### Visual Design

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] [Dashboard] [Calendar] [Tasks] [Events]    🕐  🔔  👤  │
└────────────────────────────────────────────────────────────────┘
```

**Left Section**: Branding + primary navigation  
**Centre**: (Empty, allows flexibility for future features)  
**Right Section**: Real-time clock, notifications, user menu

## User Scenarios & Testing

### User Story 1 - Persistent Navigation (Priority: P1)

**Why this priority**: Foundation - users need consistent navigation across all pages.

**Independent Test**: Navigate between pages, verify header remains visible and functional.

**Acceptance Scenarios**:

1. **Given** any page in the app, **When** scrolling down, **Then** header remains fixed at top of viewport
2. **Given** header navigation links, **When** user clicks "Dashboard", **Then** navigates to dashboard with active link highlighted
3. **Given** current page is Calendar, **When** viewing header, **Then** "Calendar" link has active state styling
4. **Given** mobile viewport (<768px), **When** viewing header, **Then** navigation collapses to hamburger menu
5. **Given** hamburger menu open, **When** user clicks outside, **Then** menu closes smoothly

### User Story 2 - Real-Time Clock (Priority: P2)

**Why this priority**: Convenience - users frequently check time while working.

**Independent Test**: Display live-updating clock with configurable format and timezone.

**Acceptance Scenarios**:

1. **Given** header loaded, **When** viewing clock, **Then** current time displays in HH:MM format
2. **Given** clock, **When** one second elapses, **Then** time updates without page flicker
3. **Given** user settings, **When** 12-hour format selected, **Then** clock shows "3:45 PM" format
4. **Given** user settings, **When** 24-hour format selected, **Then** clock shows "15:45" format
5. **Given** clock hover/click, **When** interacting, **Then** tooltip shows full date and timezone

### User Story 3 - Notification Centre (Priority: P2)

**Why this priority**: Users need awareness of upcoming events and task reminders.

**Independent Test**: Display unread notification count, show notification list, mark as read.

**Acceptance Scenarios**:

1. **Given** unread notifications, **When** viewing header, **Then** bell icon shows red badge with count
2. **Given** notification icon clicked, **When** dropdown opens, **Then** last 10 notifications display
3. **Given** overdue task notification, **When** viewing, **Then** it appears at top with red indicator
4. **Given** event reminder notification, **When** viewing, **Then** it shows event time and title
5. **Given** notification clicked, **When** user interacts, **Then** marks as read and navigates to relevant page

### User Story 4 - User Menu (Priority: P1)

**Why this priority**: Essential for profile access and logout functionality.

**Independent Test**: Display user avatar, open menu with profile/settings/logout options.

**Acceptance Scenarios**:

1. **Given** header loaded, **When** viewing user section, **Then** user's name and avatar display
2. **Given** user avatar clicked, **When** menu opens, **Then** shows Profile, Settings, Logout options
3. **Given** user menu open, **When** "Profile" clicked, **Then** navigates to profile page
4. **Given** user menu open, **When** "Logout" clicked, **Then** logs out and redirects to login
5. **Given** user has uploaded avatar, **When** viewing header, **Then** custom avatar displays instead of initials

### User Story 5 - Quick Actions (Priority: P3)

**Why this priority**: Power user feature - faster task/event creation from anywhere.

**Independent Test**: Add quick-create button in header, verify modal opens from any page.

**Acceptance Scenarios**:

1. **Given** header, **When** user clicks "+" button, **Then** dropdown shows "New Task" and "New Event" options
2. **Given** "New Task" selected, **When** modal opens, **Then** QuickAddTaskModal appears
3. **Given** "New Event" selected, **When** modal opens, **Then** EventForm appears in modal
4. **Given** quick-create modal, **When** user submits, **Then** item creates and modal closes
5. **Given** keyboard shortcut Ctrl+N, **When** pressed, **Then** quick-create dropdown opens

## Header Components

### Structure

```typescript
<Header>
  <LeftSection>
    <Logo />
    <Navigation>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/calendar">Calendar</NavLink>
      <NavLink to="/tasks">Tasks</NavLink>
      <NavLink to="/events">Events</NavLink>
    </Navigation>
  </LeftSection>
  
  <RightSection>
    <QuickCreateButton /> {/* Optional, P3 */}
    <Clock />
    <NotificationBell />
    <UserMenu />
  </RightSection>
</Header>
```

### Component Specifications

#### Logo Component

**Features**:
- App icon + name (configurable)
- Clickable (navigates to dashboard)
- Responsive (icon only on mobile)

**Size**: 40px height, 120px width (desktop)

#### Navigation Component

**Features**:
- Horizontal link list (desktop)
- Active link highlighting
- Hover states with smooth transitions
- Keyboard navigation (Tab, Enter)

**Mobile**: Collapses to hamburger menu (<768px)

#### Real-Time Clock Component

**Features**:
- Live-updating time (every second)
- Configurable format (12h/24h)
- Timezone display on hover
- Optional seconds display

**Settings Integration**: Uses user's time format preference from profile

```typescript
interface ClockProps {
  format: '12h' | '24h';
  showSeconds?: boolean;
  timezone?: string;
}
```

#### Notification Bell Component

**Features**:
- Badge showing unread count (max "9+")
- Dropdown with last 10 notifications
- Mark individual notifications as read
- "Mark all as read" button
- Empty state message

**Notification Types**:
- Task due soon (1 hour before)
- Task overdue
- Event reminder (15 minutes before)
- Recurring event created
- Calendar sync complete

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}
```

#### User Menu Component

**Features**:
- User avatar (uploaded image or initials)
- Dropdown menu with:
  - Profile
  - Settings
  - Theme toggle (Light/Dark)
  - Logout
- Keyboard accessible

**Avatar Priority**:
1. Custom uploaded image
2. Initials (first + last name)
3. Generic user icon (fallback)

## Technical Architecture

### Backend Components

**Notification System**:
```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

enum NotificationType {
  TaskDueSoon = 'task_due_soon',
  TaskOverdue = 'task_overdue',
  EventReminder = 'event_reminder',
  CalendarSyncComplete = 'calendar_sync_complete',
  RecurringEventCreated = 'recurring_event_created',
}
```

**API Endpoints**:
- `GET /api/v1/notifications` - Get user's notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `POST /api/v1/notifications` - Create notification (internal)

**Background Jobs**:
- `SendTaskRemindersJob` - Runs every 5 minutes
- `SendEventRemindersJob` - Runs every 5 minutes
- `CleanupOldNotificationsJob` - Runs daily (delete >30 days old)

### Frontend Components

**Header Structure**:
- `GlobalHeader.tsx` - Main header component
- `Logo.tsx` - App branding
- `Navigation.tsx` - Navigation links
- `MobileNav.tsx` - Hamburger menu for mobile
- `HeaderClock.tsx` - Real-time clock
- `NotificationBell.tsx` - Notification centre
- `UserMenu.tsx` - User dropdown menu

**State Management**:
- Notification context for unread count
- Poll notifications every 60 seconds
- WebSocket connection for real-time notifications (Phase 2)

**Styling**:
- Fixed positioning with z-index management
- Backdrop blur effect (glassmorphism)
- Smooth animations (200ms transitions)
- Theme-aware colours

## Task Breakdown: Phase 17 - Global Navigation Header (3 weeks)

### Week 1: Backend Notifications (Days 1-5)

**Database Schema**
- [ ] T648 [P] Create Notification entity - 2h
- [ ] T649 Create EF Core migrations - 1h
- [ ] T650 Apply migrations and verify schema - 1h

**Notification Service**
- [ ] T651 Create NotificationService - 4h
- [ ] T652 Implement CreateNotification method - 2h
- [ ] T653 Implement GetUserNotifications method - 3h
- [ ] T654 Implement MarkAsRead method - 2h
- [ ] T655 Implement MarkAllAsRead method - 2h
- [ ] T656 Implement GetUnreadCount method - 2h
- [ ] T657 Write unit tests for notification service (15 tests) - 5h

**Background Jobs**
- [ ] T658 Create SendTaskRemindersJob - 4h
- [ ] T659 Create SendEventRemindersJob - 4h
- [ ] T660 Create CleanupOldNotificationsJob - 2h
- [ ] T661 Configure job scheduling - 2h
- [ ] T662 Write unit tests for background jobs (10 tests) - 4h

**Checkpoint**: Backend notification system operational

### Week 2: API & Frontend Foundation (Days 6-10)

**API Endpoints**
- [ ] T663 Create NotificationsController - 3h
- [ ] T664 GET /api/v1/notifications endpoint - 2h
- [ ] T665 GET /api/v1/notifications/unread-count endpoint - 2h
- [ ] T666 PUT /api/v1/notifications/:id/read endpoint - 2h
- [ ] T667 PUT /api/v1/notifications/read-all endpoint - 2h
- [ ] T668 Write integration tests for notifications (12 tests) - 4h

**Frontend TypeScript Types**
- [ ] T669 [P] Create Notification interface - 1h
- [ ] T670 [P] Create NotificationType enum - 1h

**Frontend Service**
- [ ] T671 Create notificationService.ts - 3h
- [ ] T672 Implement polling mechanism (every 60 seconds) - 2h
- [ ] T673 Write service tests (8 tests) - 2h

**Notification Context**
- [ ] T674 Create NotificationContext - 4h
- [ ] T675 Implement unread count management - 2h
- [ ] T676 Implement notification list management - 3h

**Checkpoint**: API complete, frontend service ready

### Week 3: Header UI Components (Days 11-15)

**Header Structure**
- [ ] T677 Create GlobalHeader component - 5h
- [ ] T678 Implement sticky positioning with scroll behaviour - 3h
- [ ] T679 Create responsive layout (flex-based) - 3h
- [ ] T680 Add backdrop blur effect - 2h

**Logo & Navigation**
- [ ] T681 Create Logo component - 2h
- [ ] T682 Create Navigation component - 4h
- [ ] T683 Implement active link highlighting - 2h
- [ ] T684 Create MobileNav with hamburger menu - 5h
- [ ] T685 Implement mobile menu animations - 3h

**Real-Time Clock**
- [ ] T686 Create HeaderClock component - 4h
- [ ] T687 Implement live time updates (useInterval) - 2h
- [ ] T688 Implement format toggle (12h/24h) - 2h
- [ ] T689 Add timezone tooltip on hover - 2h
- [ ] T690 Write component tests (8 tests) - 3h

**Notification Bell**
- [ ] T691 Create NotificationBell component - 5h
- [ ] T692 Implement badge with unread count - 2h
- [ ] T693 Create notification dropdown - 5h
- [ ] T694 Implement mark as read functionality - 3h
- [ ] T695 Add empty state and loading states - 2h
- [ ] T696 Write component tests (12 tests) - 4h

**User Menu**
- [ ] T697 Create UserMenu component - 5h
- [ ] T698 Implement avatar display (image/initials/fallback) - 3h
- [ ] T699 Create dropdown menu with options - 4h
- [ ] T700 Implement theme toggle in menu - 2h
- [ ] T701 Write component tests (10 tests) - 3h

**Integration**
- [ ] T702 Integrate header into App.tsx layout - 3h
- [ ] T703 Remove old navigation from individual pages - 2h
- [ ] T704 Update z-index management for modals/overlays - 2h
- [ ] T705 Implement keyboard navigation (Tab, Escape) - 3h

**Testing**
- [ ] T706 Write E2E test for header navigation - 3h
- [ ] T707 Write E2E test for notifications - 4h
- [ ] T708 Write E2E test for user menu - 3h
- [ ] T709 Write E2E test for mobile responsive behaviour - 4h

**Documentation**
- [ ] T710 Write user guide for header features - 2h
- [ ] T711 Document notification system - 2h
- [ ] T712 Create header component style guide - 2h

**Final Review**
- [ ] T713 Accessibility audit (keyboard, screen readers) - 3h
- [ ] T714 Performance testing (header render time) - 2h
- [ ] T715 Code review and refactoring - 3h

**Checkpoint**: Complete global navigation header

## Effort Summary

**Total Tasks**: 68 tasks (T648-T715)  
**Total Estimated Time**: ~140 hours (3 weeks)  
**Component Priorities**:
- Navigation: P1 (essential)
- User Menu: P1 (essential)
- Clock: P2 (convenience)
- Notifications: P2 (awareness)
- Quick Actions: P3 (future enhancement)

## Dependencies

- **Phase 13**: Events for event reminders
- **Phase 16**: Dashboard widgets (clock widget code can be reused)
- **Design System**: Header styling must match theme

## Design Considerations

### Mobile Experience

- Header height: 56px (slightly shorter than desktop 60px)
- Hamburger menu slides in from right
- Clock shows time only (no date)
- Notification bell retains badge but smaller dropdown
- User menu simplified (no avatar on very small screens)

### Performance

- Header renders once, doesn't re-render on navigation
- Clock uses optimized interval (only updates DOM, not state)
- Notifications use polling, not constant re-fetching
- Lazy load notification dropdown content

### Accessibility

- Skip-to-content link for screen readers
- All interactive elements keyboard accessible
- Focus trap in mobile menu
- ARIA labels for icon-only buttons
- Reduced motion support

### Z-Index Management

```typescript
const zIndex = {
  header: 1000,
  dropdown: 1100,
  modal: 1200,
  toast: 1300,
};
```

## Success Criteria

- ✅ Header visible on all pages without layout shifts
- ✅ Navigation highlights correct active page
- ✅ Clock updates every second without performance impact
- ✅ Notifications poll every 60 seconds
- ✅ Unread badge updates in real-time
- ✅ Mobile menu responsive and smooth
- ✅ User menu accessible via keyboard
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Header renders in <50ms

## Future Enhancements (Phase 2)

- **WebSocket Notifications**: Real-time notifications without polling
- **Search Bar**: Global search in header (tasks, events, notes)
- **Breadcrumbs**: Show current page hierarchy
- **Command Palette**: Ctrl+K to open search/command interface
- **Customizable Navigation**: Users can reorder/hide nav links

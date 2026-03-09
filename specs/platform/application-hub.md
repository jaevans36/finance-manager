# Application Hub Dashboard

**Created**: 2026-01-07  
**Status**: Planned (Phase 6)  
**Scope**: Platform-wide portal and navigation

## Overview

The Application Hub serves as the main landing page and portal for all applications in the Life Manager platform. It replaces the original To Do-centric dashboard with a unified entry point that scales as new applications are added.

## Features

**Complete specification available in**: `applications/todo/enhancements.md` → Phase 6 - Application Hub Dashboard

This document provides a high-level overview. See the full spec for:
- Detailed user stories (6.1 - 6.9)
- Acceptance scenarios  
- Database schema
- API endpoints
- Frontend components
- Routing architecture

## User Stories Summary

### 6.1 - Unified Application Portal (P1)
Central hub dashboard with application tiles for quick access to all platform tools.

**Key Features**:
- Grid of application tiles (3 per row desktop, responsive)
- Active apps clickable, coming soon apps greyed out
- Flat icon design system
- Status indicators (active/coming soon/restricted)

### 6.2 - Persistent Information Bar (P2)
Top bar displaying user info, time/date, notifications, and quick actions.

**Key Features**:
- Welcome message with username
- Current date and time (auto-updating)
- User avatar (64px thumbnail)
- Account settings dropdown
- Notifications badge with count
- Logout button

### 6.3 - Quick Stats Dashboard Widget (P3)
Aggregated metrics from all applications shown on hub landing page.

**Key Features**:
- Tasks completed this week (To Do app)
- Active task groups count
- Transactions this month (Finance app - future)
- Click to navigate to source app with filters

### 6.4 - Application Card Design System (P2)
Consistent visual design for application tiles with accessibility.

**Key Features**:
- Flat icons (64x64px, 2-colour max, no gradients)
- Hover states with elevation shadow
- Keyboard navigation (Tab, Enter, Space)
- ARIA labels for screen readers
- Coming Soon badges
- Lock icons for restricted apps

### 6.5 - Recent Activity Feed (P3)
User's last 10 actions across all applications in chronological order.

**Key Features**:
- Reverse chronological display
- Colour-coded by application (green=To Do, blue=Finance)
- Relative timestamps ("2 minutes ago")
- Clickable to navigate to item
- Empty state for new users

### 6.6 - Personalized Welcome Experience (P3)
Time-based greetings, achievements, and contextual messages.

**Key Features**:
- "Good morning/afternoon/evening" based on time
- Achievement celebrations (100 tasks milestone)
- "Welcome back" after 7+ days absence
- First-time onboarding card
- Birthday message (if profile date set)

### 6.7 - Application Health & Status Indicators (P3)
Real-time status badges for each application showing operational health.

**Key Features**:
- Status dots (green=operational, amber=maintenance, red=degraded)
- Hover to see detailed status
- System-wide maintenance banner
- Status checks every 60 seconds
- Click for incident details modal

### 6.8 - Favourites & Customization (P4)
Users can star favourites and reorder tiles via drag-and-drop.

**Key Features**:
- Star icon to mark favourites
- Favourites appear first in grid
- Drag-and-drop reordering
- Layout persists across devices
- Reset to default layout option

### 6.9 - Profile Image Management (P2)
Upload, update, remove profile images displayed as avatars throughout platform.

**Note**: Detailed spec in `platform/authentication.md`

**Key Features**:
- Upload JPEG, PNG, WebP (max 5MB)
- Automatic resize and thumbnail generation
- Display in info bar, profile, admin panel
- Fallback to initials if no image

## Routing Changes

### Before (To Do-centric)
```
/ → Dashboard (To Do task list)
/dashboard → To Do dashboard
/progress → Weekly progress
/groups → Task groups
```

### After (Hub-centric)
```
/ or /hub → Application Hub (portal)
/todo → To Do application main view
/todo/progress → Weekly progress
/todo/groups → Task groups
/todo/calendar → Calendar view
/finance → Finance application (future)
/admin → Admin panel
```

## Database Schema

**4 New Tables**:
1. `user_hub_preferences` - Favourites and custom layout
2. `user_activity_log` - Recent actions across apps
3. `application_status` - Health monitoring
4. `applications` - Application registry

## API Endpoints

```
GET  /api/v1/hub/stats         # Aggregated quick stats
GET  /api/v1/hub/activity      # Recent activity feed (paginated)
GET  /api/v1/hub/status        # Application health status
GET  /api/v1/user/preferences  # User hub preferences
PUT  /api/v1/user/preferences  # Update preferences
GET  /api/v1/applications      # List available apps (with permissions)
```

## Component Structure

```
apps/web/src/
  pages/
    HubDashboard.tsx           # Main hub page
    todo/
      TodoPage.tsx             # To Do main view (was Dashboard.tsx)
      WeeklyProgressPage.tsx
      TaskGroupsPage.tsx
  components/
    hub/
      ApplicationTile.tsx
      InfoBar.tsx
      QuickStatsWidget.tsx
      ActivityFeedItem.tsx
      StatusBadge.tsx
      WelcomeMessage.tsx
      CustomizeLayoutModal.tsx
```

## Application Registry

Applications registered in database:

```typescript
{
  id: 'todo',
  name: 'To Do Manager',
  description: 'Manage tasks and track productivity',
  iconPath: '/icons/todo.svg',
  routePath: '/todo',
  status: 'active',
  requiredRole: null
}

{
  id: 'finance',
  name: 'Life Manager',
  description: 'Track expenses and manage budgets',
  iconPath: '/icons/finance.svg',
  routePath: '/finance',
  status: 'coming_soon',
  estimatedRelease: '2026-06-01'
}

{
  id: 'admin',
  name: 'Admin Panel',
  description: 'System administration and settings',
  iconPath: '/icons/admin.svg',
  routePath: '/admin',
  status: 'active',
  requiredRole: 'admin'
}
```

## State Management

```typescript
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

## Performance

- Activity feed lazy-loaded (10 items initially)
- Quick stats cached (60-second TTL)
- Application status checked every 60 seconds
- Hub preferences cached in context
- Icons lazy-loaded with React.lazy + Suspense

## Mobile Responsiveness

- Info bar collapses to hamburger menu (<768px)
- Application tiles stack vertically (<640px)
- Quick stats becomes scrollable carousel
- Activity feed shows 3 items on mobile
- Customize mode disabled on mobile

## Implementation Priorities

**Critical Path**:
1. 6.1 - Unified portal (architectural foundation)
2. 6.2 - Info bar (navigation & orientation)
3. 6.4 - Design system (consistent visual language)

**High Value**:
4. 6.3 - Quick stats widget
5. 6.5 - Activity feed

**Nice to Have**:
6. 6.6 - Personalized welcome
7. 6.7 - Health indicators
8. 6.8 - Favourites & customization

## Estimated Effort

**3-4 weeks** (full-time developer)
- Week 1: Routing restructure + hub page + info bar
- Week 2: Application tiles + design system + status
- Week 3: Quick stats + activity feed + backend
- Week 4: Personalization + customization + testing

## Related Specifications

- **Architecture**: See `platform/architecture.md` for routing details
- **Authentication**: See `platform/authentication.md` for profile image integration
- **Admin System**: See `platform/admin-system.md` for admin app tile
- **Design Guidelines**: See `platform/design-guidelines.md` for tile styling standards

---

**📖 Full Specification**: `applications/todo/enhancements.md` → Phase 6

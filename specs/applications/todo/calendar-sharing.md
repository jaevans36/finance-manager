# Feature Specification: Calendar Sharing & Permissions

**Feature ID**: `008-calendar-sharing`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P3  
**Dependencies**: Events Feature (Phase 13), User Management

## Overview

Enable users to share their calendars with others, granting view-only or edit permissions. Shared calendars appear in the recipient's calendar view with a distinct visual indicator. Users can manage who has access and revoke permissions at any time.

## Rationale

Personal calendars are valuable, but **team calendars** are essential for coordination. Use cases:
- Family calendar (spouse can view/edit)
- Team project calendar (read-only for stakeholders)
- Meeting room booking calendar (edit for all team members)
- Client availability calendar (view-only public link)

**Business Value**:
- Enables team collaboration without duplicate entry
- Reduces "when are you free?" emails
- Supports multiple use cases (family, work, public)
- Differentiates from basic to-do apps

## Core Concepts

### Sharing Model

```typescript
interface CalendarShare {
  id: string;
  ownerId: string;
  sharedWithUserId?: string; // If sharing with specific user
  sharedWithEmail?: string; // If sharing with non-user
  permission: CalendarPermission;
  shareType: 'user' | 'link';
  shareToken?: string; // For link-based sharing
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

enum CalendarPermission {
  View = 'view',       // Can see events
  Edit = 'edit',       // Can create/edit/delete events
  Manage = 'manage',   // Can edit + manage sharing
}
```

### Sharing Types

1. **User Sharing**: Share with specific email/user account
   - Recipient must have an account (or will receive invitation to create one)
   - Granular permissions (view/edit/manage)
   - Can be revoked anytime

2. **Link Sharing**: Generate shareable link with token
   - Anyone with link can access
   - Typically view-only (but can be edit)
   - Can set expiry date
   - Can be revoked/regenerated

### Visual Design

**Calendar View with Shared Calendars**:
```
┌─────────────────────────────────────────┐
│ My Calendars                            │
│ ☑ My Events (12)                        │
│                                         │
│ Shared with me                          │
│ ☑ Alice's Work Calendar (5) 👁️         │
│ ☑ Team Project (8) ✏️                   │
│ ☐ Public Holidays (15) 👁️              │
│                                         │
│ Shared by me                            │
│ Family Calendar (shared with Bob) ✏️     │
└─────────────────────────────────────────┘
```

## User Scenarios & Testing

### User Story 1 - Share Calendar with User (Priority: P1)

**Why this priority**: Core functionality - users must be able to share with others.

**Independent Test**: Share calendar with 3 users, verify they receive access notifications and can view calendar.

**Acceptance Scenarios**:

1. **Given** calendar settings page, **When** user clicks "Share Calendar", **Then** modal opens with email input and permission selector
2. **Given** share modal, **When** user enters email and selects "View Only", **Then** invitation email sent
3. **Given** shared calendar, **When** recipient logs in, **Then** calendar appears in "Shared with me" section
4. **Given** view-only permission, **When** recipient tries to create event, **Then** "You don't have permission" message displays
5. **Given** edit permission, **When** recipient creates event, **Then** event appears in owner's calendar

### User Story 2 - Accept/Decline Calendar Share (Priority: P1)

**Why this priority**: Recipients need control over what calendars clutter their view.

**Independent Test**: Send calendar share, verify recipient can accept or decline invitation.

**Acceptance Scenarios**:

1. **Given** calendar share invitation, **When** recipient receives email, **Then** email contains Accept and Decline links
2. **Given** accept link clicked, **When** landing on page, **Then** calendar is added to "Shared with me"
3. **Given** decline link clicked, **When** confirming, **Then** calendar does NOT appear and owner is notified
4. **Given** calendar shared, **When** recipient hasn't responded, **Then** calendar shows as "Pending" in owner's view
5. **Given** accepted calendar, **When** viewing, **Then** events display with distinct colour and owner's name badge

### User Story 3 - Link-Based Sharing (Priority: P2)

**Why this priority**: Convenient for public calendars and non-users.

**Independent Test**: Generate shareable link, verify anyone with link can access calendar.

**Acceptance Scenarios**:

1. **Given** share modal, **When** user clicks "Generate Link", **Then** unique link is created and displayed
2. **Given** shareable link, **When** non-user visits link, **Then** read-only calendar view opens (no login required)
3. **Given** link settings, **When** user sets expiry date, **Then** link becomes invalid after date
4. **Given** active link, **When** user clicks "Revoke Link", **Then** link stops working immediately
5. **Given** revoked link, **When** someone visits, **Then** "This calendar share has been revoked" message displays

### User Story 4 - Manage Permissions (Priority: P1)

**Why this priority**: Owners need to control access levels.

**Independent Test**: Change permissions from view to edit, verify recipient gains editing ability.

**Acceptance Scenarios**:

1. **Given** shared calendar, **When** owner clicks "Manage Sharing", **Then** list of all shares displays
2. **Given** share with view permission, **When** owner changes to edit, **Then** recipient immediately gains edit access
3. **Given** share with edit permission, **When** owner revokes access, **Then** calendar disappears from recipient's view
4. **Given** multiple shares, **When** viewing list, **Then** each shows user/email, permission level, and date shared
5. **Given** share settings, **When** owner sets expiry date, **Then** access automatically revokes after date

### User Story 5 - Calendar Visibility Toggle (Priority: P2)

**Why this priority**: Users with many shared calendars need to declutter their view.

**Independent Test**: Toggle shared calendars on/off, verify events show/hide accordingly.

**Acceptance Scenarios**:

1. **Given** 5 shared calendars, **When** user unchecks "Team Project" calendar, **Then** its events disappear from calendar view
2. **Given** hidden calendar, **When** user checks it again, **Then** events reappear immediately
3. **Given** calendar list, **When** viewing, **Then** event counts display next to each calendar name
4. **Given** mobile view, **When** viewing calendar list, **Then** collapsed/expandable sections for "My Calendars" and "Shared with me"
5. **Given** calendar preferences, **When** user toggles visibility, **Then** preference persists across sessions

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
interface CalendarShare {
  id: string;
  ownerId: string;
  sharedWithUserId?: string;
  sharedWithEmail?: string;
  permission: CalendarPermission;
  shareType: 'user' | 'link';
  shareToken?: string;
  isAccepted: boolean; // For user shares
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarPermission {
  userId: string;
  resourceType: 'calendar' | 'event';
  resourceId: string;
  permission: 'view' | 'edit' | 'manage';
}
```

**Service Layer**:
- `CalendarSharingService` - Manages calendar shares
- `PermissionService` - Checks user permissions
- `ShareTokenService` - Generates and validates share tokens
- `NotificationService` - Sends share invitations and updates

**API Endpoints**:
- `POST /api/v1/calendars/share` - Share calendar with user or generate link
- `GET /api/v1/calendars/shared-with-me` - Get calendars shared with current user
- `GET /api/v1/calendars/shared-by-me` - Get calendars user has shared
- `PUT /api/v1/calendars/share/:id` - Update share permissions
- `DELETE /api/v1/calendars/share/:id` - Revoke share
- `POST /api/v1/calendars/share/:id/accept` - Accept calendar share
- `POST /api/v1/calendars/share/:id/decline` - Decline calendar share
- `GET /api/v1/calendars/public/:token` - View shared calendar (public endpoint)

**Background Jobs**:
- `ExpireCalendarSharesJob` - Runs daily, deactivates expired shares
- `CleanupDeclinedSharesJob` - Runs weekly, removes old declined shares

### Frontend Components

**UI Pages**:
- `CalendarSharingModal` - Share calendar with users or generate link
- `ManageSharingModal` - View and manage all shares
- `SharedCalendarsList` - Sidebar showing all calendars
- `AcceptSharePage` - Accept/decline calendar share invitation
- `PublicCalendarView` - View shared calendar without login

**State Management**:
- Track shared calendars in calendar context
- Track visibility toggles (which calendars to show)
- Permission checks before CRUD operations

**Permission Checking**:
```typescript
const canEditEvent = (event: Event) => {
  if (event.ownerId === currentUserId) return true;
  const share = getCalendarShare(event.calendarId);
  return share?.permission === 'edit' || share?.permission === 'manage';
};
```

## Task Breakdown: Phase 19 - Calendar Sharing (4 weeks)

### Week 1: Backend Foundation (Days 1-5)

**Database Schema**
- [ ] T787 [P] Create CalendarShare entity - 3h
- [ ] T788 [P] Create CalendarPermission entity - 2h
- [ ] T789 Create EF Core migrations - 1h
- [ ] T790 Apply migrations and verify schema - 1h

**Permission Service**
- [ ] T791 Create PermissionService - 5h
- [ ] T792 Implement CheckPermission method - 4h
- [ ] T793 Implement GrantPermission method - 3h
- [ ] T794 Implement RevokePermission method - 3h
- [ ] T795 Write unit tests for permission service (15 tests) - 5h

**Share Token Service**
- [ ] T796 Create ShareTokenService - 4h
- [ ] T797 Implement GenerateShareToken method - 3h
- [ ] T798 Implement ValidateShareToken method - 3h
- [ ] T799 Implement RevokeShareToken method - 2h
- [ ] T800 Write unit tests for token service (10 tests) - 4h

**Checkpoint**: Backend foundation ready

### Week 2: Sharing Service (Days 6-10)

**Calendar Sharing Service**
- [ ] T801 Create CalendarSharingService - 5h
- [ ] T802 Implement ShareWithUser method - 5h
- [ ] T803 Implement GenerateShareLink method - 4h
- [ ] T804 Implement AcceptShare method - 3h
- [ ] T805 Implement DeclineShare method - 3h
- [ ] T806 Implement UpdatePermission method - 4h
- [ ] T807 Implement RevokeShare method - 3h
- [ ] T808 Implement GetSharedWithMe method - 3h
- [ ] T809 Implement GetSharedByMe method - 3h
- [ ] T810 Write unit tests for sharing service (20 tests) - 6h

**Notification Integration**
- [ ] T811 Create share invitation email template - 3h
- [ ] T812 Create share accepted email template - 2h
- [ ] T813 Create share revoked email template - 2h
- [ ] T814 Implement SendShareInvitation method - 3h
- [ ] T815 Write unit tests for notification integration (8 tests) - 3h

**Background Jobs**
- [ ] T816 Create ExpireCalendarSharesJob - 3h
- [ ] T817 Create CleanupDeclinedSharesJob - 2h
- [ ] T818 Configure job scheduling - 2h
- [ ] T819 Write unit tests for background jobs (8 tests) - 3h

**Checkpoint**: Sharing service operational

### Week 3: API & Frontend (Days 11-15)

**API Endpoints**
- [ ] T820 Create CalendarSharingController - 4h
- [ ] T821 POST /api/v1/calendars/share endpoint - 3h
- [ ] T822 GET /api/v1/calendars/shared-with-me endpoint - 2h
- [ ] T823 GET /api/v1/calendars/shared-by-me endpoint - 2h
- [ ] T824 PUT /api/v1/calendars/share/:id endpoint - 3h
- [ ] T825 DELETE /api/v1/calendars/share/:id endpoint - 2h
- [ ] T826 POST /api/v1/calendars/share/:id/accept endpoint - 3h
- [ ] T827 POST /api/v1/calendars/share/:id/decline endpoint - 3h
- [ ] T828 GET /api/v1/calendars/public/:token endpoint - 4h
- [ ] T829 Write integration tests for sharing endpoints (15 tests) - 5h

**Frontend TypeScript Types**
- [ ] T830 [P] Create CalendarShare interface - 2h
- [ ] T831 [P] Create CalendarPermission enum - 1h
- [ ] T832 [P] Create ShareType enum - 1h

**Frontend Service**
- [ ] T833 Create calendarSharingService.ts - 5h
- [ ] T834 Implement permission checking utilities - 3h
- [ ] T835 Write service tests (12 tests) - 4h

**Checkpoint**: API complete, frontend services ready

### Week 4: UI & Polish (Days 16-20)

**Frontend Components**
- [ ] T836 Create CalendarSharingModal component - 6h
- [ ] T837 Create ManageSharingModal component - 6h
- [ ] T838 Create SharedCalendarsList component - 5h
- [ ] T839 Create ShareTokenDisplay component (copy link) - 3h
- [ ] T840 Create PermissionBadge component - 2h
- [ ] T841 Create AcceptSharePage (public page) - 5h
- [ ] T842 Create PublicCalendarView (public page) - 6h

**Calendar Integration**
- [ ] T843 Add "Share Calendar" button to calendar page - 2h
- [ ] T844 Implement calendar visibility toggles - 4h
- [ ] T845 Add permission badges to events from shared calendars - 3h
- [ ] T846 Implement permission checks before event CRUD - 4h
- [ ] T847 Show shared calendar owner's name on events - 2h

**Permission Enforcement**
- [ ] T848 Add permission checks to EventForm - 3h
- [ ] T849 Disable edit buttons for view-only calendars - 2h
- [ ] T850 Show "Read-only" indicator on shared calendars - 2h

**Testing**
- [ ] T851 Write component tests for sharing UI (15 tests) - 5h
- [ ] T852 Write E2E test for user sharing flow - 5h
- [ ] T853 Write E2E test for link sharing flow - 4h
- [ ] T854 Write E2E test for permission changes - 4h
- [ ] T855 Write E2E test for accept/decline flow - 4h
- [ ] T856 Test public calendar view without login - 3h

**Documentation**
- [ ] T857 Write user guide for calendar sharing - 4h
- [ ] T858 Document permission system architecture - 3h
- [ ] T859 Create sharing best practices guide - 2h

**Final Review**
- [ ] T860 Security audit (token security, permission checks) - 4h
- [ ] T861 Performance testing (50 shared calendars) - 3h
- [ ] T862 Code review and refactoring - 4h

**Checkpoint**: Complete calendar sharing feature

## Effort Summary

**Total Tasks**: 76 tasks (T787-T862)  
**Total Estimated Time**: ~200 hours (4 weeks)  
**Feature Priorities**:
- User sharing: P1 (core collaboration)
- Permission management: P1 (security)
- Accept/decline: P1 (user control)
- Link sharing: P2 (convenience)
- Visibility toggles: P2 (UX)

## Dependencies

- **Phase 13**: Events feature must be complete
- **User Management**: User accounts and authentication
- **Email Service**: For share invitations
- **Recurring Events (Phase 14)**: Ideally complete for full feature support

## Security Considerations

1. **Permission Enforcement**: All API endpoints must check permissions
2. **Token Security**: Share tokens cryptographically secure (32+ characters)
3. **Rate Limiting**: Limit share creation to prevent abuse
4. **Token Expiry**: Default expiry for link shares (30 days)
5. **Audit Logging**: Log all permission changes
6. **Revocation**: Immediate revocation when share is disabled

## Success Criteria

- ✅ Users can share calendars with specific users
- ✅ Users can generate shareable links
- ✅ Permission enforcement works correctly (view/edit/manage)
- ✅ Recipients can accept/decline calendar shares
- ✅ Shared calendars display with distinct visual indicators
- ✅ Visibility toggles work smoothly
- ✅ Link shares work without requiring login
- ✅ Performance: 50 shared calendars load in <2 seconds
- ✅ Security: Permission checks on all CRUD operations

## Future Enhancements (Phase 2)

- **Group Sharing**: Share with predefined groups (e.g., "Marketing Team")
- **Temporary Shares**: Auto-expiring shares for limited-time access
- **Share Templates**: Save sharing configurations for reuse
- **Activity Feed**: Show who edited what in shared calendars
- **Share Requests**: Allow users to request access to calendars
- **Federated Sharing**: Share with users from other To Do App instances

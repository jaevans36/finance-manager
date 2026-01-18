# Feature Specification: Calendar Integrations

**Feature ID**: `004-calendar-integrations`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: Events Feature (Phase 13), Recurring Events (Phase 14)

## Overview

Enable synchronization with third-party calendar services (Google Calendar, Microsoft Outlook, Apple iCloud) to import and export events. Users can maintain a single source of truth while using their preferred calendar application.

## Rationale

Users already have established calendars in Google, Outlook, or Apple ecosystems. Forcing them to manually duplicate events is a non-starter. Two-way sync allows our app to be part of their existing workflow without replacement.

**Business Value**:
- Reduces adoption friction
- Enables users to keep existing tools
- Makes our app more valuable as a hub rather than a silo

## Integration Strategy

### Architecture: Provider-Agnostic Design

Use an **adapter pattern** where each calendar service implements a common interface:

```typescript
interface CalendarProvider {
  name: string;
  authenticate(credentials): Promise<Token>;
  getEvents(startDate, endDate): Promise<Event[]>;
  createEvent(event): Promise<Event>;
  updateEvent(eventId, event): Promise<Event>;
  deleteEvent(eventId): Promise<void>;
  supportsRecurring: boolean;
  supportsReminders: boolean;
  supportsAttachments: boolean;
}
```

This design allows adding new providers without modifying core sync logic.

## User Scenarios & Testing

### User Story 1 - Connect Calendar Account (Priority: P1)

**Why this priority**: Foundation - users must connect before any sync can occur.

**Independent Test**: Connect Google, Outlook, and iCloud accounts, verify tokens are stored securely and can access calendar data.

**Acceptance Scenarios**:

1. **Given** a user on the settings page, **When** they click "Connect Google Calendar", **Then** OAuth flow opens and grants permission
2. **Given** successful authentication, **When** returning to settings, **Then** the account shows as "Connected" with account email
3. **Given** a connected account, **When** user clicks "Disconnect", **Then** access token is revoked and connection status updates
4. **Given** multiple calendar providers, **When** user connects to all, **Then** each shows independently with sync status
5. **Given** an expired token, **When** sync attempts, **Then** user is prompted to re-authenticate

### User Story 2 - Import Events from Provider (Priority: P1)

**Why this priority**: Core functionality - users want existing events visible in our app.

**Independent Test**: Import events from each provider, verify all event properties map correctly.

**Acceptance Scenarios**:

1. **Given** a connected Google Calendar, **When** user clicks "Import Events", **Then** all events from the past 6 months and future 12 months are imported
2. **Given** imported events, **When** viewing calendar, **Then** they display with a provider badge (G, M, A)
3. **Given** recurring events in Google, **When** imported, **Then** recurrence pattern is preserved and displayed correctly
4. **Given** events with attachments, **When** imported, **Then** attachment links are preserved
5. **Given** calendar invitations with attendees, **When** imported, **Then** attendee list is visible in event details

### User Story 3 - Two-Way Sync (Priority: P1)

**Why this priority**: Essential for keeping calendars in sync - prevents data drift.

**Independent Test**: Create, edit, delete events in both systems, verify changes sync bidirectionally.

**Acceptance Scenarios**:

1. **Given** an event created in our app, **When** sync runs, **Then** the event appears in Google Calendar
2. **Given** an event edited in Outlook, **When** sync runs, **Then** changes reflect in our app
3. **Given** an event deleted in our app, **When** sync runs, **Then** it's removed from the connected calendar
4. **Given** conflicting edits (same event modified in both places), **When** sync runs, **Then** conflict resolution UI appears
5. **Given** automatic sync enabled, **When** 15 minutes pass, **Then** sync runs in background without user action

### User Story 4 - Selective Calendar Sync (Priority: P2)

**Why this priority**: Power users have multiple calendars per account and want granular control.

**Independent Test**: Configure sync to include/exclude specific calendars, verify only selected calendars sync.

**Acceptance Scenarios**:

1. **Given** a Google account with 5 calendars, **When** viewing sync settings, **Then** all calendars are listed with checkboxes
2. **Given** "Work" and "Personal" calendars selected, **When** sync runs, **Then** only events from those two calendars are imported
3. **Given** new events created in our app, **When** user assigns a calendar, **Then** events sync to the correct calendar in Google
4. **Given** a calendar deselected, **When** sync runs, **Then** previously imported events from that calendar are marked as inactive (not deleted)
5. **Given** calendar selection changes, **When** user re-selects a calendar, **Then** its events are re-imported

### User Story 5 - Sync Status & Conflict Resolution (Priority: P2)

**Why this priority**: Users need visibility into sync health and ability to resolve issues.

**Independent Test**: Create various conflict scenarios, verify UI handles them gracefully with clear resolution options.

**Acceptance Scenarios**:

1. **Given** a sync in progress, **When** viewing calendar, **Then** a sync indicator shows with progress percentage
2. **Given** a sync error (network failure), **When** sync fails, **Then** user sees error notification with "Retry" button
3. **Given** a conflict (event edited in both places), **When** detected, **Then** conflict resolution modal shows both versions side-by-side
4. **Given** a conflict resolution choice, **When** user selects "Keep mine", **Then** our version overwrites the provider version
5. **Given** sync history, **When** viewing settings, **Then** last sync time and event counts are displayed

## Provider-Specific Implementations

### Google Calendar Integration

**API**: Google Calendar API v3  
**Authentication**: OAuth 2.0  
**Scopes**: `calendar.readonly`, `calendar.events`

**Supported Features**:
- ✅ Full CRUD operations
- ✅ Recurring events (RRULE format)
- ✅ Event reminders
- ✅ Attendees and invitations
- ✅ Multiple calendars per account
- ✅ Event colors
- ✅ Attachments (as links)

**Known Limitations**:
- Rate limit: 1,000,000 queries/day (generous)
- Max 2500 events per list request
- No support for tasks (separate Tasks API)

### Microsoft Outlook/Office 365 Integration

**API**: Microsoft Graph API  
**Authentication**: OAuth 2.0 (Microsoft Identity Platform)  
**Scopes**: `Calendars.Read`, `Calendars.ReadWrite`

**Supported Features**:
- ✅ Full CRUD operations
- ✅ Recurring events
- ✅ Event reminders
- ✅ Attendees and RSVPs
- ✅ Multiple calendars
- ✅ Event categories
- ✅ Attachments

**Known Limitations**:
- Rate limit: 10,000 requests per 10 minutes per user
- Recurring event exceptions handled differently than Google
- Some advanced recurrence patterns may not map perfectly

### Apple iCloud Calendar Integration

**API**: CalDAV protocol  
**Authentication**: App-specific password  
**Protocol**: CalDAV (WebDAV + iCalendar)

**Supported Features**:
- ✅ Full CRUD operations
- ✅ Recurring events (iCalendar format)
- ✅ Event alarms (reminders)
- ✅ Multiple calendars
- ⚠️ Limited attendee support
- ⚠️ No attachment support

**Known Limitations**:
- More complex setup (app-specific password required)
- CalDAV is older protocol, less feature-rich
- Sync conflicts harder to detect (no change tokens)
- Apple doesn't provide official CalDAV documentation

**Recommendation**: Implement Google and Outlook first (OAuth is better UX), add iCloud in Phase 2 if demand exists.

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
interface CalendarConnection {
  id: string;
  userId: string;
  provider: 'google' | 'outlook' | 'icloud';
  providerAccountId: string;
  providerAccountEmail: string;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  tokenExpiry: Date;
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncedEvent {
  id: string;
  localEventId: string;
  connectionId: string;
  providerEventId: string;
  providerCalendarId: string;
  lastSyncedHash: string; // For conflict detection
  syncDirection: 'import' | 'export' | 'both';
  isActive: boolean;
}
```

**Service Layer**:
- `CalendarSyncService` - Orchestrates sync process
- `GoogleCalendarProvider` - Google-specific implementation
- `OutlookCalendarProvider` - Outlook-specific implementation
- `ICloudCalendarProvider` - iCloud-specific implementation
- `ConflictResolver` - Handles merge conflicts
- `TokenManager` - Manages token refresh and encryption

**Background Jobs**:
- `SyncCalendarsJob` - Runs every 15 minutes for active connections
- `RefreshTokensJob` - Runs daily to refresh expiring tokens
- `CleanupInactiveConnectionsJob` - Removes old disconnected accounts

### Frontend Components

**UI Pages**:
- `CalendarIntegrationsPage` - Main settings page
- `ConnectCalendarModal` - OAuth flow initiation
- `SelectCalendarsModal` - Choose which calendars to sync
- `SyncConflictModal` - Resolve merge conflicts
- `SyncStatusIndicator` - Shows real-time sync progress

**State Management**:
- Track connected accounts in context
- Show provider badges on events
- Handle OAuth callback redirect

## Task Breakdown: Phase 15 - Calendar Integrations (6 weeks)

### Week 1: Backend Foundation (Days 1-5)

**Database Schema**
- [ ] T490 [P] Create CalendarConnection entity - 2h
- [ ] T491 [P] Create SyncedEvent entity - 2h
- [ ] T492 Create EF Core migrations for integration tables - 1h
- [ ] T493 Apply migrations and verify schema - 1h

**Provider Interface**
- [ ] T494 Define ICalendarProvider interface - 3h
- [ ] T495 Create CalendarProviderFactory for dependency injection - 2h
- [ ] T496 Implement token encryption/decryption utilities - 3h
- [ ] T497 Write unit tests for token management (8 tests) - 3h

**Token Management**
- [ ] T498 Create TokenManager service for refresh logic - 4h
- [ ] T499 Implement OAuth callback handler endpoint - 3h
- [ ] T500 Write unit tests for TokenManager (10 tests) - 3h

**Checkpoint**: Backend infrastructure ready for providers

### Week 2: Google Calendar Provider (Days 6-10)

**Google OAuth Setup**
- [ ] T501 Register app in Google Cloud Console - 1h
- [ ] T502 Configure OAuth consent screen and scopes - 1h
- [ ] T503 Create configuration for Google API client - 2h

**Google Calendar Implementation**
- [ ] T504 Implement GoogleCalendarProvider class - 6h
- [ ] T505 Implement getEvents with pagination - 4h
- [ ] T506 Implement createEvent method - 3h
- [ ] T507 Implement updateEvent method - 3h
- [ ] T508 Implement deleteEvent method - 2h
- [ ] T509 Handle recurring events (RRULE format) - 4h

**Testing**
- [ ] T510 Write integration tests for Google provider (15 tests) - 5h
- [ ] T511 Test with live Google Calendar account - 2h

**Checkpoint**: Google Calendar fully functional

### Week 3: Outlook/Microsoft Graph Provider (Days 11-15)

**Microsoft OAuth Setup**
- [ ] T512 Register app in Azure AD portal - 1h
- [ ] T513 Configure API permissions and consent - 1h
- [ ] T514 Create configuration for Microsoft Graph client - 2h

**Outlook Implementation**
- [ ] T515 Implement OutlookCalendarProvider class - 6h
- [ ] T516 Implement getEvents with pagination - 4h
- [ ] T517 Implement createEvent method - 3h
- [ ] T518 Implement updateEvent method - 3h
- [ ] T519 Implement deleteEvent method - 2h
- [ ] T520 Handle recurring events (Outlook format) - 4h

**Testing**
- [ ] T521 Write integration tests for Outlook provider (15 tests) - 5h
- [ ] T522 Test with live Outlook account - 2h

**Checkpoint**: Outlook/Microsoft Graph fully functional

### Week 4: Sync Engine (Days 16-20)

**CalendarSyncService**
- [ ] T523 Create CalendarSyncService core logic - 6h
- [ ] T524 Implement import sync (provider → local) - 5h
- [ ] T525 Implement export sync (local → provider) - 5h
- [ ] T526 Implement bidirectional sync with conflict detection - 6h
- [ ] T527 Create sync hash calculation for change detection - 3h

**Conflict Resolution**
- [ ] T528 Create ConflictResolver service - 4h
- [ ] T529 Implement merge strategies (ours, theirs, manual) - 4h
- [ ] T530 Write unit tests for conflict resolution (12 tests) - 4h

**Background Jobs**
- [ ] T531 Create SyncCalendarsJob with Hangfire/Quartz - 3h
- [ ] T532 Create RefreshTokensJob - 2h
- [ ] T533 Configure job scheduling and retry policies - 2h

**Checkpoint**: Sync engine operational

### Week 5: API & Frontend (Days 21-25)

**Backend API Endpoints**
- [ ] T534 Create CalendarIntegrationsController - 3h
- [ ] T535 POST /api/v1/integrations/connect (initiate OAuth) - 2h
- [ ] T536 GET /api/v1/integrations/callback (OAuth callback) - 3h
- [ ] T537 GET /api/v1/integrations (list connections) - 2h
- [ ] T538 DELETE /api/v1/integrations/{id} (disconnect) - 2h
- [ ] T539 POST /api/v1/integrations/{id}/sync (manual sync trigger) - 2h
- [ ] T540 GET /api/v1/integrations/{id}/calendars (list provider calendars) - 3h
- [ ] T541 PUT /api/v1/integrations/{id}/calendars (select calendars to sync) - 3h

**Frontend TypeScript Types**
- [ ] T542 [P] Create CalendarConnection interface - 1h
- [ ] T543 [P] Create CalendarProvider enum and types - 1h
- [ ] T544 [P] Create SyncStatus interface - 1h

**Frontend Service**
- [ ] T545 Create calendarIntegrationService.ts - 4h
- [ ] T546 Implement OAuth popup flow - 3h
- [ ] T547 Write service tests (8 tests) - 2h

**Checkpoint**: API complete, frontend service ready

### Week 6: UI & Polish (Days 26-30)

**Frontend Components**
- [ ] T548 Create CalendarIntegrationsPage - 6h
- [ ] T549 Create ConnectCalendarButton component - 3h
- [ ] T550 Create CalendarConnectionCard component - 4h
- [ ] T551 Create SelectCalendarsModal - 5h
- [ ] T552 Create SyncStatusIndicator component - 3h
- [ ] T553 Create SyncConflictModal - 6h
- [ ] T554 Add provider badges to EventItem component - 2h

**Integration with Existing Features**
- [ ] T555 Update Calendar page to show sync status - 2h
- [ ] T556 Update EventForm to allow calendar selection - 3h
- [ ] T557 Add sync settings to Profile/Settings page - 2h

**Testing**
- [ ] T558 Write component tests for integration UI (10 tests) - 4h
- [ ] T559 Write E2E test for Google Calendar sync - 4h
- [ ] T560 Write E2E test for Outlook sync - 4h
- [ ] T561 Write E2E test for conflict resolution - 3h

**Documentation**
- [ ] T562 Write user guide for calendar integrations - 3h
- [ ] T563 Document OAuth setup for developers - 2h
- [ ] T564 Create troubleshooting guide - 2h

**Final Review**
- [ ] T565 Security audit of token storage - 3h
- [ ] T566 Performance testing with 1000+ events - 3h
- [ ] T567 Code review and refactoring - 4h

**Checkpoint**: Complete calendar integrations feature

## Effort Summary

**Total Tasks**: 78 tasks (T490-T567)  
**Total Estimated Time**: ~210 hours (6 weeks)  
**Provider Priorities**:
- Google Calendar: P1 (most users)
- Microsoft Outlook: P1 (enterprise users)
- Apple iCloud: P3 (add later if demand exists)

## Dependencies

- **Phase 13**: Events feature must be complete
- **Phase 14**: Recurring events should be complete for full feature parity
- **OAuth Setup**: Requires developer accounts with Google and Microsoft
- **SSL Certificate**: Required for OAuth redirect URLs (https://)

## Security Considerations

1. **Token Storage**: All access/refresh tokens encrypted at rest using AES-256
2. **Token Transmission**: Always use HTTPS for API calls
3. **OAuth State Parameter**: Include CSRF protection token
4. **Scope Minimization**: Request only necessary calendar permissions
5. **Token Rotation**: Refresh tokens proactively before expiry
6. **Audit Logging**: Log all sync operations for security review

## Success Criteria

- ✅ Users can connect Google and Outlook calendars via OAuth
- ✅ Events sync bidirectionally with <1 minute delay
- ✅ Conflicts are detected and presented with clear resolution UI
- ✅ Recurring events sync correctly in both directions
- ✅ Token refresh happens automatically without user intervention
- ✅ Sync errors are gracefully handled with user notifications
- ✅ Performance: 1000 events sync in <10 seconds
- ✅ Security: Tokens encrypted, OAuth best practices followed

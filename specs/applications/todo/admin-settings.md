# Feature Specification: Admin Settings & Preferences

**Feature ID**: `010-admin-settings`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: All previous features

## Overview

Centralized settings page for administrators and users to configure application preferences, feature toggles, notification settings, display options, and system configuration. Settings are organized into logical sections with clear descriptions.

## Rationale

As the application grows with more features (recurring events, calendar integrations, sharing, categories), **users need control** over:
- Which features are enabled
- How notifications behave
- Display preferences (date formats, time zones, themes)
- Privacy and security settings

**Business Value**:
- Empowers users with customization
- Reduces support requests (users self-configure)
- Enables feature rollout control (gradual rollout with toggles)
- Improves accessibility (users adjust to their needs)

## Settings Structure

### Navigation

```
┌────────────────────────────────────────────┐
│ Settings                                   │
├────────────────────────────────────────────┤
│ 👤 Profile                                 │
│ 🔔 Notifications                           │
│ 📅 Calendar & Time                         │
│ 🎨 Appearance                              │
│ 🔐 Privacy & Security                      │
│ 🔌 Integrations                            │
│ 🧩 Features                                │
│ ⚙️  Advanced                               │
└────────────────────────────────────────────┘
```

### Settings Categories

#### 1. Profile Settings
- Name, email, username
- Profile picture upload
- Bio/description
- Account deletion

#### 2. Notification Settings
- Email notifications (event reminders, task due, calendar sync)
- In-app notifications
- Notification frequency (immediate, digest, none)
- Do Not Disturb schedule

#### 3. Calendar & Time Settings
- Default time zone
- Time format (12h/24h)
- Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Week starts on (Monday/Sunday)
- Default event duration
- Default reminder time

#### 4. Appearance Settings
- Theme (Light, Dark, System)
- Colour scheme (preset or custom)
- Compact mode (more events per screen)
- Font size (Small, Medium, Large)
- Accessibility: High contrast mode

#### 5. Privacy & Security Settings
- Two-factor authentication (2FA)
- Active sessions management
- Export data (GDPR compliance)
- Delete account
- Activity log

#### 6. Integration Settings
- Connected calendars (Google, Outlook, iCloud)
- API keys for third-party integrations
- Webhook configuration
- Sync frequency

#### 7. Feature Toggles
- Enable/disable recurring events
- Enable/disable event invitations
- Enable/disable calendar sharing
- Enable/disable categories & tags
- Enable/disable dashboard widgets

#### 8. Advanced Settings
- Data export/import
- Developer mode (API access)
- Experimental features
- Reset to defaults

## User Scenarios & Testing

### User Story 1 - Update Profile Information (Priority: P1)

**Why this priority**: Basic functionality - users must be able to edit their profile.

**Independent Test**: Update name, email, profile picture, verify changes persist.

**Acceptance Scenarios**:

1. **Given** profile settings page, **When** user updates name, **Then** name displays throughout app immediately
2. **Given** profile picture upload, **When** user selects image, **Then** preview shows before saving
3. **Given** invalid email format, **When** user tries to save, **Then** validation error displays
4. **Given** profile changes, **When** user saves, **Then** success message displays and changes persist
5. **Given** profile picture, **When** user clicks "Remove", **Then** reverts to initials avatar

### User Story 2 - Configure Notifications (Priority: P1)

**Why this priority**: Essential for UX - users need control over notification noise.

**Independent Test**: Toggle notification settings, verify emails stop/start accordingly.

**Acceptance Scenarios**:

1. **Given** notification settings, **When** user disables event reminders, **Then** no reminder emails sent
2. **Given** daily digest selected, **When** day passes, **Then** one summary email sent at configured time
3. **Given** Do Not Disturb schedule (10pm-8am), **When** event occurs at 11pm, **Then** no notification sent
4. **Given** in-app notifications enabled, **When** event approaches, **Then** toast notification appears
5. **Given** notification preferences, **When** user clicks "Test Notification", **Then** sample notification sent immediately

### User Story 3 - Customize Appearance (Priority: P2)

**Why this priority**: Personalization - users want control over UI aesthetics.

**Independent Test**: Change theme, font size, colour scheme, verify changes apply globally.

**Acceptance Scenarios**:

1. **Given** appearance settings, **When** user selects "Dark" theme, **Then** entire app switches to dark mode
2. **Given** colour scheme picker, **When** user selects custom primary colour, **Then** buttons and links update
3. **Given** font size "Large" selected, **When** viewing app, **Then** all text scales proportionally
4. **Given** high contrast mode enabled, **When** viewing, **Then** borders and focus indicators are more prominent
5. **Given** compact mode enabled, **When** viewing calendar, **Then** more events fit per screen

### User Story 4 - Manage Feature Toggles (Priority: P2)

**Why this priority**: Gives users control over complexity - not everyone needs all features.

**Independent Test**: Disable recurring events feature, verify UI elements hidden.

**Acceptance Scenarios**:

1. **Given** feature toggles, **When** user disables "Recurring Events", **Then** recurrence options disappear from event form
2. **Given** categories disabled, **When** viewing calendar, **Then** category filters and pickers are hidden
3. **Given** dashboard widgets disabled, **When** viewing dashboard, **Then** only task list displays (no widgets)
4. **Given** calendar sharing disabled, **When** viewing calendar, **Then** "Share" button is hidden
5. **Given** feature re-enabled, **When** toggling back on, **Then** UI elements reappear without page refresh

### User Story 5 - Export User Data (Priority: P2)

**Why this priority**: GDPR compliance - users have right to data portability.

**Independent Test**: Request data export, verify JSON/CSV file contains all user data.

**Acceptance Scenarios**:

1. **Given** privacy settings, **When** user clicks "Export Data", **Then** processing message displays
2. **Given** export request, **When** processing completes, **Then** download link sent via email
3. **Given** export file, **When** user opens, **Then** JSON contains all tasks, events, categories, settings
4. **Given** export includes personal data, **When** viewing file, **Then** email, name, dates are present
5. **Given** large dataset (1000+ events), **When** exporting, **Then** completes in <30 seconds

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
interface UserSettings {
  id: string;
  userId: string;
  
  // Notification Settings
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  notificationFrequency: 'immediate' | 'digest' | 'none';
  digestTime: string; // HH:MM
  doNotDisturbStart?: string; // HH:MM
  doNotDisturbEnd?: string; // HH:MM
  
  // Calendar & Time Settings
  defaultTimezone: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'UK' | 'US' | 'ISO';
  weekStartsOn: 'monday' | 'sunday';
  defaultEventDuration: number; // minutes
  defaultReminderTime: number; // minutes before event
  
  // Appearance Settings
  theme: 'light' | 'dark' | 'system';
  primaryColor?: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  highContrastMode: boolean;
  
  // Feature Toggles
  recurringEventsEnabled: boolean;
  eventInvitationsEnabled: boolean;
  calendarSharingEnabled: boolean;
  categoriesEnabled: boolean;
  dashboardWidgetsEnabled: boolean;
  
  // Privacy Settings
  twoFactorEnabled: boolean;
  
  updatedAt: Date;
}

interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}
```

**Service Layer**:
- `UserSettingsService` - CRUD for user settings
- `DataExportService` - Generate user data exports
- `NotificationPreferencesService` - Manage notification settings
- `FeatureToggleService` - Check if features are enabled for user

**API Endpoints**:
- `GET /api/v1/settings` - Get user settings
- `PUT /api/v1/settings` - Update user settings
- `POST /api/v1/settings/reset` - Reset to defaults
- `POST /api/v1/data/export` - Request data export
- `GET /api/v1/data/export/:id` - Get export status
- `POST /api/v1/settings/test-notification` - Send test notification

**Background Jobs**:
- `GenerateDataExportJob` - Creates export files
- `CleanupExpiredExportsJob` - Removes old export files
- `SendDigestNotificationsJob` - Sends daily digest emails

### Frontend Components

**UI Pages**:
- `SettingsPage` - Main settings layout with tabs
- `ProfileSettingsTab` - Profile information
- `NotificationSettingsTab` - Notification preferences
- `CalendarTimeSettingsTab` - Calendar and time preferences
- `AppearanceSettingsTab` - Theme and display settings
- `PrivacySettingsTab` - Privacy and security settings
- `IntegrationSettingsTab` - Connected services
- `FeatureTogglesTab` - Enable/disable features
- `AdvancedSettingsTab` - Advanced configuration

**Components**:
- `SettingSection` - Reusable section with title and description
- `SettingToggle` - Switch for boolean settings
- `SettingSelect` - Dropdown for enum settings
- `SettingInput` - Text input for string settings
- `ColorPicker` - Custom color selection
- `TimezonePicker` - Searchable timezone selector

**State Management**:
- Settings stored in context (global state)
- Changes saved with debounce (500ms delay)
- Optimistic updates for instant feedback

## Task Breakdown: Phase 21 - Admin Settings (3 weeks)

### Week 1: Backend Foundation (Days 1-5)

**Database Schema**
- [ ] T946 [P] Create UserSettings entity - 3h
- [ ] T947 [P] Create DataExportRequest entity - 2h
- [ ] T948 Create EF Core migrations - 1h
- [ ] T949 Apply migrations and verify schema - 1h

**User Settings Service**
- [ ] T950 Create UserSettingsService - 5h
- [ ] T951 Implement GetUserSettings method - 2h
- [ ] T952 Implement UpdateUserSettings method - 4h
- [ ] T953 Implement ResetToDefaults method - 3h
- [ ] T954 Implement seed default settings for new users - 3h
- [ ] T955 Write unit tests for settings service (15 tests) - 5h

**Data Export Service**
- [ ] T956 Create DataExportService - 5h
- [ ] T957 Implement GenerateExport method - 6h
- [ ] T958 Implement GetExportStatus method - 2h
- [ ] T959 Create export file format (JSON) - 3h
- [ ] T960 Write unit tests for export service (12 tests) - 4h

**Feature Toggle Service**
- [ ] T961 Create FeatureToggleService - 3h
- [ ] T962 Implement IsFeatureEnabled method - 2h
- [ ] T963 Update existing services to check feature flags - 4h
- [ ] T964 Write unit tests for feature toggle service (10 tests) - 3h

**Background Jobs**
- [ ] T965 Create GenerateDataExportJob - 4h
- [ ] T966 Create CleanupExpiredExportsJob - 2h
- [ ] T967 Configure job scheduling - 2h
- [ ] T968 Write unit tests for background jobs (8 tests) - 3h

**Checkpoint**: Backend services operational

### Week 2: API & Frontend Services (Days 6-10)

**API Endpoints**
- [ ] T969 Create SettingsController - 4h
- [ ] T970 GET /api/v1/settings endpoint - 2h
- [ ] T971 PUT /api/v1/settings endpoint - 3h
- [ ] T972 POST /api/v1/settings/reset endpoint - 2h
- [ ] T973 POST /api/v1/settings/test-notification endpoint - 3h
- [ ] T974 Create DataExportController - 3h
- [ ] T975 POST /api/v1/data/export endpoint - 3h
- [ ] T976 GET /api/v1/data/export/:id endpoint - 2h
- [ ] T977 Write integration tests for settings endpoints (15 tests) - 5h

**Frontend TypeScript Types**
- [ ] T978 [P] Create UserSettings interface - 2h
- [ ] T979 [P] Create NotificationFrequency enum - 1h
- [ ] T980 [P] Create Theme enum - 1h

**Frontend Service**
- [ ] T981 Create settingsService.ts - 5h
- [ ] T982 Create dataExportService.ts - 3h
- [ ] T983 Write service tests (12 tests) - 4h

**Settings Context**
- [ ] T984 Create SettingsContext - 5h
- [ ] T985 Implement settings loading on app start - 3h
- [ ] T986 Implement debounced settings save - 3h
- [ ] T987 Add feature toggle checks throughout app - 5h

**Checkpoint**: API complete, frontend services ready

### Week 3: UI & Polish (Days 11-15)

**Settings Page Structure**
- [ ] T988 Create SettingsPage layout with tabs - 6h
- [ ] T989 Create SettingSection component - 3h
- [ ] T990 Create SettingToggle component - 3h
- [ ] T991 Create SettingSelect component - 3h
- [ ] T992 Create SettingInput component - 3h

**Profile Settings Tab**
- [ ] T993 Create ProfileSettingsTab - 5h
- [ ] T994 Implement profile picture upload - 4h
- [ ] T995 Implement name/email editing - 3h

**Notification Settings Tab**
- [ ] T996 Create NotificationSettingsTab - 6h
- [ ] T997 Create TimePicker for digest time - 4h
- [ ] T998 Implement Do Not Disturb schedule picker - 4h
- [ ] T999 Add "Test Notification" button - 2h

**Calendar & Time Settings Tab**
- [ ] T1000 Create CalendarTimeSettingsTab - 6h
- [ ] T1001 Create TimezonePicker component - 5h
- [ ] T1002 Implement time/date format selectors - 3h

**Appearance Settings Tab**
- [ ] T1003 Create AppearanceSettingsTab - 6h
- [ ] T1004 Create ThemeSelector component - 4h
- [ ] T1005 Create ColorPicker component - 5h
- [ ] T1006 Implement font size selector - 3h

**Privacy Settings Tab**
- [ ] T1007 Create PrivacySettingsTab - 5h
- [ ] T1008 Create "Export Data" section - 4h
- [ ] T1009 Create "Delete Account" section with confirmation - 4h

**Feature Toggles Tab**
- [ ] T1010 Create FeatureTogglesTab - 6h
- [ ] T1011 Add feature descriptions and warnings - 3h
- [ ] T1012 Implement feature toggle effects (hide/show UI) - 5h

**Testing**
- [ ] T1013 Write component tests for settings UI (20 tests) - 6h
- [ ] T1014 Write E2E test for profile settings - 4h
- [ ] T1015 Write E2E test for notification settings - 4h
- [ ] T1016 Write E2E test for appearance settings - 4h
- [ ] T1017 Write E2E test for feature toggles - 4h
- [ ] T1018 Write E2E test for data export - 4h

**Documentation**
- [ ] T1019 Write user guide for settings - 4h
- [ ] T1020 Document feature toggle system - 3h
- [ ] T1021 Create data export format specification - 2h

**Final Review**
- [ ] T1022 Accessibility audit (keyboard nav, screen readers) - 4h
- [ ] T1023 Performance testing (settings load time) - 2h
- [ ] T1024 Code review and refactoring - 4h

**Checkpoint**: Complete admin settings feature

## Effort Summary

**Total Tasks**: 79 tasks (T946-T1024)  
**Total Estimated Time**: ~200 hours (3 weeks)  
**Feature Priorities**:
- Profile settings: P1 (basic functionality)
- Notification settings: P1 (user control)
- Appearance settings: P2 (personalization)
- Feature toggles: P2 (complexity management)
- Data export: P2 (compliance)

## Dependencies

- **All previous phases**: Settings control all features
- **Email Service**: For test notifications and digest emails
- **File Storage**: For data export downloads (S3 or local)

## Security Considerations

1. **2FA Implementation**: Use TOTP (Time-based One-Time Password)
2. **Session Management**: Display active sessions with revoke ability
3. **Data Export**: Secure download links with expiry (24 hours)
4. **Account Deletion**: Soft delete with 30-day grace period
5. **Activity Log**: Audit trail for sensitive settings changes

## Success Criteria

- ✅ All settings persist across sessions
- ✅ Settings changes apply immediately (no page refresh)
- ✅ Feature toggles hide/show UI elements correctly
- ✅ Data export completes in <1 minute for typical user
- ✅ Notification preferences respected (no unwanted emails)
- ✅ Theme changes apply globally without flicker
- ✅ Settings page loads in <500ms
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Mobile: Settings page responsive and usable on all devices

## Future Enhancements (Phase 2)

- **Settings Presets**: "Work Mode", "Focus Mode", "Vacation Mode"
- **Settings Sync**: Sync settings across devices
- **Import Settings**: Import from other calendar apps
- **Advanced Filters**: Configure default filters for calendar view
- **Keyboard Shortcuts**: Customize keyboard shortcuts
- **Locale Settings**: Language and region preferences
- **Backup Scheduling**: Automatic daily/weekly backups

# Feature Specification: Event Invitations & RSVPs

**Feature ID**: `007-event-invitations`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: Events Feature (Phase 13), Email System

## Overview

Enable users to invite others to events and track RSVPs. Invitations are sent via email with links to respond. Attendees can accept, decline, or tentatively respond. Event creators see RSVP status in real-time.

## Rationale

Events without invitations are just personal reminders. True collaboration requires:
- Sending invitations to multiple people
- Tracking who's attending
- Sending automatic reminders
- Updating everyone when event details change

**Business Value**:
- Transforms app from personal tool to team collaboration platform
- Reduces back-and-forth email coordination
- Provides clear attendance visibility
- Increases app adoption (invitees become new users)

## Core Concepts

### Attendee Model

```typescript
interface Attendee {
  id: string;
  eventId: string;
  email: string;
  name: string;
  status: RSVPStatus;
  responseDate?: Date;
  isOrganizer: boolean;
  userId?: string; // Populated if they have an account
}

enum RSVPStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
  Tentative = 'tentative',
}
```

### Invitation Flow

1. **Event Creator** adds attendee emails when creating/editing event
2. **System** sends invitation email with:
   - Event details (title, time, location, description)
   - RSVP links (Accept, Decline, Tentative)
   - Add to Calendar link
   - View Event link (if they have an account)
3. **Invitee** clicks RSVP link → lands on response page
4. **System** updates attendee status, notifies organizer
5. **Organizer** sees updated attendance list in event details

### Email Templates

**Invitation Email**:
```
Subject: [Name] invited you to: [Event Title]

Hi [Attendee Name],

You've been invited to:

📅 Event: [Title]
🕐 When: [Date & Time]
📍 Where: [Location]

[Description]

Will you attend?

[Accept] [Tentative] [Decline]

[Add to Google Calendar] [Add to Outlook]

---
Powered by To Do App
```

**RSVP Confirmation Email**:
```
Subject: RSVP Confirmed: [Event Title]

Your response has been recorded:

Status: ✅ Accepted (or ⏳ Tentative, ❌ Declined)

Event: [Title]
When: [Date & Time]

[View Event Details] [Change Response]

---
Powered by To Do App
```

**Event Update Email** (sent when event details change):
```
Subject: Updated: [Event Title]

[Name] has updated the event details:

Changed:
- Time: [Old Time] → [New Time]
- Location: [Old Location] → [New Location]

[View Full Details] [Update Your RSVP]
```

## User Scenarios & Testing

### User Story 1 - Invite Attendees (Priority: P1)

**Why this priority**: Foundation - users must be able to send invitations.

**Independent Test**: Create event with 5 attendees, verify invitation emails sent to all.

**Acceptance Scenarios**:

1. **Given** event creation form, **When** user adds attendee emails, **Then** email inputs validate and show added attendees
2. **Given** event with 3 attendees, **When** user saves event, **Then** 3 invitation emails are sent
3. **Given** invalid email address, **When** user tries to add, **Then** validation error displays
4. **Given** duplicate email, **When** user adds same email twice, **Then** system prevents duplicate and shows message
5. **Given** existing event, **When** user edits and adds 2 more attendees, **Then** only new attendees receive invitations

### User Story 2 - Respond to Invitation (Priority: P1)

**Why this priority**: Core functionality - invitees need to respond.

**Independent Test**: Send invitation, click RSVP link, verify status updates and confirmation email sent.

**Acceptance Scenarios**:

1. **Given** invitation email, **When** user clicks "Accept", **Then** lands on confirmation page showing accepted status
2. **Given** RSVP page, **When** user submits response, **Then** confirmation email is sent immediately
3. **Given** accepted invitation, **When** user clicks "Change Response" link, **Then** can update to Declined/Tentative
4. **Given** declined invitation, **When** organizer views event, **Then** attendee shows with red "Declined" badge
5. **Given** non-user RSVP, **When** submitting response, **Then** system creates guest attendee record (no account required)

### User Story 3 - View Attendee List (Priority: P1)

**Why this priority**: Organizers need visibility into who's attending.

**Independent Test**: Create event with 10 attendees, verify all statuses display correctly in event details.

**Acceptance Scenarios**:

1. **Given** event with attendees, **When** organizer views event, **Then** attendee list displays with status badges
2. **Given** attendee list, **When** viewing, **Then** accepted attendees appear at top, declined at bottom
3. **Given** attendee list, **When** hovering over attendee, **Then** tooltip shows email and response date
4. **Given** 10 attendees, **When** 7 accept, **Then** summary shows "7 of 10 attending"
5. **Given** pending responses, **When** viewing, **Then** "Awaiting response" badge shows with grey colour

### User Story 4 - Event Updates (Priority: P2)

**Why this priority**: Changes to event details must reach all attendees.

**Independent Test**: Edit event time/location, verify update emails sent to all attendees.

**Acceptance Scenarios**:

1. **Given** event with 5 attendees, **When** organizer changes time, **Then** 5 update emails are sent
2. **Given** update email, **When** viewing, **Then** changes are highlighted (old → new)
3. **Given** attendee declined, **When** event updated, **Then** they still receive update email (in case they reconsider)
4. **Given** minor update (description only), **When** saved, **Then** organizer can choose "Notify attendees" checkbox
5. **Given** event cancelled, **When** organizer deletes event, **Then** cancellation email sent to all

### User Story 5 - Reminders (Priority: P2)

**Why this priority**: Users need reminders before events.

**Independent Test**: Create event 24 hours in future, verify reminder emails sent to accepted attendees.

**Acceptance Scenarios**:

1. **Given** event 24 hours away, **When** reminder job runs, **Then** reminder emails sent to accepted/tentative attendees
2. **Given** declined attendee, **When** reminder sent, **Then** they do NOT receive reminder email
3. **Given** reminder email, **When** viewing, **Then** includes "in 24 hours" prominent message
4. **Given** event with location, **When** reminder sent, **Then** location link opens in Google Maps
5. **Given** recurring event, **When** reminders sent, **Then** only next occurrence triggers reminder

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
interface EventAttendee {
  id: string;
  eventId: string;
  email: string;
  name: string;
  status: RSVPStatus;
  responseDate?: Date;
  isOrganizer: boolean;
  userId?: string;
  invitationToken: string; // For RSVP links
  createdAt: Date;
  updatedAt: Date;
}

interface EventInvitation {
  id: string;
  eventId: string;
  attendeeId: string;
  sentAt: Date;
  emailStatus: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
}
```

**Service Layer**:
- `EventInvitationService` - Manages invitations and RSVPs
- `EmailService` - Sends invitation/update/reminder emails
- `AttendeeService` - Manages attendee CRUD operations
- `RSVPService` - Handles RSVP responses

**API Endpoints**:
- `POST /api/v1/events/:id/attendees` - Add attendees to event
- `GET /api/v1/events/:id/attendees` - Get attendee list
- `DELETE /api/v1/events/:id/attendees/:attendeeId` - Remove attendee
- `PUT /api/v1/rsvp/:token` - Respond to invitation (public endpoint)
- `GET /api/v1/rsvp/:token` - Get invitation details (public endpoint)
- `POST /api/v1/events/:id/send-invitations` - Manually resend invitations

**Background Jobs**:
- `SendEventRemindersJob` - Runs hourly, sends 24-hour reminders
- `ProcessPendingInvitationsJob` - Runs every 5 minutes, retries failed sends
- `CleanupExpiredInvitationsJob` - Runs daily, archives old invitations

### Frontend Components

**UI Pages**:
- `EventAttendeesSection` - Attendee list in event details
- `AddAttendeeModal` - Add attendees to existing event
- `RSVPResponsePage` - Public page for responding to invitation
- `AttendeeCard` - Individual attendee display

**State Management**:
- Track attendee list in event details
- Real-time RSVP updates (polling or WebSocket)

**Email Integration**:
- Use existing email service (SendGrid/AWS SES)
- Template system for invitation emails
- Support HTML and plain text versions

## Task Breakdown: Phase 18 - Event Invitations (4 weeks)

### Week 1: Backend Foundation (Days 1-5)

**Database Schema**
- [ ] T716 [P] Create EventAttendee entity - 2h
- [ ] T717 [P] Create EventInvitation entity - 2h
- [ ] T718 Create EF Core migrations - 1h
- [ ] T719 Apply migrations and verify schema - 1h

**Attendee Service**
- [ ] T720 Create AttendeeService - 4h
- [ ] T721 Implement AddAttendee method - 3h
- [ ] T722 Implement RemoveAttendee method - 2h
- [ ] T723 Implement GetEventAttendees method - 2h
- [ ] T724 Implement UpdateAttendeeStatus method - 3h
- [ ] T725 Write unit tests for attendee service (15 tests) - 5h

**Email Service Setup**
- [ ] T726 Create email templates (invitation, confirmation, update) - 4h
- [ ] T727 Implement SendInvitationEmail method - 3h
- [ ] T728 Implement SendConfirmationEmail method - 2h
- [ ] T729 Implement SendUpdateEmail method - 3h
- [ ] T730 Implement SendReminderEmail method - 2h
- [ ] T731 Write unit tests for email service (12 tests) - 4h

**Checkpoint**: Backend foundation ready

### Week 2: RSVP System (Days 6-10)

**RSVP Service**
- [ ] T732 Create RSVPService - 4h
- [ ] T733 Implement token generation and validation - 3h
- [ ] T734 Implement RecordRSVP method - 4h
- [ ] T735 Implement GetInvitationDetails method - 3h
- [ ] T736 Implement UpdateRSVP method - 3h
- [ ] T737 Write unit tests for RSVP service (15 tests) - 5h

**Event Invitation Service**
- [ ] T738 Create EventInvitationService - 4h
- [ ] T739 Implement SendInvitations method - 5h
- [ ] T740 Implement HandleEventUpdate (send update emails) - 5h
- [ ] T741 Implement HandleEventCancellation - 3h
- [ ] T742 Write unit tests for invitation service (15 tests) - 5h

**Background Jobs**
- [ ] T743 Create SendEventRemindersJob - 4h
- [ ] T744 Create ProcessPendingInvitationsJob - 3h
- [ ] T745 Create CleanupExpiredInvitationsJob - 2h
- [ ] T746 Configure job scheduling - 2h
- [ ] T747 Write unit tests for background jobs (10 tests) - 4h

**Checkpoint**: RSVP system operational

### Week 3: API & Frontend (Days 11-15)

**API Endpoints**
- [ ] T748 Create EventAttendeesController - 3h
- [ ] T749 POST /api/v1/events/:id/attendees endpoint - 3h
- [ ] T750 GET /api/v1/events/:id/attendees endpoint - 2h
- [ ] T751 DELETE /api/v1/events/:id/attendees/:id endpoint - 2h
- [ ] T752 Create RSVPController (public endpoints) - 3h
- [ ] T753 GET /api/v1/rsvp/:token endpoint - 2h
- [ ] T754 PUT /api/v1/rsvp/:token endpoint - 3h
- [ ] T755 Write integration tests for attendee endpoints (12 tests) - 4h
- [ ] T756 Write integration tests for RSVP endpoints (10 tests) - 4h

**Frontend TypeScript Types**
- [ ] T757 [P] Create Attendee interface - 1h
- [ ] T758 [P] Create RSVPStatus enum - 1h
- [ ] T759 [P] Create EventInvitation interface - 1h

**Frontend Service**
- [ ] T760 Create attendeeService.ts - 4h
- [ ] T761 Create rsvpService.ts - 3h
- [ ] T762 Write service tests (10 tests) - 3h

**Checkpoint**: API complete, frontend services ready

### Week 4: UI & Polish (Days 16-20)

**Frontend Components**
- [ ] T763 Create EventAttendeesSection component - 6h
- [ ] T764 Create AddAttendeeModal component - 5h
- [ ] T765 Create AttendeeCard component - 4h
- [ ] T766 Create RSVPStatusBadge component - 2h
- [ ] T767 Create RSVPResponsePage (public page) - 6h
- [ ] T768 Integrate attendees into EventForm - 4h
- [ ] T769 Update Event details page with attendee section - 3h

**Email Templates**
- [ ] T770 Design HTML email templates (invitation, confirmation, update) - 5h
- [ ] T771 Test email rendering across clients (Gmail, Outlook, etc.) - 3h
- [ ] T772 Add plain text fallbacks - 2h

**Integration**
- [ ] T773 Hook up invitation sending on event creation - 3h
- [ ] T774 Hook up update emails on event edit - 3h
- [ ] T775 Hook up cancellation emails on event delete - 2h

**Testing**
- [ ] T776 Write component tests for attendee UI (12 tests) - 4h
- [ ] T777 Write E2E test for adding attendees - 4h
- [ ] T778 Write E2E test for RSVP flow - 5h
- [ ] T779 Write E2E test for event updates - 4h
- [ ] T780 Test email delivery with real email provider - 3h

**Documentation**
- [ ] T781 Write user guide for event invitations - 3h
- [ ] T782 Document RSVP system architecture - 2h
- [ ] T783 Create email template customization guide - 2h

**Final Review**
- [ ] T784 Security audit (token validation, email verification) - 3h
- [ ] T785 Performance testing (100 attendees per event) - 3h
- [ ] T786 Code review and refactoring - 4h

**Checkpoint**: Complete event invitations feature

## Effort Summary

**Total Tasks**: 71 tasks (T716-T786)  
**Total Estimated Time**: ~185 hours (4 weeks)  
**Feature Priorities**:
- Send invitations: P1 (core functionality)
- RSVP responses: P1 (core functionality)
- Attendee list display: P1 (visibility)
- Event updates: P2 (important)
- Reminders: P2 (helpful)

## Dependencies

- **Phase 13**: Events feature must be complete
- **Email Service**: Requires SendGrid/AWS SES account
- **Email Templates**: Professional HTML email design
- **Domain Setup**: SPF/DKIM records for email deliverability

## Security Considerations

1. **RSVP Tokens**: Cryptographically secure, single-use tokens
2. **Rate Limiting**: Limit invitation sends to prevent spam
3. **Email Validation**: Verify email addresses before sending
4. **Public Endpoints**: RSVP endpoints are public, must be secure
5. **Token Expiry**: RSVP tokens expire after 30 days
6. **Spam Prevention**: Implement CAPTCHA for public RSVP page

## Success Criteria

- ✅ Users can add unlimited attendees to events
- ✅ Invitation emails sent within 1 minute of event creation
- ✅ RSVP responses update in real-time
- ✅ Attendee list displays with correct status badges
- ✅ Update emails sent when event details change
- ✅ Reminder emails sent 24 hours before event
- ✅ Email deliverability: >95% success rate
- ✅ RSVP page works without requiring account
- ✅ Performance: 100 attendees per event handled gracefully

## Future Enhancements (Phase 2)

- **Group Invitations**: Send to mailing lists or groups
- **Custom Reminders**: Configure reminder timing (1 hour, 1 day, 1 week)
- **Attendee Notes**: Add notes about dietary restrictions, etc.
- **Waitlist**: Limit attendees with waitlist for popular events
- **Calendar File Attachments**: Include .ics file in invitation email
- **SMS Reminders**: Send text messages in addition to email
- **Guest Plus-Ones**: Allow attendees to bring guests

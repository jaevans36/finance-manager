# Consolidated Roadmap: Integrated Feature Plan

**Last Updated**: 2026-03-08
**Purpose**: Integrate new features into existing phases for faster implementation

## Current Status

- **Phase 1–13**: Complete ✅ (Events foundation fully delivered)
- **Phase 48–51**: Complete ✅ (Tailwind + shadcn/ui, TanStack Query, React Hook Form + Zod)
- **Phase 55–57**: Complete ✅ (Status workflow + WIP limits, Eisenhower Matrix, Energy tagging)
- **Phase 50**: In Progress 🔄 (test infrastructure alignment + query migration)
- **Phase 14+**: Planned — see phases below for detail

## Reorganized Phase Structure

### Phase 13: Events Foundation ✅ COMPLETE

**Delivered**: Full events CRUD with RRULE-based recurrence, calendar integration, backend + frontend testing complete.

---

### Phase 14: Categories & Event Invitations (4 weeks)

**Purpose**: Combine event organization with collaboration features

#### Week 1-2: Event Categories & Tags (from spec 009)
- Categories for events (Work, Personal, Family, etc.)
- Flexible tagging system
- Color-coding and filtering
- **Tasks**: T863-T945 (selected subset: ~40 tasks)
- **Effort**: 2 weeks

#### Week 3-4: Event Invitations (from spec 007)
- Send event invitations via email
- RSVP tracking (Accept/Decline/Tentative)
- Attendee management
- **Tasks**: T716-T786 (core features only: ~35 tasks)
- **Effort**: 2 weeks

**Why Combined**: Categories are needed before invitations (categorize event types for invitees)

---

### Phase 15: Recurring Events & Dashboard Widgets (5 weeks)

**Purpose**: Advanced scheduling + improved dashboard experience

#### Week 1-3: Recurring Events (from spec 003)
- RRULE-based recurrence patterns
- Edit scope (this/future/all occurrences)
- Exception handling
- **Tasks**: T428-T489 (core recurrence: ~40 tasks)
- **Effort**: 3 weeks

#### Week 4-5: Dashboard Widgets (from spec 005)
- Clock/date widget, upcoming events, quick calculator
- Task statistics widget
- Widget customization
- **Tasks**: T568-T647 (MVP widgets: ~35 tasks)
- **Effort**: 2 weeks

**Why Combined**: Recurring events create more dashboard data to display in widgets

---

### Phase 16: Global Header & Notifications (3 weeks)

**Purpose**: Consistent navigation + real-time awareness

#### Week 1-2: Global Navigation Header (from spec 006)
- Persistent header with navigation
- Real-time clock display
- User menu
- **Tasks**: T648-T715 (core header: ~30 tasks)
- **Effort**: 2 weeks

#### Week 3: Notification System (integrated)
- Notification centre in header
- Event reminders, task due notifications
- Background jobs for reminders
- **Tasks**: Selected from T648-T715 (notification subset: ~15 tasks)
- **Effort**: 1 week

**Why Combined**: Header provides the UI location for notifications

---

### Phase 17: Calendar Sharing & Integrations (6 weeks)

**Purpose**: Collaboration + third-party ecosystem

#### Week 1-3: Calendar Sharing (from spec 008)
- Share calendars with view/edit permissions
- Link-based sharing
- Permission management
- **Tasks**: T787-T862 (core sharing: ~40 tasks)
- **Effort**: 3 weeks

#### Week 4-6: Calendar Integrations (from spec 004)
- Google Calendar sync (priority)
- Microsoft Outlook sync
- Two-way synchronization
- **Tasks**: T490-T567 (Google + Outlook only: ~45 tasks)
- **Effort**: 3 weeks

**Why Combined**: Sharing internal calendars complements syncing with external calendars

---

### Phase 18: Settings & Modularization (4 weeks)

**Purpose**: User control + architectural foundation for plugins

#### Week 1-2: Admin Settings (from spec 010)
- Centralized settings page
- Notification preferences, appearance
- Feature toggles, data export
- **Tasks**: T946-T1024 (MVP settings: ~35 tasks)
- **Effort**: 2 weeks

#### Week 3-4: Feature Modularization (from spec 011)
- Module registry and enable/disable
- Refactor existing features as modules
- Plugin architecture foundation
- **Tasks**: T1025-T1110 (core modularity: ~40 tasks)
- **Effort**: 2 weeks

**Why Combined**: Settings provide UI for enabling/disabling modules

---

### Phase 19: Life Manager (8 weeks) 💰

**Purpose**: The actual Life Manager feature (CSV import, budgeting)

#### Week 1-3: Transaction Import
- CSV upload and parsing
- Duplicate detection
- Auto-categorization
- **Tasks**: T1111-T1144 (~30 tasks)
- **Effort**: 3 weeks

#### Week 4-6: Budgets & Tracking
- Budget creation and tracking
- Budget alerts and performance
- Recurring transaction detection
- **Tasks**: T1145-T1159 (~25 tasks)
- **Effort**: 3 weeks

#### Week 7-8: Insights & Polish
- Financial insights dashboard
- Spending trends, category breakdown
- Testing and optimization
- **Tasks**: T1160-T1224 (~30 tasks)
- **Effort**: 2 weeks

**Why Separate**: This is a major feature deserving full focus

---

## Quick Win Priorities 🚀

If you want to implement features **immediately** after completing Phase 13:

### ⭐ RECOMMENDED PATH: Core UX Enhancement (9 weeks)

**SELECTED BY USER - START HERE** ✅

1. **Dashboard Widgets** (2 weeks) - Improve main interface
   - Clock/date widget, upcoming events, quick calculator
   - Task statistics widget
   - Widget customization
   
2. **Phase 16: Header + Notifications** (3 weeks) - Consistent navigation
   - Global navigation header
   - Real-time notifications
   - User menu
   
3. **Phase 18: Settings + Modularization** (4 weeks) - User control + architecture
   - Centralized settings page
   - Feature toggles
   - Module system foundation

**Result**: Beautiful, consistent, user-controlled interface - best UX improvements!

---

### Alternative Options:

### Option A: Event Collaboration (6 weeks)
1. **Phase 14** (4 weeks): Categories + Invitations
2. **Phase 16** (2 weeks): Header + Notifications

**Result**: Full event collaboration system with invites, categories, notifications

### Option B: Advanced Scheduling (8 weeks)
1. **Phase 15** (5 weeks): Recurring Events + Dashboard Widgets
2. **Phase 16** (3 weeks): Header + Notifications

**Result**: Powerful scheduling with recurrence + beautiful dashboard

### Option C: Enterprise Features (10 weeks)
1. **Phase 17** (6 weeks): Sharing + Calendar Integrations
2. **Phase 18** (4 weeks): Settings + Modularization

**Result**: Team collaboration + enterprise-ready architecture

### Option D: Finance Features (8 weeks)
1. **Phase 19** (8 weeks): Complete Life Manager

**Result**: Personal finance management with budgeting

---

## Comparison: Original vs. Consolidated Plan

| Original Plan | Consolidated Plan | Time Saved |
|---------------|-------------------|------------|
| Phase 14: Recurring (5 weeks) | Phase 15: Recurring + Widgets (5 weeks) | Same |
| Phase 15: Integrations (6 weeks) | Phase 17: Sharing + Integrations (6 weeks) | Same |
| Phase 16: Widgets (5 weeks) | Integrated into Phase 15 | N/A |
| Phase 17: Header (3 weeks) | Phase 16: Header + Notifications (3 weeks) | Same |
| Phase 18: Invitations (4 weeks) | Phase 14: Categories + Invitations (4 weeks) | Same |
| Phase 19: Sharing (4 weeks) | Integrated into Phase 17 | N/A |
| Phase 20: Categories (3 weeks) | Integrated into Phase 14 | N/A |
| Phase 21: Settings (3 weeks) | Phase 18: Settings + Modules (4 weeks) | Same |
| Phase 22: Modules (6 weeks) | Integrated into Phase 18 | N/A |
| Phase 23: Finance (8 weeks) | Phase 19: Finance (8 weeks) | Same |
| **Total: 51 weeks** | **Total: 35 weeks** | **16 weeks saved** |

---

## Benefits of Consolidation

✅ **Faster Delivery**: Features available 16 weeks sooner  
✅ **Logical Grouping**: Related features developed together  
✅ **Better Context**: Developers understand feature relationships  
✅ **Reduced Overhead**: Less context switching between phases  
✅ **Earlier Testing**: Combined features tested together  
✅ **User Value**: Users get complete feature sets, not fragments

---

## Implementation Notes

### For Each Phase:
1. Review both spec documents for the combined phase
2. Follow the task list in order (dependencies managed)
3. Test features independently before integration
4. Document combined features in completion summary

### Task ID Mapping:
- Phase 14: Uses T863-T945 (categories) + T716-T786 (invitations)
- Phase 15: Uses T428-T489 (recurring) + T568-T647 (widgets)
- Phase 16: Uses T648-T715 (header) + notification subset
- Phase 17: Uses T787-T862 (sharing) + T490-T567 (integrations)
- Phase 18: Uses T946-T1024 (settings) + T1025-T1110 (modules)
- Phase 19: Uses T1111-T1224 (finance)

### Testing Strategy:
- Unit tests: Individual feature components
- Integration tests: Features working together in phase
- E2E tests: Complete user workflows across combined features

---

## Next Steps After Phase 13

1. **Complete Phase 13 Testing** (1 week)
   - Backend event tests
   - Frontend event tests  
   - Calendar integration

2. **YOUR SELECTED PATH: Core UX Enhancement** 🎯
   
   **Step 1: Dashboard Widgets (2 weeks)**
   - Review spec: `specs/applications/todo/dashboard-widgets.md`
   - Tasks: T568-T647 (focus on MVP widgets)
   - Branch: `git checkout -b feature/dashboard-widgets`
   - Priority widgets: Clock/Date, Upcoming Events, Task Statistics
   
   **Step 2: Phase 16 - Header + Notifications (3 weeks)**
   - Review spec: `specs/applications/todo/global-navigation-header.md`
   - Tasks: T648-T715
   - Branch: `git checkout -b feature/global-header-notifications`
   - Includes: Navigation, clock, notification centre, user menu
   
   **Step 3: Phase 18 - Settings + Modularization (4 weeks)**
   - Review specs: 
     * `specs/applications/todo/admin-settings.md`
     * `specs/applications/todo/feature-modularization.md`
   - Tasks: T946-T1024 (settings) + T1025-T1110 (modules)
   - Branch: `git checkout -b feature/settings-modules`
   - Includes: Settings page, feature toggles, module architecture

   **Total Timeline**: 9 weeks for complete UX overhaul

3. **After Core UX Complete, Consider**:
   - Phase 14: Categories + Invitations (collaboration features)
   - Phase 15: Recurring Events (advanced scheduling)
   - Phase 17: Sharing + Integrations (enterprise features)
   - Phase 19: Life Manager (business features)

---

## Success Metrics

Track progress with these KPIs:

- **Development Velocity**: Tasks completed per week
- **Code Quality**: Test coverage percentage
- **User Adoption**: Feature usage after release
- **Performance**: Page load times, API response times
- **Satisfaction**: User feedback scores

Update this roadmap monthly as phases complete! 🎉

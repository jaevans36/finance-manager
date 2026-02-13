# Platform Specification Index

**Created**: 2026-01-07  
**Purpose**: Quick reference for locating specifications across the reorganized structure

## Where to Find Features

This index maps features from the original `spec-v2-enhancements.md` to their new locations.

### Phase 1 - Security & Foundation

| User Story | Location |
|------------|----------|
| 1.1 - Password Reset via Email | `platform/authentication.md` |
| 1.2 - Email Verification | `platform/authentication.md` |
| 1.3 - Session Management & Security | `platform/authentication.md` |

**Why Platform?** Authentication is shared infrastructure used by all applications.

### Phase 2 - Organization & Productivity

| User Story | Location |
|------------|----------|
| 2.1 - Advanced Task Filtering | `applications/todo/enhancements.md` |
| 2.2 - Task Search Functionality | `applications/todo/enhancements.md` |
| 2.3 - Bulk Operations | `applications/todo/enhancements.md` |
| 2.4 - Task Notes & Comments | `applications/todo/enhancements.md` |

**Why To Do?** Task-specific features that only apply to the To Do application.

### Phase 3 - User Experience

| User Story | Location |
|------------|----------|
| 3.1 - Dark Mode & Theme Preferences | `platform/design-guidelines.md` (theme system) + `applications/todo/enhancements.md` (implementation) |
| 3.2 - Customizable Dashboard | `applications/todo/enhancements.md` |
| 3.3 - Keyboard Shortcuts | `applications/todo/enhancements.md` |
| 3.4 - Notifications & Reminders | `applications/todo/enhancements.md` |

**Why Split?** Theme system is platform-wide, but To Do-specific customization stays with the app.

### Phase 4 - Insights & Analytics

| User Story | Location |
|------------|----------|
| 4.1 - Task Statistics Dashboard | `applications/todo/enhancements.md` |
| 4.2 - Completion Trends | `applications/todo/enhancements.md` |
| 4.3 - Productivity Insights | `applications/todo/enhancements.md` |
| 4.4 - Weekly Progress Reports | `applications/todo/enhancements.md` |
| 4.5 - Data Export | `applications/todo/enhancements.md` |

**Why To Do?** Analytics specific to task management patterns.

### Phase 5 - Administration & System Management

| User Story | Location |
|------------|----------|
| 5.1 - User Management | `platform/admin-system.md` |
| 5.2 - Target & Goal Management | `platform/admin-system.md` |
| 5.3 - System Analytics & Insights | `platform/admin-system.md` |
| 5.4 - Content Moderation & Data Management | `platform/admin-system.md` |
| 5.5 - System Configuration & Feature Flags | `platform/admin-system.md` |
| 5.6 - Audit Logging & Compliance | `platform/admin-system.md` |
| 5.7 - Notification & Communication Management | `platform/admin-system.md` |
| 5.8 - Role-Based Access Control (RBAC) | `platform/admin-system.md` |

**Why Platform?** Admin features manage the entire platform, not just one application.

### Phase 6 - Application Hub Dashboard

| User Story | Location |
|------------|----------|
| 6.1 - Unified Application Portal | `platform/application-hub.md` |
| 6.2 - Persistent Information Bar | `platform/application-hub.md` |
| 6.3 - Quick Stats Dashboard Widget | `platform/application-hub.md` |
| 6.4 - Application Card Design System | `platform/application-hub.md` |
| 6.5 - Recent Activity Feed | `platform/application-hub.md` |
| 6.6 - Personalized Welcome Experience | `platform/application-hub.md` |
| 6.7 - Application Health & Status Indicators | `platform/application-hub.md` |
| 6.8 - Favourites & Customization | `platform/application-hub.md` |
| 6.9 - Profile Image Management | `platform/authentication.md` |

**Why Platform?** Hub is the portal to all applications. Profile images are shared across platform.

### Phase 7 - Design Guidelines & Standards

| Feature | Location |
|---------|----------|
| Comprehensive Design System Documentation | `platform/design-guidelines.md` |
| Design tokens (colours, typography, spacing) | `platform/design-guidelines.md` |
| Component patterns & standards | `platform/design-guidelines.md` |
| Icon guidelines | `platform/design-guidelines.md` |
| Accessibility standards | `platform/design-guidelines.md` |
| Responsive breakpoints | `platform/design-guidelines.md` |
| Animation guidelines | `platform/design-guidelines.md` |

**Why Platform?** Design system applies to all applications for consistency.

### Phase 8-12 - To Do Advanced Features

| Phase | Location |
|-------|----------|
| Phase 8 - Recurring Tasks | `applications/todo/enhancements.md` |
| Phase 9 - Task Dependencies | `applications/todo/enhancements.md` |
| Phase 10 - Task Templates | `applications/todo/enhancements.md` |
| Phase 11 - Collaboration | `applications/todo/enhancements.md` |
| Phase 12 - Calendar View | `applications/todo/enhancements.md` |

**Why To Do?** Advanced features specific to task management.

### Phase 13 - To Do Design System Overhaul

| Feature | Location |
|---------|----------|
| TaskDetailModal with view/edit modes | `applications/todo/` |
| Icon migration (emoji → Lucide) | `applications/todo/` |
| Design token standardisation | `platform/design-guidelines.md` |

**Why Split?** Design tokens are platform-wide; modal and icon changes are To Do-specific.

### Phase 14-21 - Fitness Application

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 14 | Workout Tracking Foundation | `applications/fitness/spec.md` |
| Phase 15 | Food & Nutrition Diary | `applications/fitness/spec.md` |
| Phase 16 | Body Measurements & Goals | `applications/fitness/spec.md` |
| Phase 17 | Habit Tracking (GitHub Grid) | `applications/fitness/spec.md` |
| Phase 18 | Meditation & Mindfulness | `applications/fitness/spec.md` |
| Phase 19 | Wearable Device Integration | `applications/fitness/spec.md` |
| Phase 20 | Workout Plans & Social | `applications/fitness/spec.md` |
| Phase 21 | Fitness Dashboard | `applications/fitness/spec.md` |

**Tasks**: `applications/fitness/tasks.md` (T800-T924, 125 tasks, ~13 weeks)

### Phase 22-24 - Authentication Service

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 22 | Auth Service Extraction | `platform/authentication-service.md` |
| Phase 23 | OAuth 2.0 Integration | `platform/authentication-service.md` |
| Phase 24 | Sessions & MFA | `platform/authentication-service.md` |

**Tasks**: `platform/authentication-service-tasks.md` (T925-T972, 48 tasks, ~5.5 weeks)

### Phase 25-27 - Microservices Architecture

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 25 | API Gateway (YARP) | `platform/microservices-architecture.md` |
| Phase 26 | Service Isolation & Health | `platform/microservices-architecture.md` |
| Phase 27 | Event Bus & BFF | `platform/microservices-architecture.md` |

**Tasks**: `platform/microservices-tasks.md` (T973-T1008, 36 tasks, ~4 weeks)

### Phase 28-31 - Test Automation & Quality

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 28 | Test Orchestration | `platform/test-automation.md` |
| Phase 29 | Quality Dashboard | `platform/test-automation.md` |
| Phase 30 | Flaky Test Detection & Bug Filing | `platform/test-automation.md` |
| Phase 31 | Performance Monitoring | `platform/test-automation.md` |

**Tasks**: `platform/test-automation-tasks.md` (T1009-T1054, 46 tasks, ~5.5 weeks)

### Phase 32-35 - Weather Application

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 32 | Weather Core (Conditions & Forecast) | `applications/weather/spec.md` |
| Phase 33 | Alerts & Favourite Locations | `applications/weather/spec.md` |
| Phase 34 | Calendar Integration & Widget | `applications/weather/spec.md` |
| Phase 35 | AQI, Radar & Historical Data | `applications/weather/spec.md` |

**Tasks**: `applications/weather/tasks.md` (T1055-T1104, 50 tasks, ~5 weeks)

### Phase 36-37 - Database Abstraction Layer

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 36 | Core Abstraction & PostgreSQL | `platform/database-abstraction.md` |
| Phase 37 | Additional Providers & Monitoring | `platform/database-abstraction.md` |

**Tasks**: `platform/database-abstraction-tasks.md` (T1105-T1126, 22 tasks, ~2.5 weeks)

### Phase 38-40 - Project Rename (Finance Manager → Life Manager)

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 38 | Codebase Rename | `platform/project-rename.md` |
| Phase 39 | Branding & Infrastructure | `platform/project-rename.md` |
| Phase 40 | Documentation Cleanup | `platform/project-rename.md` |

**Tasks**: `platform/project-rename-tasks.md` (T1127-T1154, 28 tasks, ~2 weeks)

### Phase 41-47 - Finance Application

| Phase | Feature | Location |
|-------|---------|----------|
| Phase 41 | Accounts & Transaction Import | `applications/finance/spec.md` |
| Phase 42 | Budgeting | `applications/finance/spec.md` |
| Phase 43 | Bills & Savings Goals | `applications/finance/spec.md` |
| Phase 44 | Financial Dashboard & Reports | `applications/finance/spec.md` |
| Phase 45 | Investment Tracking | `applications/finance/spec.md` |
| Phase 46 | Debt Management & Multi-Currency | `applications/finance/spec.md` |
| Phase 47 | AI Financial Insights | `applications/finance/spec.md` |

**Tasks**: `applications/finance/tasks.md` (T1155-T1256, 102 tasks, ~11 weeks)

## Quick Navigation

### Platform-Wide Features

Go to `platform/` when looking for:
- Authentication & user management
- Centralised authentication service (OAuth, MFA)
- Admin panel specifications
- Application hub (portal/dashboard)
- Design system & UI standards
- Architecture & routing
- Microservices architecture (API gateway, event bus)
- Database abstraction layer
- Test automation & quality monitoring
- Project rename migration
- Shared database schema

### Application-Specific Features

Go to `applications/todo/` when looking for:
- Task management features
- To Do-specific UI components
- Task statistics & analytics
- Calendar view
- Recurring tasks
- Task groups

Go to `applications/fitness/` when looking for:
- Workout tracking & exercise logging
- Food & nutrition diary
- Body measurements & goals
- Habit tracking (GitHub-style grid)
- Meditation & mindfulness
- Wearable device integration

Go to `applications/weather/` when looking for:
- Current weather conditions & forecasts
- Severe weather alerts & notifications
- Favourite locations management
- Air quality index (AQI)
- Radar & satellite imagery
- Historical weather data

Go to `applications/finance/` when looking for:
- Transaction import & management (CSV)
- Budgeting & expense tracking
- Bills & savings goals
- Investment portfolio tracking
- Financial dashboards & reports
- Debt management & payoff planning
- AI-powered financial insights

### Implementation Details

Go to `applications/todo/tasks.md` for:
- Detailed task breakdown
- Implementation order
- Phase dependencies
- Exact file paths

## File Organization Summary

```
specs/
├── README.md                          ← Start here for overview
├── platform/
│   ├── architecture.md               ← Routing, apps, tech stack
│   ├── authentication.md             ← Auth, sessions, profiles
│   ├── authentication-service.md     ← Centralised auth (OAuth, MFA)
│   ├── authentication-service-tasks.md ← Auth tasks (T925-T972)
│   ├── admin-system.md               ← Admin panel (Phase 5)
│   ├── application-hub.md            ← Hub dashboard (Phase 6)
│   ├── design-guidelines.md          ← Design system (Phase 7)
│   ├── database-schema.md            ← Shared database tables
│   ├── database-abstraction.md       ← DB abstraction layer spec
│   ├── database-abstraction-tasks.md ← DB tasks (T1105-T1126)
│   ├── microservices-architecture.md ← Microservices spec
│   ├── microservices-tasks.md        ← Microservices tasks (T973-T1008)
│   ├── test-automation.md            ← Test automation spec
│   ├── test-automation-tasks.md      ← Test tasks (T1009-T1054)
│   ├── project-rename.md             ← Rename to Life Manager
│   └── project-rename-tasks.md       ← Rename tasks (T1127-T1154)
└── applications/
    ├── todo/
    │   ├── spec.md                   ← Core features (Phase 1-4)
    │   ├── enhancements.md           ← Advanced features (Phase 2-12)
    │   ├── tasks.md                  ← Task breakdown
    │   ├── data-model.md             ← Task entities
    │   ├── plan.md                   ← Implementation plan
    │   ├── research.md               ← Technical research
    │   ├── quickstart.md             ← API examples
    │   ├── contracts/                ← API contracts
    │   └── checklists/               ← Testing checklists
    ├── fitness/
    │   ├── spec.md                   ← Fitness app spec (Phase 14-21)
    │   └── tasks.md                  ← Fitness tasks (T800-T924)
    ├── weather/
    │   ├── spec.md                   ← Weather app spec (Phase 32-35)
    │   └── tasks.md                  ← Weather tasks (T1055-T1104)
    └── finance/
        ├── spec.md                   ← Finance app spec (Phase 41-47)
        └── tasks.md                  ← Finance tasks (T1155-T1256)
```

## When Adding New Features

### Is it platform-wide?

**Yes** → Add to `platform/`
- Shared authentication/authorization
- Admin capabilities
- Hub dashboard features
- Design system components
- Cross-application functionality

**No** → Add to `applications/{app-name}/`
- Application-specific features
- App-specific UI components
- App-specific data models
- App-specific business logic

### Not Sure?

Ask yourself:
1. **Does this affect multiple applications?** → Platform
2. **Is this used by admins to manage the system?** → Platform (admin-system.md)
3. **Is this part of the hub/portal?** → Platform (application-hub.md)
4. **Is this a UI component/pattern used everywhere?** → Platform (design-guidelines.md)
5. **Is this specific to task management?** → To Do application
6. **Is this specific to finance tracking?** → Finance application (when created)

## Migration Complete

✅ All To Do application specs moved to `applications/todo/`  
✅ Platform-wide specs extracted to `platform/`  
✅ Original `001-todo-app/` directory renamed to `001-todo-app.deprecated/`  
✅ New features should use the new structure

### Backwards Compatibility

The `001-todo-app.deprecated/` directory is kept for:
- Git history preservation
- External documentation references
- Existing links in PRs/issues

⚠️ **Do not add new content to `001-todo-app.deprecated/`** - it's read-only for historical reference only.

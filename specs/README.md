# Life Manager Platform Specifications

This directory contains all specifications for the Life Manager platform and its applications.

## Directory Structure

```
specs/
├── README.md                    # This file - overview of spec organisation
├── testing-strategy.md          # Platform-wide testing strategy
├── platform/                    # Platform-level specifications
│   ├── architecture.md          # Overall platform architecture
│   ├── authentication.md        # Authentication & user management (shared)
│   ├── authentication-service.md # Centralised auth service (OAuth, JWT, MFA)
│   ├── authentication-service-tasks.md # Auth tasks (T925-T972, ~5.5 weeks)
│   ├── admin-system.md          # Admin panel specification (Phase 5)
│   ├── application-hub.md       # Hub dashboard specification (Phase 6)
│   ├── design-guidelines.md     # Design system & standards (Phase 7)
│   ├── database-schema.md       # Shared database schema
│   ├── database-abstraction.md  # Database abstraction layer spec
│   ├── database-abstraction-tasks.md # DB tasks (T1105-T1126, ~2.5 weeks)
│   ├── microservices-architecture.md # Microservices transformation spec
│   ├── microservices-tasks.md   # Microservices tasks (T973-T1008, ~4 weeks)
│   ├── test-automation.md       # Test automation & quality monitoring spec
│   ├── test-automation-tasks.md # Test tasks (T1009-T1054, ~5.5 weeks)
│   ├── project-rename.md        # Rename Life Manager → Life Manager
│   ├── project-rename-tasks.md  # Rename tasks (T1127-T1154, ~2 weeks)
│   ├── frontend-modernisation.md # Tailwind, shadcn/ui, TanStack Query, RHF+Zod
│   ├── frontend-modernisation-tasks.md # Modernisation tasks (T1257-T1388, ~9 weeks)
│   └── SPEC-INDEX.md            # Quick navigation index
└── applications/                # Individual application specifications
    ├── todo/                    # To Do application
    │   ├── spec.md              # Core To Do feature spec (Phase 1-4)
    │   ├── enhancements.md      # Advanced features (Phase 8-12)
    │   ├── tasks.md             # Implementation task breakdown
    │   ├── data-model.md        # To Do-specific data models
    │   ├── plan.md              # Implementation plan
    │   ├── research.md          # Technical research notes
    │   ├── quickstart.md        # Quick start guide
    │   ├── contracts/           # API contracts
    │   └── checklists/          # Testing checklists
    ├── fitness/                 # Fitness & Health application
    │   ├── spec.md              # Fitness feature spec (Phase 14-21)
    │   └── tasks.md             # Fitness tasks (T800-T924, ~13 weeks)
    ├── weather/                 # Weather Forecast application
    │   ├── spec.md              # Weather feature spec (Phase 32-35)
    │   └── tasks.md             # Weather tasks (T1055-T1104, ~5 weeks)
    └── finance/                 # Personal Finance application
        ├── spec.md              # Finance feature spec (Phase 41-47)
        └── tasks.md             # Finance tasks (T1155-T1256, ~11 weeks)
```

## Specification Organization

### Platform-Level Specs (`platform/`)

Platform-level specifications apply across all applications in the Life Manager ecosystem:

- **architecture.md**: Overall system architecture, routing structure, application registry
- **authentication.md**: User authentication, sessions, email verification (shared by all apps)
- **admin-system.md**: Administration panel for user management, system config, analytics
- **application-hub.md**: Main hub dashboard serving as portal to all applications
- **design-guidelines.md**: Design system, component library, UI standards
- **database-schema.md**: Shared database tables (users, sessions, audit logs, etc.)

### Application-Level Specs (`applications/`)

Each application has its own directory with application-specific specifications:

#### To Do Application (`applications/todo/`)

- **spec.md**: Core features (authentication, tasks, priorities, due dates, groups)
- **enhancements.md**: Advanced features (recurring tasks, statistics, calendar view)
- **tasks.md**: Detailed task breakdown for implementation
- **data-model.md**: To Do-specific entities (Task, TaskGroup, Priority enum)
- **contracts/**: API endpoint contracts
- **checklists/**: Feature testing checklists

#### Fitness & Health Application (`applications/fitness/`)

- **spec.md**: 9 user stories (workout tracking, food diary, body measurements, goals, habit tracking with GitHub-style grid, meditation, wearable integration, plans, social)
- **tasks.md**: T800-T924, 125 tasks across Phases 14-21 (~13 weeks)

#### Weather Forecast Application (`applications/weather/`)

- **spec.md**: 8 user stories (current conditions, multi-day forecast, severe alerts, calendar integration, favourite locations, air quality, radar/satellite, historical data)
- **tasks.md**: T1055-T1104, 50 tasks across Phases 32-35 (~5 weeks)

#### Personal Finance Application (`applications/finance/`)

- **spec.md**: 9 user stories (CSV transaction import for UK banks, budgeting, investment portfolio tracking, bill tracking, savings goals, dashboard & reports, AI insights, multi-currency, debt management)
- **tasks.md**: T1155-T1256, 102 tasks across Phases 41-47 (~11 weeks)

### Platform: Frontend Modernisation (`platform/`)

- **frontend-modernisation.md**: 5 user stories (Tailwind CSS + shadcn/ui foundation, TanStack Query for server state, React Hook Form + Zod validation, page migration, TanStack Table for data grids)
- **frontend-modernisation-tasks.md**: T1257-T1388, 132 tasks across Phases 48-54 (~9 weeks)

#### Future Applications

- `applications/recipes/` - Recipe management & meal planning
- `applications/journal/` - Personal journal & notes
- etc.

## How to Use This Structure

### When Creating a New Feature

1. **Determine scope**: Is it platform-wide or application-specific?
2. **Platform features**: Add to `platform/` (e.g., new auth method, admin feature)
3. **Application features**: Add to `applications/{app-name}/` (e.g., new To Do view)

### When Creating a New Application

1. Create directory: `applications/{app-name}/`
2. Create core specs: `spec.md`, `tasks.md`, `data-model.md`
3. Update `platform/architecture.md` to register the new application
4. Define API contracts in `contracts/` subdirectory

### Cross-Cutting Concerns

Features that span multiple layers should have specifications in both locations:

- **Platform spec**: Defines shared infrastructure, database schema, API patterns
- **Application spec**: Defines how the application uses/extends the platform feature

Example: Profile images
- Platform: Upload service, storage configuration, avatar API (in `platform/authentication.md`)
- To Do: How avatars display in task assignments, comments (in `applications/todo/enhancements.md`)

## Scaling Guide: Adding New Applications

As the Life Manager platform grows, new applications will be added alongside the To Do app. This section explains how the specification structure evolves.

### Current State

```
applications/
  ├── todo/              # First application - task management
  │   ├── spec.md
  │   ├── enhancements.md
  │   ├── tasks.md
  │   └── ...
  ├── fitness/           # Fitness & health tracking
  │   ├── spec.md
  │   └── tasks.md
  ├── weather/           # Weather forecast
  │   ├── spec.md
  │   └── tasks.md
  └── finance/           # Personal finance management
      ├── spec.md
      └── tasks.md
```

### Adding a New Application

When adding a new application (e.g., Finance, Budget, Investments):

#### Step 1: Create Application Directory

```
applications/
  ├── todo/              # Existing
  └── finance/           # NEW APPLICATION
      ├── spec.md        # Core features (Phase 1)
      ├── enhancements.md # Advanced features (Phase 2+)
      ├── tasks.md       # Implementation breakdown
      ├── data-model.md  # Application-specific entities
      ├── plan.md        # Development plan
      ├── quickstart.md  # Quick start guide
      ├── contracts/     # API specifications
      │   └── api-spec.yaml
      └── checklists/    # Testing checklists
          └── requirements.md
```

#### Step 2: Update Platform Specifications

Update these platform-level specs to register the new application:

1. **`platform/architecture.md`**
   - Add application to registry (applications table in database)
   - Define routing structure (`/finance/*`)
   - Add to technology stack if new dependencies required

2. **`platform/application-hub.md`**
   - Add application card configuration
   - Define quick stats for the new app
   - Configure health monitoring endpoints

3. **`platform/SPEC-INDEX.md`**
   - Add new application section
   - Map phases and features to file locations

4. **`platform/database-schema.md`** (if exists)
   - Document any new shared tables
   - Note foreign key relationships to user/audit tables

#### Step 3: Follow Naming Conventions

- **Directory name**: Lowercase, hyphenated (e.g., `investment-tracker`)
- **Route**: Matches directory name (e.g., `/investment-tracker`)
- **Display name**: Proper case (e.g., "Investment Tracker")
- **Application ID**: Lowercase, hyphenated (same as directory)

### Platform vs Application Specifications

As you scale, maintain clear boundaries:

#### Platform Specifications (Shared Infrastructure)

These apply to ALL applications and should only change when adding platform-wide features:

- **Authentication**: Login, registration, password reset, sessions
- **Admin System**: User management, system configuration, audit logs
- **Application Hub**: Portal dashboard, application cards, activity feed
- **Design Guidelines**: Colour palette, typography, component library
- **Architecture**: Routing, application registry, shared services

#### Application Specifications (App-Specific Features)

Each application has its own isolated specifications:

- **To Do**: Tasks, priorities, groups, recurring tasks, calendar view
- **Fitness**: Workout tracking, food diary, body measurements, habits, meditation
- **Weather**: Current conditions, forecasts, alerts, radar, air quality, historical data
- **Finance**: Transactions, accounts, categories, budgets, investments, reports, debt management

### Growth Pattern Example

#### Year 1: Single Application
```
applications/
  └── todo/
```

#### Year 2: Add Finance Tracking
```
applications/
  ├── todo/
  └── finance/
```

#### Year 3: Expand Finance Suite
```
applications/
  ├── todo/
  ├── finance/           # Transaction tracking
  ├── budget/            # Budget planning
  └── investments/       # Investment portfolio
```

### Shared Features Across Applications

When multiple applications need similar features:

1. **Identify the pattern**: What's truly shared vs app-specific?
2. **Extract to platform**: Create shared service/component in platform specs
3. **Document in both places**:
   - Platform spec: Infrastructure and API
   - Application specs: How each app uses it

**Example: Comments System**
- Platform: Generic comments API, database schema, permissions
- To Do: Comments on tasks
- Finance: Comments on transactions
- Budget: Comments on budget items

### When to Create Platform Features

Create platform-level features when:
- ✅ Used by 2+ applications
- ✅ Core infrastructure (auth, admin, logging)
- ✅ Design system components
- ✅ Shared database tables

Keep as application-specific when:
- ✅ Unique to one application
- ✅ Domain-specific logic
- ✅ Application-specific UI patterns

### Directory Size Guidance

- **Small applications** (< 20 features): Single `spec.md` file
- **Medium applications** (20-50 features): Split into `spec.md` + `enhancements.md`
- **Large applications** (50+ features): Consider subdirectories by feature area

Example for large application:
```
applications/
  └── finance/
      ├── core/               # Phase 1 features
      │   └── spec.md
      ├── reporting/          # Reporting features
      │   └── spec.md
      ├── analytics/          # Analytics features
      │   └── spec.md
      └── tasks.md            # Overall task breakdown
```

## Specification Standards

All specifications follow these conventions:

1. **User Story Format**: "Given, When, Then" acceptance scenarios
2. **Priority Labels**: P1 (critical), P2 (high), P3 (medium), P4 (low)
3. **Independent Testing**: Each story must be testable in isolation
4. **Technical Requirements**: Include database schema, API endpoints, components
5. **British English**: All documentation uses British English spelling

## Migration Notes

The original `001-todo-app/` directory has been reorganized:

- Core To Do specs → `applications/todo/`
- Platform-wide features → `platform/`
- Original directory renamed to `001-todo-app.deprecated/` (preserved for Git history only)

⚠️ **Do not use `001-todo-app.deprecated/`** - all new work should use the new structure:
- Platform features → `platform/`
- To Do features → `applications/todo/`

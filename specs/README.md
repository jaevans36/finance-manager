# Finance Manager Platform Specifications

This directory contains all specifications for the Finance Manager platform and its applications.

## Directory Structure

```
specs/
├── README.md                    # This file - overview of spec organisation
├── testing-strategy.md          # Platform-wide testing strategy
├── platform/                    # Platform-level specifications
│   ├── architecture.md          # Overall platform architecture
│   ├── authentication.md        # Authentication & user management (shared)
│   ├── admin-system.md          # Admin panel specification (Phase 5)
│   ├── application-hub.md       # Hub dashboard specification (Phase 6)
│   ├── design-guidelines.md     # Design system & standards (Phase 7)
│   └── database-schema.md       # Shared database schema
└── applications/                # Individual application specifications
    └── todo/                    # To Do application
        ├── spec.md              # Core To Do feature spec (Phase 1-4)
        ├── enhancements.md      # Advanced features (Phase 8-12)
        ├── tasks.md             # Implementation task breakdown
        ├── data-model.md        # To Do-specific data models
        ├── plan.md              # Implementation plan
        ├── research.md          # Technical research notes
        ├── quickstart.md        # Quick start guide
        ├── contracts/           # API contracts
        └── checklists/          # Testing checklists
```

## Specification Organization

### Platform-Level Specs (`platform/`)

Platform-level specifications apply across all applications in the Finance Manager ecosystem:

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

#### Future Applications

- `applications/finance/` - Personal finance management
- `applications/budget/` - Budget tracking and planning
- `applications/investments/` - Investment portfolio tracking
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

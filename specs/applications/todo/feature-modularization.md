# Feature Specification: Feature Modularization & Plugin Architecture

**Feature ID**: `011-feature-modularization`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P3  
**Dependencies**: Admin Settings (Phase 21)

## Overview

Refactor the monolithic application into a modular plugin architecture where features (tasks, events, categories, integrations) are self-contained modules that can be enabled, disabled, or replaced independently. This enables better code organization, easier testing, and potential third-party plugin support.

## Rationale

As the application grows, **monolithic architecture becomes a liability**:
- Feature coupling makes changes risky
- Testing is difficult (can't test one feature in isolation)
- New developers struggle to understand the codebase
- Users pay the cost of features they don't use (bundle size, complexity)

**Modular architecture solves this**:
- Features are independent, testable units
- Users enable only what they need
- Third-party developers can create plugins
- Easier to maintain and extend

**Business Value**:
- Faster development (teams work on isolated modules)
- Smaller bundle sizes (lazy load modules)
- Extensibility (plugin marketplace potential)
- Better testability (unit test modules independently)

## Core Concepts

### Module Definition

A **module** is a self-contained feature with:
- Backend API (controllers, services, entities)
- Frontend UI (pages, components, routes)
- Configuration (default settings, permissions)
- Dependencies (other modules it requires)

```typescript
interface Module {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Dependencies
  dependencies: string[]; // Other module IDs
  minAppVersion: string;
  
  // Configuration
  defaultSettings: Record<string, any>;
  permissions: Permission[];
  
  // Lifecycle
  onInstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
}
```

### Built-In Modules

These are the core features refactored into modules:

1. **Tasks Module** (`@app/tasks`)
   - Task CRUD, prioritization, due dates
   - Dependencies: None (core module)

2. **Events Module** (`@app/events`)
   - Event CRUD, reminders, location
   - Dependencies: None (core module)

3. **Recurring Events Module** (`@app/recurring-events`)
   - RRULE-based recurrence
   - Dependencies: Events Module

4. **Categories Module** (`@app/categories`)
   - Category and tag management
   - Dependencies: Tasks, Events

5. **Calendar Integrations Module** (`@app/calendar-sync`)
   - Google Calendar, Outlook sync
   - Dependencies: Events, Recurring Events

6. **Sharing Module** (`@app/sharing`)
   - Calendar sharing, permissions
   - Dependencies: Events, Categories

7. **Invitations Module** (`@app/invitations`)
   - Event invitations, RSVP
   - Dependencies: Events, Email

8. **Dashboard Widgets Module** (`@app/dashboard`)
   - Widget system
   - Dependencies: Tasks, Events, Categories

9. **Notifications Module** (`@app/notifications`)
   - In-app and email notifications
   - Dependencies: Tasks, Events

### Plugin Architecture

**Plugin Discovery**:
- Backend: Plugins register with `PluginRegistry`
- Frontend: Plugins register with `ModuleRegistry`
- Config file: `plugins.config.json` lists installed plugins

**Plugin Lifecycle**:
1. **Install**: Plugin files copied to plugins directory
2. **Enable**: Plugin registers routes, services, components
3. **Disable**: Plugin deregisters but files remain
4. **Uninstall**: Plugin files removed, data optionally deleted

**Plugin Structure**:
```
plugins/
  my-plugin/
    plugin.json          # Metadata
    backend/
      controllers/
      services/
      entities/
    frontend/
      components/
      pages/
      routes.tsx
    README.md
```

## User Scenarios & Testing

### User Story 1 - Enable/Disable Modules (Priority: P1)

**Why this priority**: Core functionality - users must control which features are active.

**Independent Test**: Disable Events module, verify events UI disappears and API returns 404.

**Acceptance Scenarios**:

1. **Given** modules page, **When** user toggles "Events" off, **Then** events navigation link disappears
2. **Given** events module disabled, **When** user tries to access `/events`, **Then** "Module not enabled" page displays
3. **Given** events module disabled, **When** API call to `/api/v1/events`, **Then** returns 404 or 403
4. **Given** module with dependencies, **When** user tries to disable Tasks, **Then** warning shows "Categories depends on this"
5. **Given** module re-enabled, **When** user toggles on, **Then** UI elements reappear without page refresh

### User Story 2 - Install Third-Party Plugin (Priority: P2)

**Why this priority**: Extensibility - users want to add custom functionality.

**Independent Test**: Install sample plugin, verify it appears in modules list and functions correctly.

**Acceptance Scenarios**:

1. **Given** modules page, **When** user clicks "Install Plugin", **Then** file upload dialog opens
2. **Given** plugin file uploaded, **When** processing, **Then** plugin metadata displays for review
3. **Given** plugin review, **When** user confirms install, **Then** plugin installs and appears in enabled modules
4. **Given** incompatible plugin, **When** user tries to install, **Then** error shows "Requires app version 2.0+"
5. **Given** plugin with dependencies, **When** dependencies missing, **Then** error shows "Requires Events Module"

### User Story 3 - Module Configuration (Priority: P2)

**Why this priority**: Each module may have configurable settings.

**Independent Test**: Configure module settings, verify they apply to module behaviour.

**Acceptance Scenarios**:

1. **Given** module list, **When** user clicks "Configure" on Tasks module, **Then** settings modal opens
2. **Given** Tasks module settings, **When** user changes "Default Priority", **Then** new tasks use this priority
3. **Given** Calendar Sync module, **When** user enters API key, **Then** sync functionality activates
4. **Given** module settings invalid, **When** user tries to save, **Then** validation errors display
5. **Given** module settings, **When** user clicks "Reset to Defaults", **Then** settings revert with confirmation

### User Story 4 - Module Permissions (Priority: P2)

**Why this priority**: Modules may require specific permissions (API access, email sending).

**Independent Test**: Install module requiring permissions, verify permission grant flow.

**Acceptance Scenarios**:

1. **Given** module installation, **When** module requires email permission, **Then** permission request displays
2. **Given** permission request, **When** user denies, **Then** module installs but feature is disabled
3. **Given** permission granted, **When** module uses feature, **Then** permission check passes
4. **Given** installed module, **When** user revokes permission, **Then** module feature stops working
5. **Given** permissions page, **When** viewing, **Then** all granted permissions display with revoke buttons

### User Story 5 - Module Updates (Priority: P3)

**Why this priority**: Plugins need updates for bug fixes and new features.

**Independent Test**: Update module to new version, verify update applies without data loss.

**Acceptance Scenarios**:

1. **Given** module with update available, **When** viewing modules, **Then** "Update Available" badge displays
2. **Given** update button clicked, **When** processing, **Then** changelog displays for review
3. **Given** changelog reviewed, **When** user confirms, **Then** module updates and version number increments
4. **Given** module update, **When** applied, **Then** existing module data is preserved
5. **Given** update failed, **When** error occurs, **Then** rolls back to previous version automatically

## Technical Architecture

### Backend Components

**Module Registry**:
```csharp
public interface IModule
{
    string Id { get; }
    string Name { get; }
    string Version { get; }
    IEnumerable<string> Dependencies { get; }
    
    Task OnEnableAsync();
    Task OnDisableAsync();
    Task<bool> IsEnabledAsync();
}

public class ModuleRegistry
{
    private readonly Dictionary<string, IModule> _modules = new();
    
    public void RegisterModule(IModule module)
    {
        _modules[module.Id] = module;
    }
    
    public async Task EnableModuleAsync(string moduleId)
    {
        var module = _modules[moduleId];
        await module.OnEnableAsync();
    }
    
    public async Task DisableModuleAsync(string moduleId)
    {
        var module = _modules[moduleId];
        await module.OnDisableAsync();
    }
}
```

**Database Schema**:
```typescript
interface InstalledModule {
  id: string;
  moduleId: string;
  name: string;
  version: string;
  isEnabled: boolean;
  isCore: boolean; // Cannot be uninstalled
  settings: Record<string, any>; // JSONB
  installedAt: Date;
  updatedAt: Date;
}

interface ModulePermission {
  moduleId: string;
  permission: string; // 'email', 'storage', 'calendar', etc.
  isGranted: boolean;
  grantedAt?: Date;
}
```

**Service Layer**:
- `ModuleManagementService` - Install, enable, disable, uninstall modules
- `PluginLoaderService` - Load plugin files and register with app
- `PermissionService` - Grant and check module permissions
- `ModuleDependencyResolver` - Check and resolve dependencies

**API Endpoints**:
- `GET /api/v1/modules` - List all modules
- `POST /api/v1/modules/:id/enable` - Enable module
- `POST /api/v1/modules/:id/disable` - Disable module
- `POST /api/v1/modules/install` - Install plugin
- `DELETE /api/v1/modules/:id` - Uninstall plugin
- `PUT /api/v1/modules/:id/settings` - Update module settings
- `GET /api/v1/modules/:id/permissions` - Get module permissions
- `POST /api/v1/modules/:id/permissions/:permission` - Grant permission

### Frontend Components

**Module Registry**:
```typescript
interface ModuleRegistration {
  id: string;
  name: string;
  routes: RouteObject[];
  components: Record<string, React.ComponentType>;
  reducers?: Record<string, Reducer>;
  middleware?: Middleware[];
}

class FrontendModuleRegistry {
  private modules = new Map<string, ModuleRegistration>();
  
  register(module: ModuleRegistration) {
    this.modules.set(module.id, module);
  }
  
  getRoutes(): RouteObject[] {
    return Array.from(this.modules.values())
      .flatMap(m => m.routes);
  }
  
  getComponent(moduleId: string, componentName: string) {
    return this.modules.get(moduleId)?.components[componentName];
  }
}
```

**UI Pages**:
- `ModulesPage` - List and manage modules
- `ModuleDetailPage` - View module details and configure
- `InstallPluginModal` - Upload and install plugin
- `ModuleSettingsModal` - Configure module settings

## Task Breakdown: Phase 22 - Feature Modularization (6 weeks)

### Week 1: Architecture Design (Days 1-5)

**Planning & Design**
- [ ] T1025 Design module interface and lifecycle - 8h
- [ ] T1026 Design plugin discovery mechanism - 6h
- [ ] T1027 Design permission system for modules - 6h
- [ ] T1028 Create module dependency graph - 4h
- [ ] T1029 Document modularization architecture - 6h

**Database Schema**
- [ ] T1030 [P] Create InstalledModule entity - 2h
- [ ] T1031 [P] Create ModulePermission entity - 2h
- [ ] T1032 Create EF Core migrations - 1h
- [ ] T1033 Apply migrations and verify schema - 1h

**Checkpoint**: Architecture designed

### Week 2: Backend Module System (Days 6-10)

**Module Registry**
- [ ] T1034 Create IModule interface - 4h
- [ ] T1035 Create ModuleRegistry class - 6h
- [ ] T1036 Implement module enable/disable logic - 5h
- [ ] T1037 Implement dependency resolution - 6h
- [ ] T1038 Write unit tests for module registry (15 tests) - 5h

**Module Management Service**
- [ ] T1039 Create ModuleManagementService - 6h
- [ ] T1040 Implement InstallModule method - 5h
- [ ] T1041 Implement UninstallModule method - 4h
- [ ] T1042 Implement UpdateModule method - 5h
- [ ] T1043 Implement GetModuleSettings method - 3h
- [ ] T1044 Write unit tests for management service (20 tests) - 6h

**Plugin Loader**
- [ ] T1045 Create PluginLoaderService - 6h
- [ ] T1046 Implement plugin file validation - 4h
- [ ] T1047 Implement plugin dependency checking - 4h
- [ ] T1048 Write unit tests for plugin loader (12 tests) - 4h

**Checkpoint**: Backend module system operational

### Week 3: Refactor Existing Features (Days 11-15)

**Tasks Module**
- [ ] T1049 Extract Tasks feature into module - 8h
- [ ] T1050 Implement TasksModule class - 5h
- [ ] T1051 Register Tasks module with registry - 3h
- [ ] T1052 Write integration tests for Tasks module (10 tests) - 4h

**Events Module**
- [ ] T1053 Extract Events feature into module - 8h
- [ ] T1054 Implement EventsModule class - 5h
- [ ] T1055 Register Events module with registry - 3h
- [ ] T1056 Write integration tests for Events module (10 tests) - 4h

**Categories Module**
- [ ] T1057 Extract Categories feature into module - 6h
- [ ] T1058 Implement CategoriesModule class - 4h
- [ ] T1059 Register Categories module with dependencies - 3h
- [ ] T1060 Write integration tests for Categories module (8 tests) - 3h

**Checkpoint**: Core features modularized

### Week 4: API & Frontend Registry (Days 16-20)

**API Endpoints**
- [ ] T1061 Create ModulesController - 4h
- [ ] T1062 GET /api/v1/modules endpoint - 2h
- [ ] T1063 POST /api/v1/modules/:id/enable endpoint - 3h
- [ ] T1064 POST /api/v1/modules/:id/disable endpoint - 3h
- [ ] T1065 POST /api/v1/modules/install endpoint - 5h
- [ ] T1066 DELETE /api/v1/modules/:id endpoint - 3h
- [ ] T1067 PUT /api/v1/modules/:id/settings endpoint - 3h
- [ ] T1068 Write integration tests for modules endpoints (15 tests) - 5h

**Frontend Module Registry**
- [ ] T1069 Create FrontendModuleRegistry class - 6h
- [ ] T1070 Implement route registration - 5h
- [ ] T1071 Implement component registration - 4h
- [ ] T1072 Implement dynamic module loading - 6h
- [ ] T1073 Write unit tests for frontend registry (12 tests) - 4h

**Frontend TypeScript Types**
- [ ] T1074 [P] Create Module interface - 2h
- [ ] T1075 [P] Create ModulePermission interface - 1h

**Frontend Service**
- [ ] T1076 Create moduleService.ts - 5h
- [ ] T1077 Write service tests (10 tests) - 3h

**Checkpoint**: API complete, frontend registry operational

### Week 5: UI & Refactoring (Days 21-25)

**Modules Management UI**
- [ ] T1078 Create ModulesPage - 8h
- [ ] T1079 Create ModuleCard component - 5h
- [ ] T1080 Create ModuleDetailModal component - 6h
- [ ] T1081 Create InstallPluginModal component - 6h
- [ ] T1082 Create ModuleSettingsModal component - 5h

**Frontend Module Refactoring**
- [ ] T1083 Refactor Tasks feature as frontend module - 6h
- [ ] T1084 Refactor Events feature as frontend module - 6h
- [ ] T1085 Refactor Categories feature as frontend module - 5h
- [ ] T1086 Refactor Calendar feature as frontend module - 6h
- [ ] T1087 Refactor Dashboard feature as frontend module - 5h

**Dynamic Loading**
- [ ] T1088 Implement lazy loading for modules - 6h
- [ ] T1089 Implement module-specific code splitting - 5h
- [ ] T1090 Create loading states for module activation - 3h

**Checkpoint**: UI complete, features modularized

### Week 6: Plugin System & Testing (Days 26-30)

**Sample Plugin Development**
- [ ] T1091 Create sample plugin template - 5h
- [ ] T1092 Develop "Birthday Reminders" sample plugin - 8h
- [ ] T1093 Develop "Weather Widget" sample plugin - 6h
- [ ] T1094 Write plugin development guide - 4h

**Permission System**
- [ ] T1095 Implement permission grant UI - 5h
- [ ] T1096 Implement permission checking in modules - 4h
- [ ] T1097 Create permissions management page - 4h

**Testing**
- [ ] T1098 Write component tests for modules UI (20 tests) - 6h
- [ ] T1099 Write E2E test for enabling/disabling modules - 5h
- [ ] T1100 Write E2E test for installing plugin - 5h
- [ ] T1101 Write E2E test for module dependencies - 4h
- [ ] T1102 Write E2E test for module configuration - 4h
- [ ] T1103 Test module isolation (disable one, others work) - 4h

**Documentation**
- [ ] T1104 Write user guide for modules - 4h
- [ ] T1105 Write plugin developer guide - 8h
- [ ] T1106 Document module API reference - 6h
- [ ] T1107 Create plugin marketplace guidelines - 4h

**Final Review**
- [ ] T1108 Security audit (plugin sandboxing, permissions) - 6h
- [ ] T1109 Performance testing (100 modules) - 4h
- [ ] T1110 Code review and refactoring - 6h

**Checkpoint**: Complete feature modularization

## Effort Summary

**Total Tasks**: 86 tasks (T1025-T1110)  
**Total Estimated Time**: ~280 hours (6 weeks)  
**Feature Priorities**:
- Module registry: P1 (foundation)
- Enable/disable: P1 (core functionality)
- Refactoring existing features: P1 (necessary for modularity)
- Plugin installation: P2 (extensibility)
- Sample plugins: P3 (demonstration)

## Dependencies

- **All previous phases**: All features must be modularized
- **Admin Settings (Phase 21)**: Module toggles integrate with settings

## Security Considerations

1. **Plugin Sandboxing**: Plugins run in restricted context
2. **Permission System**: Explicit permission grants for sensitive operations
3. **Code Validation**: Validate plugin code before execution
4. **API Rate Limiting**: Prevent malicious plugins from overwhelming system
5. **Audit Logging**: Log all module installations and permission grants

## Success Criteria

- ✅ All core features work as independent modules
- ✅ Users can enable/disable modules without breaking dependencies
- ✅ Third-party plugins can be installed and function correctly
- ✅ Module settings persist and apply correctly
- ✅ Lazy loading reduces initial bundle size by >30%
- ✅ Module enable/disable takes <500ms
- ✅ Plugin installation validates dependencies correctly
- ✅ No security vulnerabilities in plugin loading
- ✅ Performance: 50 modules can be registered without degradation

## Future Enhancements (Phase 2)

- **Plugin Marketplace**: Browse and install community plugins
- **Module Versioning**: Support multiple versions of same module
- **Hot Reloading**: Update modules without page refresh
- **Module Analytics**: Track module usage and performance
- **Module Theming**: Modules can provide custom themes
- **Cross-Module Events**: Publish-subscribe event system between modules
- **Module CLI**: Command-line tool for creating and testing plugins

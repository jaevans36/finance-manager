# Feature Specification: Project Rename — Life Manager → Life Manager

**Feature ID**: `009-project-rename`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P2  
**Dependencies**: None (can proceed independently)

## Overview

Rename the platform from "Life Manager" to a broader name that reflects its evolution from a single-purpose finance application into a multi-domain life management platform encompassing To Do, Fitness, Finance, Weather, and future applications. The rename includes code changes, branding updates, URL migration, and documentation updates.

## Rationale

The current name "Life Manager" no longer accurately represents the platform's scope. As the platform expands to include fitness tracking, weather, task management, and more, the name creates confusion about its purpose. A comprehensive rename establishes a clear identity that supports the platform's vision as a unified personal life management tool.

---

## Name Candidates

| Name | Pros | Cons |
|------|------|------|
| **Life Manager** | Clear, descriptive, matches the vision | Generic, SEO competition |
| **LifeHub** | Modern, concise, hub concept | May feel too trendy |
| **LifeOS** | Implies comprehensive OS for life | "OS" misleading, overused |
| **Nexus** | Elegant, means connection point | Very common brand name |
| **Pulse** | Health/vitality connotation, short | Doesn't convey management |
| **Compass** | Guidance/direction metaphor | Navigation apps confusion |

**Recommended**: **Life Manager** — Clear, professional, and directly communicates the platform's purpose. The internal package namespace can use `@life-manager/` for consistency.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Codebase Rename (Priority: P1)

All code references to "Life Manager" are updated to the new name, including package names, namespaces, solution files, Docker configurations, and environment variables.

**Why this priority**: The codebase is the foundation. All other rename activities depend on the code being updated first.

**Independent Test**: Build the project after rename, verify all references resolve, no broken imports/namespaces, and all tests pass.

**Acceptance Scenarios**:

1. **Given** the solution file, **When** the rename is applied, **Then** `Life Manager.sln` → `Life Manager.sln` and all project references are updated
2. **Given** .NET projects, **When** namespaces are renamed, **Then** `FinanceApi` → `LifeManagerApi` (or `LifeManager.Api`) and all `using` statements are updated
3. **Given** npm packages, **When** package names are updated, **Then** `@life-manager/web` → `@life-manager/web`, `@life-manager/ui` → `@life-manager/ui`, etc.
4. **Given** Docker configurations, **When** service and image names are updated, **Then** `docker-compose.yml` reflects the new naming convention
5. **Given** environment variables, **When** prefixed vars are renamed, **Then** `FINANCE_MANAGER_*` → `LIFE_MANAGER_*` (with backward compatibility period)
6. **Given** the complete rename, **When** all tests are run, **Then** all existing tests pass without modification to test logic

---

### User Story 2 - Branding & UI Updates (Priority: P2)

All user-facing text, logos, favicons, page titles, and metadata are updated to reflect the new name and brand identity.

**Why this priority**: User-facing branding should change as soon as the codebase is ready. Users need to see the new name consistently.

**Independent Test**: Navigate through all pages, verify the new name appears in all titles, headers, footers, about pages, and browser tabs.

**Acceptance Scenarios**:

1. **Given** the application header, **When** a user views any page, **Then** the application name shows the new brand name
2. **Given** the browser tab, **When** a user opens the app, **Then** the page title includes the new name and the favicon reflects the updated brand
3. **Given** the login/registration pages, **When** a new user encounters the app, **Then** the new brand name and logo are prominently displayed
4. **Given** email communications, **When** automated emails are sent (verification, reset), **Then** they use the new brand name and styling
5. **Given** the application hub, **When** a user views the dashboard, **Then** the platform name is displayed with a new logo/icon

---

### User Story 3 - URL & Repository Migration (Priority: P2)

The Git repository, CI/CD pipelines, and any public URLs are updated to reflect the new name.

**Why this priority**: Repository and URL changes need to happen alongside the code rename to maintain consistency.

**Independent Test**: Verify the repository rename redirects old URLs, CI/CD pipelines execute successfully, and all deployment targets are updated.

**Acceptance Scenarios**:

1. **Given** the GitHub repository, **When** it is renamed, **Then** `jaevans36/finance-manager` → `jaevans36/life-manager` with automatic redirect from the old URL
2. **Given** GitHub Actions workflows, **When** they reference the repository, **Then** they use the new repository name (GitHub automatically handles the redirect for a period)
3. **Given** Docker images published to a registry, **When** new images are built, **Then** they use the new image name (old images remain available for rollback)
4. **Given** any deployed instances, **When** the rename is applied, **Then** environment configurations point to the new repository and image names
5. **Given** local developer clones, **When** a developer pulls after the rename, **Then** their remote URL updates automatically (or they receive clear instructions)

---

### User Story 4 - Documentation Update (Priority: P3)

All documentation, specification files, README files, and guides are updated to reference the new platform name.

**Why this priority**: Documentation should be updated for consistency, but it can lag slightly behind the code changes without blocking development.

**Independent Test**: Search all documentation for the old name, verify zero occurrences remain (except historical references in changelogs).

**Acceptance Scenarios**:

1. **Given** the main README.md, **When** a developer reads it, **Then** all references use the new platform name
2. **Given** specification files, **When** they reference the platform, **Then** they use the new name
3. **Given** the CHANGELOG.md, **When** past entries mention "Life Manager", **Then** they are preserved as historical records (not renamed)
4. **Given** inline code comments referencing the platform name, **When** a search is run, **Then** no stale references to the old name exist
5. **Given** API documentation (Swagger), **When** it is generated, **Then** the API title reflects the new platform name

---

## Migration Checklist

### Phase 1: Code Changes

**Solution & Projects:**
- [ ] Rename `Life Manager.sln` → `Life Manager.sln`
- [ ] Rename `apps/finance-api/` → `apps/api/` (or `apps/life-manager-api/`)
- [ ] Update `FinanceApi.csproj` → `LifeManager.Api.csproj`
- [ ] Update all C# namespaces: `FinanceApi.*` → `LifeManager.*`
- [ ] Update all `using` statements across the backend

**Frontend Packages:**
- [ ] Update `apps/web/package.json` → `@life-manager/web`
- [ ] Update `packages/ui/package.json` → `@life-manager/ui`
- [ ] Update `packages/schema/package.json` → `@life-manager/schema`
- [ ] Update all `import` statements referencing old package names
- [ ] Update `pnpm-workspace.yaml` if needed

**Configuration:**
- [ ] Update `docker-compose.yml` service and image names
- [ ] Update environment variable prefixes
- [ ] Update `tsconfig.json` path aliases
- [ ] Update `vite.config.ts` app title
- [ ] Update `index.html` title and meta tags

### Phase 2: Branding

- [ ] Design new logo/icon (if applicable)
- [ ] Update favicon.ico and PWA manifest icons
- [ ] Update application header component
- [ ] Update login/registration page branding
- [ ] Update email templates
- [ ] Update meta tags (Open Graph, Twitter Card)

### Phase 3: Infrastructure

- [ ] Rename GitHub repository
- [ ] Update GitHub Actions workflow files
- [ ] Update Docker Hub / container registry image names
- [ ] Update any deployment configurations
- [ ] Notify all contributors of the rename

### Phase 4: Documentation

- [ ] Update README.md (root)
- [ ] Update all files in `docs/`
- [ ] Update all files in `specs/`
- [ ] Update `.github/copilot-instructions.md`
- [ ] Update QUICKSTART.md
- [ ] Search and replace remaining references
- [ ] Add CHANGELOG.md entry documenting the rename

---

## Technical Considerations

### Backward Compatibility
- GitHub provides automatic redirects for renamed repositories (limited period)
- Old Docker images remain available for rollback
- Environment variables can support both old and new prefixes during transition (fallback logic)
- Database names should not change (data migration not required)

### Risk Mitigation
- Complete the rename in a single PR to avoid partial rename states
- Run full test suite before and after rename
- Coordinate with any CI/CD pipelines to avoid mid-rename build failures
- Document the old name in the CHANGELOG for searchability

### Estimated Effort
- **Phase 1 (Code)**: 1-2 days (mostly find-and-replace with careful review)
- **Phase 2 (Branding)**: 1 day
- **Phase 3 (Infrastructure)**: 0.5 days
- **Phase 4 (Documentation)**: 0.5 days
- **Total**: 3-4 days

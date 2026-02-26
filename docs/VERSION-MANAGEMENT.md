# Version Management Guide

This document provides comprehensive guidelines for managing versions, changelogs, and releases in the To Do Manager application.

## Table of Contents

1. [Semantic Versioning](#semantic-versioning)
2. [Version Files](#version-files)
3. [Release Process](#release-process)
4. [Changelog Guidelines](#changelog-guidelines)
5. [Automated Workflows](#automated-workflows)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) with the format `MAJOR.MINOR.PATCH`.

### Version Components

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─→ Patch: Bug fixes, minor improvements, documentation
  │     └───────→ Minor: New features, enhancements (backward compatible)
  └─────────────→ Major: Breaking changes, significant rewrites
```

### When to Increment

| Version | Increment When | Examples |
|---------|----------------|----------|
| **MAJOR (X.0.0)** | Breaking changes that require user action | - API endpoint changes requiring client updates<br>- Database schema changes requiring migrations<br>- Removing deprecated features<br>- Significant UI/UX overhaul |
| **MINOR (0.X.0)** | New features or enhancements (backward compatible) | - New pages or components<br>- Additional API endpoints<br>- Feature enhancements<br>- New integrations<br>- Performance improvements |
| **PATCH (0.0.X)** | Bug fixes and minor updates | - Bug fixes<br>- Typo corrections<br>- Minor UI adjustments<br>- Documentation updates<br>- Dependency updates |

### Pre-release Versions

For pre-release versions, append a hyphen and identifier:

- `0.14.0-alpha.1` - Alpha release (internal testing)
- `0.14.0-beta.2` - Beta release (limited testing)
- `0.14.0-rc.3` - Release candidate (final testing)

---

## Version Files

### 1. VERSION.json

**Location**: `c:\Projects\Finance Manager\VERSION.json`

This is the **single source of truth** for the current application version.

**Structure**:

```json
{
  "version": "0.13.0",
  "releaseDate": "2026-01-18",
  "codename": "Events Foundation",
  "description": "Major milestone: Event management system, calendar integration, and dashboard restructure",
  "breaking": false,
  "changelog": [
    {
      "type": "feat|fix|perf|docs|test|refactor",
      "category": "Events|Dashboard|Navigation|etc",
      "description": "Human-readable description",
      "impact": "high|medium|low"
    }
  ],
  "previousVersion": "0.12.0"
}
```

**Fields**:

- `version` **(required)**: Current version number (string)
- `releaseDate` **(required)**: ISO 8601 date (YYYY-MM-DD)
- `codename` (optional): Memorable name for the release
- `description` **(required)**: Brief overview of the release
- `breaking` **(required)**: Boolean indicating breaking changes
- `changelog` **(required)**: Array of change objects
- `previousVersion` **(required)**: Previous version number for tracking

**Change Types**:

**USER-FACING (include in changelog)**:
- `feat` - New feature
- `fix` - Bug fix
- `perf` - Performance improvement
- `ui` - UI/UX improvements
- `api` - API changes that enable integrations

**DEVELOPER-ONLY (exclude from user-facing changelog)**:
- `test` - Test additions or fixes
- `refactor` - Code refactoring
- `chore` - Maintenance tasks
- `docs` - Internal documentation

**Impact Levels** (user-centric):

- `major` - Major feature additions or breaking changes that significantly affect user workflows
- `minor` - Incremental features, enhancements, or notable UI improvements
- `patch` - Bug fixes, small UI tweaks, and minor improvements

**Note**: Focus on changes that matter to users. Avoid including developer-only changes like "Added tests" unless they represent API openings for integrations.

### 2. CHANGELOG.md

**Location**: `c:\Projects\Finance Manager\CHANGELOG.md`

Complete version history with detailed change descriptions.

**Format**: Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

**Structure**:

```markdown
## [Version] - Date "Codename"

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

---

## Release Process

### Step-by-Step Release Workflow

#### 1. Complete Feature Development

- Ensure all tasks for the phase/feature are complete
- All tests pass (backend + frontend + E2E)
- Documentation updated
- Code reviewed and merged

#### 2. Determine Version Number

**Decision Tree**:

```
Does this release include breaking changes?
  ├─ YES → Increment MAJOR version (X.0.0)
  └─ NO → Are there new features?
      ├─ YES → Increment MINOR version (0.X.0)
      └─ NO → Increment PATCH version (0.0.X)
```

**Examples**:

- Current: `0.12.0`
- New features added → `0.13.0`
- Bug fixes only → `0.12.1`
- Breaking changes → `1.0.0`

#### 3. Update VERSION.json

```json
{
  "version": "0.14.0",
  "releaseDate": "2026-01-25",
  "codename": "Task Attachments",
  "description": "File upload support for tasks with image preview and document management",
  "breaking": false,
  "changelog": [
    {
      "type": "feat",
      "category": "Tasks",
      "description": "File upload support with drag-and-drop",
      "impact": "major"
    },
    {
      "type": "ui",
      "category": "Tasks",
      "description": "Image preview functionality",
      "impact": "minor"
    },
    {
      "type": "api",
      "category": "Integration",
      "description": "REST API endpoints for file attachments",
      "impact": "minor"
    }
  ],
  "previousVersion": "0.13.0"
}
```

**User-Focused Changelog Principles**:

1. **Include**: Features, bug fixes, UI improvements, API changes enabling integrations, performance improvements
2. **Exclude**: Test additions, refactoring, developer tooling, internal documentation
3. **Use descriptive language**: Write for end users, not developers
4. **Group related changes**: Combine similar small changes into one entry when appropriate

#### 4. Update CHANGELOG.md

Add a new section at the top of the file:

```markdown
## [0.14.0] - 2026-01-25 "Task Attachments"

### Added
- **Task Attachments** (Phase 14)
  - File upload support with drag-and-drop interface
  - Image preview with thumbnail generation
  - Document attachment management
  - Storage integration with size limits
  - 15 tests for attachment functionality

### Changed
- Task form now includes attachment upload section
- Task items display attachment count badge

### Technical
- Added file storage service with Azure Blob Storage
- Implemented attachment entity with EF Core migration
- Created attachment API endpoints
- Updated TEST-INVENTORY.md: 303 → 318 tests
```

#### 5. Update package.json (Frontend)

```json
{
  "name": "@finance-manager/web",
  "version": "0.14.0",
  ...
}
```

#### 6. Update .csproj (Backend)

```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <Version>0.14.0</Version>
  ...
</PropertyGroup>
```

#### 7. Create Phase Completion Documentation

**Location**: `docs/phases/phase-14-attachments/complete.md`

Document:
- All completed tasks with IDs
- Features implemented
- Tests added (with counts)
- Architecture decisions
- Known limitations
- Git commit references

See existing examples:
- `docs/phases/phase-12-calendar-view/complete.md`
- `docs/phases/phase-13-events/complete.md`

#### 8. Update Task List

**Location**: `specs/001-todo-app/tasks.md`

- Mark all phase tasks as `[x]` complete
- Add completion date to phase header

```markdown
## Phase 14: Task Attachments (✅ Complete - 2026-01-25)
```

#### 9. Commit Version Changes

```bash
git add VERSION.json CHANGELOG.md package.json FinanceApi.csproj docs/ specs/
git commit -m "chore: release version 0.14.0 - Task Attachments

- Updated VERSION.json with v0.14.0 details
- Added CHANGELOG.md entry with feature list
- Updated package.json and .csproj version numbers
- Created Phase 14 completion documentation
- Marked Phase 14 tasks as complete in tasks.md

This release includes file upload support for tasks with image preview,
document management, and comprehensive attachment handling."
```

#### 10. Create Git Tag

```bash
git tag -a v0.14.0 -m "Release v0.14.0: Task Attachments"
git push origin v0.14.0
```

#### 11. Test "What's New" Modal

1. Clear `lastSeenVersion` from localStorage: `localStorage.removeItem('lastSeenVersion')`
2. Refresh application
3. Verify modal appears with correct version and changelog
4. Dismiss modal and verify it doesn't show again

#### 12. Deploy

Follow deployment procedures (CI/CD pipeline or manual deployment).

---

## Changelog Guidelines

### Writing Good Changelog Entries

**Good Examples**:

✅ **Clear and specific**:
```markdown
- Added file upload support with drag-and-drop interface
- Fixed task completion not updating statistics in real-time
- Improved calendar performance for months with 100+ tasks
```

❌ **Vague or unclear**:
```markdown
- Added new feature
- Fixed bug
- Various improvements
```

### Categorization

**Added** - New features:
- New pages, components, or UI elements
- New API endpoints
- New functionality
- New integrations

**Changed** - Modifications to existing features:
- UI/UX improvements
- API changes (non-breaking)
- Behavior modifications
- Performance enhancements

**Deprecated** - Soon-to-be removed:
- Features marked for removal
- APIs scheduled for deprecation
- Include migration guidance

**Removed** - Deleted features:
- Removed features or functionality
- Deleted API endpoints
- Removed dependencies

**Fixed** - Bug fixes:
- Bug corrections
- Error handling improvements
- Data validation fixes

**Security** - Security-related:
- Vulnerability patches
- Security enhancements
- Authentication/authorization fixes

### Impact Classification

**High Impact** - Changes that significantly affect users:
- New major features
- Breaking changes
- Significant UI changes
- Data migration required

**Medium Impact** - Noticeable improvements:
- Feature enhancements
- UI refinements
- Performance improvements
- New minor features

**Low Impact** - Minor changes:
- Bug fixes
- Documentation updates
- Minor UI tweaks
- Dependency updates

---

## Automated Workflows

### GitHub Actions (Future Enhancement)

Create `.github/workflows/version-check.yml`:

```yaml
name: Version Check

on:
  pull_request:
    branches: [ main, 001-todo-app ]

jobs:
  check-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check VERSION.json updated
        run: |
          if ! git diff --name-only origin/${{ github.base_ref }} | grep -q "VERSION.json"; then
            echo "::error::VERSION.json must be updated for this PR"
            exit 1
          fi
      - name: Validate VERSION.json format
        run: |
          node -e "JSON.parse(require('fs').readFileSync('VERSION.json'))"
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Validate VERSION.json before commit
if ! node -e "JSON.parse(require('fs').readFileSync('VERSION.json'))" 2>/dev/null; then
  echo "Error: VERSION.json is invalid JSON"
  exit 1
fi

# Check if VERSION.json changed
if git diff --cached --name-only | grep -q "VERSION.json"; then
  echo "✓ VERSION.json updated"
fi
```

---

## Best Practices

### DO ✅

1. **Update version files immediately** after completing a phase
2. **Write clear, user-focused** changelog entries
3. **Include breaking change warnings** prominently
4. **Test the "What's New" modal** before release
5. **Keep VERSION.json in sync** with package.json and .csproj
6. **Use meaningful codenames** (optional but helpful)
7. **Document migrations** required for breaking changes
8. **Reference git commits** in phase documentation
9. **Update test counts** in CHANGELOG and TEST-INVENTORY.md
10. **Create git tags** for all releases

### DON'T ❌

1. **Don't skip version updates** - even for small fixes
2. **Don't use vague descriptions** - be specific
3. **Don't forget to update CHANGELOG.md** - it's user-facing
4. **Don't increment version mid-development** - wait until complete
5. **Don't make breaking changes** in PATCH versions
6. **Don't forget previousVersion** in VERSION.json
7. **Don't skip documentation** - future you will thank you
8. **Don't batch multiple phases** into one version
9. **Don't forget to test** the version display in UI
10. **Don't release without completing** phase documentation

---

## Examples

### Example 1: Bug Fix Release (Patch)

**Scenario**: Fixed calendar not displaying events correctly

**VERSION.json**:
```json
{
  "version": "0.13.1",
  "releaseDate": "2026-01-20",
  "description": "Bug fix: Calendar event display and date formatting issues resolved",
  "breaking": false,
  "changelog": [
    {
      "type": "fix",
      "category": "Calendar",
      "description": "Fixed events not displaying on correct dates",
      "impact": "high"
    },
    {
      "type": "fix",
      "category": "Calendar",
      "description": "Corrected timezone handling for event dates",
      "impact": "medium"
    }
  ],
  "previousVersion": "0.13.0"
}
```

**CHANGELOG.md**:
```markdown
## [0.13.1] - 2026-01-20

### Fixed
- Calendar events now display on correct dates across timezones
- Resolved timezone handling issues causing date offset problems
- Fixed event date formatting inconsistencies
```

**Commit**:
```bash
git commit -m "fix: resolve calendar event display issues (v0.13.1)

- Fixed events not appearing on correct calendar dates
- Corrected timezone calculations for event rendering
- Improved date formatting consistency

Fixes #123, #124"
```

### Example 2: Feature Release (Minor)

**Scenario**: Added dashboard widgets feature

**VERSION.json**:
```json
{
  "version": "0.16.0",
  "releaseDate": "2026-02-05",
  "codename": "Dashboard Widgets",
  "description": "Customizable dashboard with drag-and-drop widgets for tasks, events, and productivity insights",
  "breaking": false,
  "changelog": [
    {
      "type": "feat",
      "category": "Dashboard",
      "description": "Clock/date widget with live time display",
      "impact": "medium"
    },
    {
      "type": "feat",
      "category": "Dashboard",
      "description": "Upcoming events widget showing next 5 events",
      "impact": "medium"
    },
    {
      "type": "feat",
      "category": "Dashboard",
      "description": "Task statistics widget with completion charts",
      "impact": "medium"
    },
    {
      "type": "feat",
      "category": "Dashboard",
      "description": "Calculator widget for quick calculations",
      "impact": "low"
    },
    {
      "type": "feat",
      "category": "Dashboard",
      "description": "Drag-and-drop widget layout with persistence",
      "impact": "high"
    }
  ],
  "previousVersion": "0.15.0"
}
```

**CHANGELOG.md**:
```markdown
## [0.16.0] - 2026-02-05 "Dashboard Widgets"

### Added
- **Dashboard Widgets** (Phase 16)
  - Clock/date widget with live time and current date
  - Upcoming events widget displaying next 5 scheduled events
  - Task statistics widget with interactive completion charts
  - Calculator widget for quick arithmetic operations
  - Drag-and-drop grid layout for widget positioning
  - Widget layout persistence to backend
  - Responsive widget sizing and mobile optimization
  - 28 tests for widget functionality

### Changed
- Dashboard redesigned to accommodate widget system
- Improved dashboard loading performance
- Enhanced mobile experience with optimized widget layout

### Technical
- Integrated react-grid-layout for drag-and-drop
- Added mathjs for calculator widget
- Implemented widget state management
- Created widget layout API endpoints
- Updated TEST-INVENTORY.md: 318 → 346 tests
```

### Example 3: Breaking Change Release (Major)

**Scenario**: API v2 with restructured endpoints

**VERSION.json**:
```json
{
  "version": "1.0.0",
  "releaseDate": "2026-06-01",
  "codename": "Foundation v1",
  "description": "Major release: API v2 with improved performance, restructured endpoints, and production-ready security",
  "breaking": true,
  "changelog": [
    {
      "type": "feat",
      "category": "API",
      "description": "RESTful API v2 with improved response format and pagination",
      "impact": "high"
    },
    {
      "type": "breaking",
      "category": "API",
      "description": "All endpoints moved to /api/v2/ path",
      "impact": "high"
    },
    {
      "type": "feat",
      "category": "Security",
      "description": "Enhanced authentication with refresh tokens",
      "impact": "high"
    },
    {
      "type": "breaking",
      "category": "Database",
      "description": "Database schema migrations required",
      "impact": "high"
    }
  ],
  "previousVersion": "0.23.0",
  "migrationGuide": "https://docs.example.com/migration/v1.0.0"
}
```

**CHANGELOG.md**:
```markdown
## [1.0.0] - 2026-06-01 "Foundation v1" ⚠️ BREAKING CHANGES

### ⚠️ Breaking Changes

**API Endpoint Changes**:
- All endpoints moved from `/api/v1/` to `/api/v2/`
- Response format changed: All responses now wrapped in `{ success, data, errors }` structure
- Pagination format changed: `{ items, page, pageSize, total }`
- See [Migration Guide](https://docs.example.com/migration/v1.0.0) for full details

**Database Migrations Required**:
- Run `dotnet ef database update` to apply schema changes
- Backup database before migrating
- Estimated migration time: 5-10 minutes

**Authentication Changes**:
- JWT refresh tokens now required (old tokens invalid)
- Users must re-authenticate after upgrade
- Token expiration increased to 15 minutes

### Added
- **API v2** with improved performance and standards compliance
- Refresh token authentication for enhanced security
- Comprehensive API rate limiting
- Request/response compression
- API versioning support

### Changed
- All API endpoints restructured for consistency
- Improved error responses with detailed error codes
- Enhanced pagination with metadata

### Migration Steps

1. **Backend**:
   ```bash
   # Backup database
   pg_dump todo_manager > backup.sql
   
   # Apply migrations
   dotnet ef database update
   ```

2. **Frontend**:
   ```bash
   # Clear old tokens
   localStorage.clear()
   
   # Pull latest frontend code
   git pull
   pnpm install
   ```

3. **Verify**: All users must log in again after upgrade

For detailed migration instructions, see [docs/migration/v1.0.0.md](../migration/v1.0.0.md)
```

---

## Version Display in UI

### Current Implementation

1. **Version History Page**: `/version-history`
   - Displays all version history
   - Expandable changelog for each version
   - Current version highlighted

2. **What's New Modal**:
   - Automatically shows after update
   - Dismissed per-version (stored in localStorage)
   - Shows current version features

3. **Footer Version Display** (Future):
   - Add version number to application footer
   - Link to version history page

### Future Enhancements

1. **Version API Endpoint**:
   ```
   GET /api/v1/version
   Response: { version, releaseDate, changelog }
   ```

2. **Update Notifications**:
   - Check for new versions on app load
   - Show notification badge when update available
   - Link to "What's New" modal

3. **Release Notes RSS Feed**:
   - Generate RSS feed from CHANGELOG.md
   - Allow users to subscribe to updates

---

## Copilot Integration

### Automatic Version Management

When implementing new features, GitHub Copilot should:

1. **After completing a phase**:
   - Prompt to update VERSION.json
   - Suggest version increment based on changes
   - Generate changelog entries from commit messages

2. **Before committing**:
   - Validate VERSION.json format
   - Check CHANGELOG.md is updated
   - Verify version numbers match across files

3. **Documentation updates**:
   - Auto-generate phase completion docs
   - Update TEST-INVENTORY.md test counts
   - Mark tasks complete in tasks.md

### Copilot Instructions

Add to `.github/copilot-instructions.md`:

```markdown
## Version Management

After completing any development phase:

1. Update VERSION.json with new version, release date, and changelog
2. Add detailed entry to CHANGELOG.md
3. Update package.json and .csproj version numbers
4. Create phase completion documentation in docs/phases/
5. Mark tasks complete in specs/001-todo-app/tasks.md
6. Update TEST-INVENTORY.md with new test counts
7. Commit all changes with descriptive message
8. Create git tag: git tag -a vX.Y.Z -m "Release vX.Y.Z: Feature Name"

Version incrementing rules:
- MAJOR (X.0.0): Breaking changes
- MINOR (0.X.0): New features (backward compatible)
- PATCH (0.0.X): Bug fixes only
```

---

## Conclusion

Proper version management is crucial for:

- **User Communication**: Users know what's new and what changed
- **Development Tracking**: Clear history of feature development
- **Debugging**: Easier to identify when bugs were introduced
- **Planning**: Roadmap visibility for future releases
- **Professionalism**: Shows application maturity and care

By following these guidelines, we maintain a clear, professional versioning system that benefits both developers and users.

---

## Quick Reference

**Files to Update for Each Release**:

- [ ] `VERSION.json` - Single source of truth
- [ ] `CHANGELOG.md` - Detailed changelog entry
- [ ] `apps/web/package.json` - Frontend version
- [ ] `apps/finance-api/FinanceApi.csproj` - Backend version
- [ ] `docs/phases/phase-XX-name/complete.md` - Phase documentation
- [ ] `specs/001-todo-app/tasks.md` - Mark tasks complete
- [ ] `docs/testing/TEST-INVENTORY.md` - Update test counts
- [ ] Git tag: `git tag -a vX.Y.Z -m "Message"`

**Version Decision Tree**:

```
Breaking changes? → MAJOR (X.0.0)
  ├─ No
  │  └─ New features? → MINOR (0.X.0)
  │      ├─ No
  │      │  └─ Bug fixes? → PATCH (0.0.X)
  │      └─ Yes → MINOR (0.X.0)
  └─ Yes → MAJOR (X.0.0)
```

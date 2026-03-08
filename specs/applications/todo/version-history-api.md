# Version History API

**Feature ID**: `version-history-api`  
**Priority**: P3 (Quality of Life / Technical Debt)  
**Phase**: 23  
**Status**: Backlog  
**Estimated Effort**: 1 week (8 tasks)

---

## Overview

Currently, the Version History page displays version information from a hardcoded `mockChangelog` array. This approach requires manual updates to the frontend code whenever a new version is released, creating technical debt and potential inconsistencies with the actual CHANGELOG.md and VERSION.json files.

This feature will implement a proper API-driven version history system that reads version data from authoritative sources (VERSION.json and CHANGELOG.md) and serves it via a REST API. This ensures the Version History page always reflects accurate, up-to-date information without manual frontend updates.

---

## Business Value

### Problems Solved

1. **Manual Maintenance**: Developers must remember to update mockChangelog in VersionHistoryPage.tsx with every release
2. **Data Duplication**: Version information exists in VERSION.json, CHANGELOG.md, git tags, and mockChangelog (4 sources of truth)
3. **Inconsistency Risk**: Mockup data can drift from actual release notes in CHANGELOG.md
4. **Scalability**: As version count grows, hardcoded array becomes unwieldy
5. **Developer Experience**: Violates DRY principle, increases cognitive load during releases

### Benefits

- **Single Source of Truth**: CHANGELOG.md becomes the authoritative version history
- **Automatic Updates**: Version History page reflects latest releases without code changes
- **Reduced Errors**: No risk of forgetting to update mockChangelog during releases
- **Better UX**: Users always see accurate, complete version history
- **API Reusability**: Version history endpoint can be used by other features (notifications, admin dashboard)

---

## User Stories

### US-VH1: API-Driven Version History Display

**As a** user viewing the Version History page  
**I want** to see accurate, up-to-date release information  
**So that** I can understand what features have been added in each version

**Priority**: P3  
**Why This Priority**: Improves maintainability and accuracy but doesn't add new user-facing functionality

**Independent Test**: Navigate to Version History page, verify all versions from CHANGELOG.md are displayed with correct dates, codenames, and changelog entries

**Acceptance Scenarios**:

1. **Given** CHANGELOG.md contains 5 versions  
   **When** I navigate to /version-history  
   **Then** all 5 versions are displayed in reverse chronological order (newest first)

2. **Given** VERSION.json has codename "Admin & Design System"  
   **When** the Version History page loads  
   **Then** the current version card displays "Admin & Design System" as the codename

3. **Given** CHANGELOG.md has version 0.14.0 released on 2026-01-28  
   **When** I view version 0.14.0 in the history  
   **Then** the release date displays as "28 January 2026"

4. **Given** a new version is released and CHANGELOG.md is updated  
   **When** I refresh the Version History page  
   **Then** the new version appears without requiring code deployment

5. **Given** version 0.13.0 has 6 changelog entries in CHANGELOG.md  
   **When** I expand version 0.13.0  
   **Then** all 6 changelog entries are displayed with correct categories and descriptions

6. **Given** the API endpoint is unreachable  
   **When** the Version History page loads  
   **Then** a friendly error message is displayed with retry option

7. **Given** CHANGELOG.md follows Keep a Changelog format  
   **When** the API parses the file  
   **Then** Added/Changed/Fixed sections are correctly categorized as feat/fix/docs types

---

## Technical Design

### API Endpoints

#### GET /api/version/current

**Purpose**: Return current version information from VERSION.json

**Response** (200 OK):
```json
{
  "version": "0.14.0",
  "releaseDate": "2026-01-28",
  "codename": "Admin & Design System",
  "description": "Admin system implementation and design system centralization",
  "breaking": false,
  "changelog": [
    {
      "type": "feat",
      "category": "Admin System",
      "description": "Complete admin system with role-based access control",
      "impact": "high"
    }
  ]
}
```

#### GET /api/version/history

**Purpose**: Return all version history parsed from CHANGELOG.md

**Response** (200 OK):
```json
{
  "versions": [
    {
      "version": "0.14.0",
      "releaseDate": "2026-01-28",
      "codename": "Admin & Design System",
      "changelog": [
        {
          "section": "Added",
          "items": [
            {
              "category": "Admin System",
              "description": "IsAdmin boolean field added to User model",
              "type": "feat"
            },
            {
              "category": "Design System",
              "description": "Created @life-manager/ui shared package",
              "type": "feat"
            }
          ]
        },
        {
          "section": "Changed",
          "items": [
            {
              "category": "Navigation",
              "description": "Design System link conditionally displayed",
              "type": "feat"
            }
          ]
        },
        {
          "section": "Fixed",
          "items": [
            {
              "category": "Components",
              "description": "Badge and Alert prop errors in Design System page",
              "type": "fix"
            }
          ]
        }
      ]
    },
    {
      "version": "0.13.0",
      "releaseDate": "2026-01-18",
      "codename": "Events Foundation",
      "changelog": [...]
    }
  ],
  "totalVersions": 5,
  "earliestVersion": "0.10.0",
  "latestVersion": "0.14.0"
}
```

#### GET /api/version/history/:version

**Purpose**: Return specific version details

**Response** (200 OK):
```json
{
  "version": "0.13.0",
  "releaseDate": "2026-01-18",
  "codename": "Events Foundation",
  "changelog": [
    {
      "section": "Added",
      "items": [...]
    }
  ],
  "previousVersion": "0.12.0",
  "nextVersion": "0.14.0"
}
```

**Response** (404 Not Found):
```json
{
  "error": "Version not found",
  "requestedVersion": "0.99.0"
}
```

---

### Backend Architecture

#### File Structure

```
apps/finance-api/Features/Version/
├── Controllers/
│   └── VersionController.cs          // API endpoints
├── Services/
│   ├── IVersionService.cs            // Service interface
│   ├── VersionService.cs             // Business logic
│   ├── IChangelogParser.cs           // Parser interface
│   └── ChangelogParser.cs            // CHANGELOG.md parsing
├── DTOs/
│   ├── VersionDto.cs                 // Version response model
│   ├── ChangelogEntryDto.cs          // Single changelog entry
│   └── VersionHistoryDto.cs          // Full history response
└── Models/
    ├── VersionInfo.cs                // Parsed version data
    └── ChangelogSection.cs           // Added/Changed/Fixed sections
```

#### Services

**VersionService**:
- `GetCurrentVersionAsync()`: Read and parse VERSION.json
- `GetVersionHistoryAsync()`: Parse all versions from CHANGELOG.md
- `GetVersionByNumberAsync(string version)`: Get specific version details
- `SearchVersionsAsync(string query)`: Filter versions by codename or description

**ChangelogParser**:
- `ParseChangelogAsync()`: Read CHANGELOG.md and parse all versions
- `ParseVersionSection(string content)`: Extract version number, date, codename
- `ParseChangelogItems(string content)`: Extract Added/Changed/Fixed sections
- `DetermineChangeType(string section)`: Map section to type (feat/fix/perf/docs)
- `ExtractCategoryAndDescription(string item)`: Parse "- **Category**: Description" format

#### Caching Strategy

- **In-Memory Cache**: Cache parsed CHANGELOG.md for 5 minutes to avoid repeated file I/O
- **Cache Invalidation**: Clear cache on POST to any version-related endpoint (future: version tagging)
- **Development Mode**: Disable caching when `ASPNETCORE_ENVIRONMENT=Development`

---

### Frontend Changes

#### Service Layer

```typescript
// apps/web/src/services/versionService.ts
export interface VersionInfo {
  version: string;
  releaseDate: string;
  codename: string;
  description?: string;
  breaking?: boolean;
  changelog: ChangelogEntry[];
}

export interface ChangelogEntry {
  type: 'feat' | 'fix' | 'perf' | 'docs' | 'test';
  category: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
}

export interface VersionHistory {
  versions: VersionInfo[];
  totalVersions: number;
  earliestVersion: string;
  latestVersion: string;
}

export const versionService = {
  getCurrentVersion: async (): Promise<VersionInfo> => {
    const { data } = await apiClient.get('/api/version/current');
    return data;
  },

  getVersionHistory: async (): Promise<VersionHistory> => {
    const { data } = await apiClient.get('/api/version/history');
    return data;
  },

  getVersionByNumber: async (version: string): Promise<VersionInfo> => {
    const { data } = await apiClient.get(`/api/version/history/${version}`);
    return data;
  }
};
```

#### Component Updates

**VersionHistoryPage.tsx**:
- Remove `mockChangelog` constant
- Add `useEffect` to fetch data from API
- Add loading state (skeleton placeholders)
- Add error state with retry button
- Use fetched data instead of hardcoded data
- Cache fetched data in component state

**WhatsNewModal.tsx**:
- Already uses `versionData` from VERSION.json import
- No changes required (continues using import for simplicity)
- Future: Could use `/api/version/current` for consistency

---

## Implementation Tasks

See `specs/001-todo-app/tasks.md` for detailed task breakdown:
- Tasks T788-T795 (Backend: 5 tasks)
- Tasks T796-T799 (Frontend: 4 tasks)

**Total**: 8 tasks, estimated 1 week

---

## Testing Strategy

### Backend Unit Tests (ChangelogParser)

- Parse CHANGELOG.md with 5 versions
- Handle malformed markdown gracefully
- Extract version numbers, dates, codenames correctly
- Parse Added/Changed/Fixed sections
- Handle missing sections (e.g., version with only "Added")
- Verify type mapping (Added→feat, Fixed→fix)

### Backend Integration Tests (VersionController)

- GET /api/version/current returns valid JSON
- GET /api/version/history returns all versions
- GET /api/version/history/:version returns specific version
- GET /api/version/history/invalid returns 404
- Verify response matches OpenAPI schema
- Test caching behavior

### Frontend Component Tests

- VersionHistoryPage fetches data on mount
- Loading state displays skeleton placeholders
- Error state displays retry button
- Successful fetch renders version cards
- Expand/collapse functionality works
- Empty state when no versions (edge case)

### E2E Tests

- Navigate to /version-history, verify page loads
- Verify current version card displays correct data
- Expand version 0.13.0, verify changelog items
- Verify pagination/scrolling if >10 versions
- Test error handling (kill API, verify error message)

---

## Migration Plan

### Phase 1: Backend Implementation (Week 1, Days 1-3)

1. Create VersionController with 3 endpoints
2. Implement ChangelogParser service
3. Write comprehensive unit tests
4. Test manually with Postman/curl

### Phase 2: Frontend Integration (Week 1, Days 4-5)

1. Create versionService with API methods
2. Update VersionHistoryPage to use API
3. Add loading and error states
4. Remove mockChangelog
5. Test in development environment

### Phase 3: Testing & Documentation (Week 1, Day 5)

1. Write E2E test for version history page
2. Update API documentation
3. Update VERSION-MANAGEMENT.md with new process
4. Create completion documentation

---

## Success Criteria

- [ ] All 3 API endpoints return correct data matching CHANGELOG.md
- [ ] VersionHistoryPage displays all versions without hardcoded data
- [ ] Adding new version to CHANGELOG.md automatically appears on page (no code changes)
- [ ] Loading and error states provide good UX
- [ ] All tests pass (unit, integration, E2E)
- [ ] API response time <100ms (cached), <500ms (uncached)
- [ ] Documentation updated (API docs, VERSION-MANAGEMENT.md)

---

## Future Enhancements

- **Search & Filter**: Search versions by codename, description, or changelog text
- **RSS Feed**: Generate RSS feed for version releases
- **Email Notifications**: Notify users of new releases
- **Admin Version Management**: UI to create/edit releases (beyond CHANGELOG.md editing)
- **GitHub Integration**: Sync with GitHub Releases API
- **Version Comparison**: Side-by-side comparison of two versions

---

## Dependencies

- CHANGELOG.md must follow Keep a Changelog format
- VERSION.json structure remains consistent
- Backend: System.Text.Json for parsing
- Frontend: apiClient from services/api-client.ts

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CHANGELOG.md format changes | High | Implement robust parser with validation, log warnings for malformed sections |
| Large CHANGELOG.md files | Medium | Implement pagination, limit to last 20 versions, add "load more" button |
| File I/O performance | Low | Implement caching (5 min TTL), consider moving to database in future |
| Breaking API changes | Medium | Version API endpoints (/api/v1/version/), maintain backward compatibility |

---

## Related Documentation

- `docs/VERSION-MANAGEMENT.md`: Version update process
- `CHANGELOG.md`: Source of truth for version history
- `VERSION.json`: Current version metadata
- `specs/001-todo-app/tasks.md`: Implementation tasks T788-T795

---

**Created**: 2026-01-28  
**Last Updated**: 2026-01-28  
**Author**: GitHub Copilot + User  
**Status**: Ready for implementation

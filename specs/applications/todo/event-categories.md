# Feature Specification: Event Categories & Tags

**Feature ID**: `009-event-categories`  
**Created**: 2026-01-18  
**Status**: Planned  
**Priority**: P2  
**Dependencies**: Events Feature (Phase 13)

## Overview

Enable users to organize events and tasks with custom categories and tags. Categories provide hierarchical organization (e.g., "Work", "Personal"), while tags offer flexible cross-cutting labels (e.g., "urgent", "meeting", "travel"). Both support color-coding for visual distinction.

## Rationale

As users accumulate events and tasks, **organization becomes critical**. Without categories:
- All events look the same
- Hard to filter by type (work vs. personal)
- No visual scanning (everything is one colour)
- Can't quickly assess workload by category

**Business Value**:
- Improves user experience (less cognitive load)
- Enables powerful filtering and search
- Supports productivity workflows (focus on one category)
- Differentiates from basic calendar apps

## Core Concepts

### Category vs. Tag

| Feature | Category | Tag |
|---------|----------|-----|
| **Relationship** | One per event/task | Many per event/task |
| **Hierarchy** | Structured (parent/child) | Flat |
| **Primary Use** | Broad organization | Specific attributes |
| **Examples** | Work, Personal, Health | urgent, meeting, recurring, travel |
| **Colour Coding** | Yes | Optional |

### Data Model

```typescript
interface Category {
  id: string;
  userId: string;
  name: string;
  color: string; // Hex color code
  icon?: string; // Emoji or icon name
  parentId?: string; // For nested categories
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  usageCount: number; // For sorting by popularity
  createdAt: Date;
}

interface EventTag {
  eventId: string;
  tagId: string;
}
```

### Default Categories

New users start with these categories:
- 🏢 Work (Blue)
- 🏠 Personal (Green)
- 👨‍👩‍👧‍👦 Family (Orange)
- 💪 Health & Fitness (Red)
- 📚 Learning (Purple)

Users can customize, delete, or add more.

### Visual Design

**Calendar with Categories**:
```
┌─────────────────────────────────────────┐
│ January 2026                            │
│                                         │
│ 15 Mon                                  │
│  🏢 Team Meeting (Work) [urgent] [mtg]  │
│  💪 Gym Session (Health)                │
│                                         │
│ 16 Tue                                  │
│  🏠 Dentist Appointment (Personal)      │
│  📚 Online Course (Learning) [webinar]  │
└─────────────────────────────────────────┘
```

**Category Filter**:
```
┌─────────────────────────────────────────┐
│ Categories                              │
│ ☑ 🏢 Work (12)                          │
│ ☑ 🏠 Personal (8)                       │
│ ☑ 👨‍👩‍👧‍👦 Family (5)                           │
│ ☐ 💪 Health (3)                         │
│ ☐ 📚 Learning (2)                       │
│                                         │
│ Tags                                    │
│ [urgent] [meeting] [recurring]          │
└─────────────────────────────────────────┘
```

## User Scenarios & Testing

### User Story 1 - Create Categories (Priority: P1)

**Why this priority**: Foundation - users need categories to organize events.

**Independent Test**: Create 5 custom categories with colors and icons, verify they appear in dropdowns.

**Acceptance Scenarios**:

1. **Given** category management page, **When** user clicks "Add Category", **Then** modal opens with name, color, and icon inputs
2. **Given** category form, **When** user enters "Work Projects" with blue color, **Then** category saves and appears in list
3. **Given** color picker, **When** user selects color, **Then** preview updates immediately
4. **Given** emoji picker, **When** user selects 🚀, **Then** emoji displays next to category name
5. **Given** existing category, **When** user clicks edit, **Then** form pre-populates with current values

### User Story 2 - Assign Categories to Events (Priority: P1)

**Why this priority**: Core functionality - events must be categorizable.

**Independent Test**: Create events with different categories, verify color-coding on calendar.

**Acceptance Scenarios**:

1. **Given** event creation form, **When** user opens category dropdown, **Then** all categories display with icons
2. **Given** category selected, **When** event saved, **Then** event displays with category color border/background
3. **Given** event with "Work" category, **When** viewing calendar, **Then** event has blue color indicator
4. **Given** event editing, **When** user changes category, **Then** color updates immediately on calendar
5. **Given** uncategorized event, **When** viewing, **Then** default grey color applies

### User Story 3 - Tag Events (Priority: P2)

**Why this priority**: Adds flexible organization beyond single category.

**Independent Test**: Add multiple tags to event, verify tags display and are searchable.

**Acceptance Scenarios**:

1. **Given** event form, **When** user types "urgent" in tags field, **Then** autocomplete suggests existing tags
2. **Given** new tag "important", **When** user presses Enter, **Then** tag creates and attaches to event
3. **Given** event with 3 tags, **When** viewing event details, **Then** all tags display as clickable badges
4. **Given** tag clicked, **When** user interacts, **Then** shows all events with that tag
5. **Given** tag management, **When** user deletes tag, **Then** removed from all events but events remain

### User Story 4 - Filter by Category/Tag (Priority: P1)

**Why this priority**: Essential for finding events - without filtering, categories are useless.

**Independent Test**: Apply category and tag filters, verify only matching events display.

**Acceptance Scenarios**:

1. **Given** calendar view, **When** user unchecks "Personal" category, **Then** personal events disappear
2. **Given** tag filter "urgent" active, **When** viewing calendar, **Then** only urgent-tagged events show
3. **Given** multiple filters active, **When** viewing, **Then** events matching ALL filters display (AND logic)
4. **Given** no events match filters, **When** viewing, **Then** "No events match your filters" message displays
5. **Given** filters applied, **When** user clicks "Clear Filters", **Then** all events reappear

### User Story 5 - Category Analytics (Priority: P3)

**Why this priority**: Nice-to-have - shows time distribution across categories.

**Independent Test**: View analytics, verify accurate event counts and time spent per category.

**Acceptance Scenarios**:

1. **Given** analytics page, **When** viewing, **Then** pie chart shows event distribution by category
2. **Given** work category selected, **When** viewing details, **Then** shows total hours spent on work events this month
3. **Given** category trend, **When** viewing, **Then** line chart shows category usage over last 6 months
4. **Given** tag analytics, **When** viewing, **Then** shows most-used tags with usage counts
5. **Given** time range selector, **When** user selects "This Year", **Then** analytics update to show yearly data

## Technical Architecture

### Backend Components

**Database Schema**:
```typescript
interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  parentId?: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  usageCount: number;
  createdAt: Date;
}

interface EventCategory {
  eventId: string;
  categoryId: string;
}

interface EventTag {
  eventId: string;
  tagId: string;
}
```

**Service Layer**:
- `CategoryService` - CRUD for categories
- `TagService` - CRUD for tags
- `EventCategorizationService` - Assign categories/tags to events
- `CategoryAnalyticsService` - Generate analytics reports

**API Endpoints**:
- `GET /api/v1/categories` - Get user's categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category
- `GET /api/v1/tags` - Get user's tags (sorted by usage)
- `POST /api/v1/tags` - Create tag
- `DELETE /api/v1/tags/:id` - Delete tag
- `GET /api/v1/analytics/categories` - Get category analytics

### Frontend Components

**UI Pages**:
- `CategoryManagementPage` - Manage categories
- `CategoryForm` - Create/edit category
- `TagManagementPage` - Manage tags
- `CategoryFilterPanel` - Filter calendar by category
- `TagFilterPanel` - Filter calendar by tag
- `CategoryAnalytics` - View category analytics

**Components**:
- `CategoryPicker` - Dropdown for selecting category
- `TagInput` - Autocomplete input for tags
- `TagBadge` - Display tag chip
- `CategoryColorIndicator` - Colored dot/border on events
- `CategoryLegend` - Show all categories with colors

**State Management**:
- Categories stored in context (global state)
- Tags loaded on demand with autocomplete
- Filter state persisted to localStorage

## Task Breakdown: Phase 20 - Event Categories & Tags (3 weeks)

### Week 1: Backend Foundation (Days 1-5)

**Database Schema**
- [ ] T863 [P] Create Category entity - 2h
- [ ] T864 [P] Create Tag entity - 2h
- [ ] T865 [P] Create EventCategory join entity - 1h
- [ ] T866 [P] Create EventTag join entity - 1h
- [ ] T867 Create EF Core migrations - 1h
- [ ] T868 Apply migrations and verify schema - 1h

**Category Service**
- [ ] T869 Create CategoryService - 4h
- [ ] T870 Implement CreateCategory method - 3h
- [ ] T871 Implement UpdateCategory method - 3h
- [ ] T872 Implement DeleteCategory method - 3h
- [ ] T873 Implement GetUserCategories method - 2h
- [ ] T874 Implement seed default categories for new users - 3h
- [ ] T875 Write unit tests for category service (15 tests) - 5h

**Tag Service**
- [ ] T876 Create TagService - 4h
- [ ] T877 Implement CreateTag method - 3h
- [ ] T878 Implement DeleteTag method - 2h
- [ ] T879 Implement GetUserTags method - 2h
- [ ] T880 Implement GetPopularTags method - 3h
- [ ] T881 Write unit tests for tag service (12 tests) - 4h

**Checkpoint**: Backend services operational

### Week 2: API & Analytics (Days 6-10)

**API Endpoints**
- [ ] T882 Create CategoriesController - 3h
- [ ] T883 GET /api/v1/categories endpoint - 2h
- [ ] T884 POST /api/v1/categories endpoint - 3h
- [ ] T885 PUT /api/v1/categories/:id endpoint - 3h
- [ ] T886 DELETE /api/v1/categories/:id endpoint - 2h
- [ ] T887 Create TagsController - 3h
- [ ] T888 GET /api/v1/tags endpoint - 2h
- [ ] T889 POST /api/v1/tags endpoint - 2h
- [ ] T890 DELETE /api/v1/tags/:id endpoint - 2h
- [ ] T891 Write integration tests for category endpoints (12 tests) - 4h
- [ ] T892 Write integration tests for tag endpoints (10 tests) - 4h

**Event Integration**
- [ ] T893 Add categoryId to Event entity - 2h
- [ ] T894 Create migration for event category FK - 1h
- [ ] T895 Update EventService to handle categories - 3h
- [ ] T896 Update EventService to handle tags - 4h
- [ ] T897 Update event endpoints to accept category/tags - 3h
- [ ] T898 Write integration tests for event categorization (10 tests) - 4h

**Analytics Service**
- [ ] T899 Create CategoryAnalyticsService - 5h
- [ ] T900 Implement GetCategoryDistribution method - 4h
- [ ] T901 Implement GetCategoryTimeSpent method - 4h
- [ ] T902 Implement GetCategoryTrend method - 5h
- [ ] T903 Create AnalyticsController - 3h
- [ ] T904 GET /api/v1/analytics/categories endpoint - 3h
- [ ] T905 Write unit tests for analytics service (12 tests) - 4h

**Checkpoint**: API complete, analytics ready

### Week 3: UI & Polish (Days 11-15)

**Frontend TypeScript Types**
- [ ] T906 [P] Create Category interface - 1h
- [ ] T907 [P] Create Tag interface - 1h

**Frontend Services**
- [ ] T908 Create categoryService.ts - 4h
- [ ] T909 Create tagService.ts - 3h
- [ ] T910 Write service tests (10 tests) - 3h

**Category Management UI**
- [ ] T911 Create CategoryManagementPage - 6h
- [ ] T912 Create CategoryForm component - 5h
- [ ] T913 Create CategoryList component - 4h
- [ ] T914 Create ColorPicker component - 4h
- [ ] T915 Create EmojiPicker component - 4h

**Tag Management UI**
- [ ] T916 Create TagManagementPage - 5h
- [ ] T917 Create TagList component - 3h
- [ ] T918 Create TagForm component - 3h

**Event Form Integration**
- [ ] T919 Create CategoryPicker component - 5h
- [ ] T920 Create TagInput component with autocomplete - 6h
- [ ] T921 Integrate CategoryPicker into EventForm - 3h
- [ ] T922 Integrate TagInput into EventForm - 3h
- [ ] T923 Update TaskForm with category picker - 3h

**Calendar Integration**
- [ ] T924 Create CategoryFilterPanel component - 5h
- [ ] T925 Create TagFilterPanel component - 4h
- [ ] T926 Add category color indicators to calendar events - 4h
- [ ] T927 Implement filter logic in calendar view - 5h
- [ ] T928 Create CategoryLegend component - 3h

**Analytics UI**
- [ ] T929 Create CategoryAnalyticsPage - 6h
- [ ] T930 Install recharts library (if not already) - 1h
- [ ] T931 Create CategoryDistributionChart (pie chart) - 5h
- [ ] T932 Create CategoryTrendChart (line chart) - 5h
- [ ] T933 Create TagUsageChart (bar chart) - 4h

**Testing**
- [ ] T934 Write component tests for category UI (15 tests) - 5h
- [ ] T935 Write component tests for tag UI (12 tests) - 4h
- [ ] T936 Write E2E test for category management - 4h
- [ ] T937 Write E2E test for event categorization - 4h
- [ ] T938 Write E2E test for filtering by category - 4h
- [ ] T939 Write E2E test for tag management - 3h

**Documentation**
- [ ] T940 Write user guide for categories and tags - 3h
- [ ] T941 Document category analytics - 2h
- [ ] T942 Create categorization best practices guide - 2h

**Final Review**
- [ ] T943 Accessibility audit (color contrast, keyboard nav) - 3h
- [ ] T944 Performance testing (1000 events with categories) - 3h
- [ ] T945 Code review and refactoring - 4h

**Checkpoint**: Complete event categories & tags feature

## Effort Summary

**Total Tasks**: 83 tasks (T863-T945)  
**Total Estimated Time**: ~190 hours (3 weeks)  
**Feature Priorities**:
- Categories: P1 (fundamental organization)
- Category filtering: P1 (essential for usability)
- Tags: P2 (flexible organization)
- Analytics: P3 (nice-to-have insights)

## Dependencies

- **Phase 13**: Events feature must be complete
- **Phase 16**: Dashboard widgets (analytics can reuse chart components)
- **Design System**: Color picker and emoji picker components

## Design Considerations

### Color Palette

Provide predefined color palette with accessible colors:
```typescript
const categoryColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Amber
];
```

### Category Hierarchy

Support nested categories (max 2 levels):
- Work
  - Meetings
  - Projects
- Personal
  - Errands
  - Hobbies

### Tag Auto-Suggestions

Suggest common tags based on event content:
- Event title contains "meeting" → suggest "meeting" tag
- Event is recurring → suggest "recurring" tag
- Event duration >4 hours → suggest "all-day" tag

## Success Criteria

- ✅ Users can create unlimited custom categories
- ✅ Default categories seed for new users
- ✅ Events display with category color indicators
- ✅ Category filters work instantly (<100ms)
- ✅ Tag autocomplete shows suggestions in <200ms
- ✅ Analytics generate in <2 seconds
- ✅ Color picker accessible (WCAG AA contrast)
- ✅ Performance: 1000 categorized events load in <1 second
- ✅ Mobile: Category picker works smoothly on touch devices

## Future Enhancements (Phase 2)

- **Smart Categorization**: AI suggests categories based on event content
- **Category Rules**: Auto-assign categories based on patterns (e.g., all-day events → "Personal")
- **Shared Categories**: Team categories for shared calendars
- **Category Templates**: Export/import category sets
- **Tag Synonyms**: Merge similar tags ("mtg" → "meeting")
- **Hierarchical Tags**: Nested tags like categories

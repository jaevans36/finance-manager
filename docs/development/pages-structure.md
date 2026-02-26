# Pages Structure and Organization

## Overview

The application follows a **feature-based folder structure** for better organization, maintainability, and scalability. Each major feature/page has its own directory containing the page component and related sub-components.

## Current Structure

```
apps/web/src/pages/
├── auth/                          # Authentication features
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── VerifyEmailPage.tsx
│   └── ResendVerificationPage.tsx
├── calendar/                      # Calendar feature (422 lines)
│   ├── CalendarPage.tsx
│   └── components/                # Page-specific components
│       ├── EmptyCalendarState.tsx
│       ├── KeyboardShortcutsHint.tsx
│       └── index.ts
├── dashboard/                     # Dashboard feature (303 lines → componentized)
│   ├── DashboardPage.tsx
│   └── components/                # Page-specific components
│       ├── DashboardHeader.tsx
│       ├── DashboardLayout.tsx
│       └── index.ts
├── profile/                       # User profile
│   └── ProfilePage.tsx
└── weekly-progress/               # Weekly progress tracking (1291 lines → 900 lines)
    ├── WeeklyProgressPage.tsx
    └── components/                # Page-specific components
        ├── StatisticCard.tsx
        ├── DateNavigation.tsx
        ├── WeeklyGoalCard.tsx
        ├── DailyTaskCard.tsx
        ├── UrgentTasksCard.tsx
        ├── ChartCard.tsx
        ├── ViewModeSelector.tsx
        ├── GroupFilter.tsx
        ├── InsightCard.tsx
        ├── ErrorDisplay.tsx
        └── index.ts               # Component exports
```

## Naming Conventions

### Folders
- Use **kebab-case** for folder names
- Examples: `weekly-progress`, `auth`, `calendar`

### Components
- Use **PascalCase** for component file names
- Include `.tsx` extension for React components
- Examples: `WeeklyProgressPage.tsx`, `LoginPage.tsx`

### Component Files
- Page components: `[Feature]Page.tsx` (e.g., `DashboardPage.tsx`)
- Sub-components: Descriptive names (e.g., `StatisticCard.tsx`)

## Organization Principles

### 1. Feature-Based Organization
Each major feature gets its own folder containing:
- The main page component
- A `components/` subdirectory for feature-specific components
- An `index.ts` for clean exports (when applicable)

### 2. Component Colocation
Components should be placed as close as possible to where they're used:
- Feature-specific components → `pages/[feature]/components/`
- Shared components → `src/components/`
- UI primitives → `src/components/ui/`

### 3. Scalability
As features grow, additional subdirectories can be added:
```
pages/dashboard/
  ├── DashboardPage.tsx
  ├── components/
  ├── hooks/                      # Feature-specific hooks
  ├── utils/                      # Feature-specific utilities
  └── types/                      # Feature-specific types
```

## Benefits

### ✅ Improved Organization
- Related code is grouped together
- Easy to find feature-specific files
- Clear separation of concerns

### ✅ Better Maintainability
- Changes to a feature are localized
- Easier to refactor or remove features
- Reduced coupling between features

### ✅ Enhanced Developer Experience
- Intuitive file structure
- Easier onboarding for new developers
- Better IDE navigation and search

### ✅ Code Splitting
- Natural boundaries for lazy loading
- Better performance with feature-based chunks
- Smaller initial bundle size

## Migration from Flat Structure

### Before
```
pages/
  ├── LoginPage.tsx
  ├── RegisterPage.tsx
  ├── DashboardPage.tsx           # 8 lines (wrapper)
  ├── Dashboard.tsx               # 303 lines
  ├── ProfilePage.tsx
  ├── WeeklyProgressPage.tsx      # 1291 lines!
  └── calendar/
      └── CalendarPage.tsx        # 422 lines
```

### After
```
pages/
  ├── auth/                       # ✅ Grouped authentication (6 pages)
  ├── dashboard/                  # ✅ Merged + componentized (2 components)
  │   ├── DashboardPage.tsx       # Merged wrapper + main file
  │   └── components/
  ├── profile/                    # ✅ Organized
  ├── calendar/                   # ✅ Componentized (2 components)
  │   ├── CalendarPage.tsx
  │   └── components/
  └── weekly-progress/            # ✅ Extracted 10 components (30% reduction)
      ├── WeeklyProgressPage.tsx  # ~900 lines
      └── components/
```

### Improvements Achieved

**weekly-progress/**
- Extracted 10 reusable components
- Reduced from 1291 to ~900 lines (30% reduction)
- Better testability and maintainability

**calendar/**
- Created 2 presentational components
- Improved code organization
- Better separation of concerns

**dashboard/**
- Merged 2 files into 1 (removed unnecessary wrapper)
- Extracted header and layout components
- Cleaner component structure

**auth/**
- Grouped related pages logically
- Easy to find authentication code
- Better feature encapsulation

## Implementation Guidelines

### When Creating a New Page

1. **Simple page** (no sub-components needed):
   ```
   pages/[feature]/
     └── [Feature]Page.tsx
   ```

2. **Complex page** (with sub-components):
   ```
   pages/[feature]/
     ├── [Feature]Page.tsx
     └── components/
         ├── Component1.tsx
         ├── Component2.tsx
         └── index.ts
   ```

### Component Extraction Criteria

Extract a component when:
- It's reused within the feature (2+ times)
- It exceeds ~100 lines
- It has distinct responsibility
- It improves readability

### Import Path Updates

After reorganization, update imports in:
- `App.tsx` (lazy-loaded routes)
- Test files
- Related component imports

Example:
```typescript
// Before
import LoginPage from './pages/LoginPage';

// After
import LoginPage from './pages/auth/LoginPage';
```

## Future Improvements

### Potential Enhancements
1. Add `hooks/` directories for custom hooks
2. Add `types/` for feature-specific TypeScript types
3. Add `utils/` for feature-specific utilities
4. Consider barrel exports (index.ts) for cleaner imports
5. Extract common patterns into HOCs or custom hooks

### Dashboard Cleanup
Currently has two files (`Dashboard.tsx` and `DashboardPage.tsx`):
- Merge or clarify distinction
- Extract components if needed
- Follow same pattern as `weekly-progress`

## Related Documentation

- [Component Structure Guide](./design-system-audit.md)
- [Testing Guide](../testing/TEST-WRITING-GUIDE.md)
- [Code Style Guide](../../copilot/prompts/code-style.prompt.md)

---

**Last Updated**: 14 January 2026  
**Changes**: Reorganized pages from flat structure to feature-based folders

# Feature Specification: Frontend Modernisation

**Feature ID**: `platform-frontend-modernisation`  
**Created**: 2026-02-25  
**Status**: Draft  
**Priority**: P1  
**Dependencies**: None (can begin immediately on existing codebase)

## Overview

A phased modernisation of the frontend technology stack, replacing styled-components with Tailwind CSS + shadcn/ui for the component layer, adopting TanStack Query for server state management, and introducing React Hook Form + Zod for form handling. This positions the platform for scalable multi-application development.

## Rationale

The current frontend stack (styled-components 6, manual `useState`/`useEffect` data fetching, hand-built form validation) has served the To Do application well but introduces scaling problems as the platform grows to multiple applications:

1. **Component duplication** — The same UI components exist in both `packages/ui/` and `apps/web/src/components/ui/`, leading to drift and dead code (evidenced by the 2,269-line cleanup in the react-doctor pass).
2. **No data caching** — Every page navigation reloads data from the API. No background refetching, no optimistic updates, no request deduplication.
3. **Runtime CSS overhead** — styled-components generates CSS at runtime, increasing bundle size and TTI.
4. **Theming complexity** — Theme-aware styles require `${({ theme }) => theme.colors.*}` boilerplate on every styled component.
5. **Form handling inconsistency** — Each form implements its own validation with `useState` chains, no shared schema validation.

### Technology Decisions

| Current | Replacement | Reason |
|---------|-------------|--------|
| styled-components 6 | Tailwind CSS 3+ | Build-time CSS, utility-first, design tokens in config |
| Hand-built components (`@life-manager/ui`) | shadcn/ui + Radix UI | Accessible primitives, copy-paste ownership, Tailwind-native |
| `useState`/`useEffect` data fetching | TanStack Query v5 | Caching, background refetch, optimistic updates, deduplication |
| Manual form `useState` | React Hook Form + Zod | Type-safe validation, shared schemas with backend |
| Axios (via `apiClient`) | Axios (via `apiClient`) | **No change** — centralised client remains |
| React Router v6 | React Router v6 | **No change** — defer TanStack Router until multi-app shell |
| Recharts | Recharts | **No change** — charting library unaffected |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tailwind CSS & shadcn/ui Foundation (Priority: P1)

Developers need a modern, accessible component library with build-time CSS so that new features can be built faster with consistent styling, and existing pages can be incrementally migrated without breaking changes.

**Why this priority**: This is the foundation for all other modernisation work. shadcn/ui components require Tailwind. Every subsequent phase depends on this being in place.

**Independent Test**: Create a test page using shadcn Button, Card, and Input components. Verify they render correctly in both light and dark modes without any styled-components dependency.

**Acceptance Scenarios**:

1. **Given** the project has Tailwind CSS installed, **When** a developer creates a new component using Tailwind utility classes, **Then** the styles are applied at build time with no runtime CSS generation
2. **Given** the shared Tailwind preset exists in `packages/ui`, **When** any application imports it, **Then** design tokens (spacing, colours, border radius, typography) are consistent across all apps
3. **Given** shadcn/ui is initialised, **When** a developer runs `npx shadcn@latest add button`, **Then** the component is added to the project with correct Tailwind classes and Radix accessibility primitives
4. **Given** both styled-components and Tailwind exist during migration, **When** a page mixes old and new components, **Then** both render correctly without style conflicts
5. **Given** the dark mode toggle is used, **When** a page contains shadcn components, **Then** all components respect the current theme via CSS `dark:` class variants
6. **Given** the Tailwind config extends the shared preset, **When** design tokens are updated in one place, **Then** all applications reflect the change

---

### User Story 2 — TanStack Query for Server State (Priority: P1)

Users experience faster navigation and more responsive UI interactions because data is cached, refetched in the background, and mutations update the UI optimistically before the server confirms.

**Why this priority**: This is the single highest-impact change for user experience. Currently, every page remounts and refetches data on navigation. TanStack Query eliminates this entirely.

**Independent Test**: Navigate between Tasks and Calendar pages rapidly. Verify data loads once and subsequent visits use cached data. Complete a task and verify the UI updates immediately (optimistic), then reconciles with the server response.

**Acceptance Scenarios**:

1. **Given** a user views the Tasks page, **When** they navigate to Calendar and back, **Then** the Tasks page loads instantly from cache without showing a loading spinner
2. **Given** a user completes a task, **When** they click the complete button, **Then** the UI updates immediately (optimistic) and reconciles when the server response arrives
3. **Given** multiple components on a page need the same data, **When** they use the same query key, **Then** only one API request is made (request deduplication)
4. **Given** cached data exists, **When** the user returns to a page after 30 seconds, **Then** data is served from cache immediately while a background refetch updates it silently
5. **Given** a mutation fails (e.g. network error), **When** the server rejects the change, **Then** the optimistic update is rolled back and an error toast is displayed
6. **Given** a task is created on the Tasks page, **When** the user navigates to Calendar, **Then** the Calendar page shows the new task because related queries are invalidated

---

### User Story 3 — React Hook Form + Zod Validation (Priority: P2)

Developers can build type-safe forms with validation schemas shared between frontend and backend, eliminating manual `useState` chains and ensuring consistent validation rules.

**Why this priority**: Forms are a significant source of boilerplate and bugs. Shared Zod schemas prevent validation drift between frontend and API. Depends on Tailwind/shadcn being available for form components.

**Independent Test**: Submit the Create Task form with invalid data. Verify inline validation errors appear without a server roundtrip. Verify the same Zod schema is used by both the frontend form and the backend DTO.

**Acceptance Scenarios**:

1. **Given** a form uses React Hook Form with a Zod schema, **When** the user submits with invalid data, **Then** inline validation errors appear immediately without an API call
2. **Given** a Zod schema exists in `@life-manager/schema`, **When** the same schema is used by frontend validation and backend DTO parsing, **Then** validation rules are guaranteed consistent
3. **Given** a form field loses focus, **When** the field value is invalid, **Then** the error is shown immediately (blur validation mode)
4. **Given** a multi-step form (e.g. Create Event with recurrence), **When** the user moves between steps, **Then** partially entered data is preserved and validated per-step
5. **Given** a form is submitting, **When** the user clicks submit again, **Then** the button is disabled and the form prevents duplicate submission

---

### User Story 4 — Existing Page Migration (Priority: P2)

All existing pages are migrated from styled-components to Tailwind CSS + shadcn/ui, resulting in a single styling approach across the platform with no styled-components dependency.

**Why this priority**: Technical debt reduction. Once new features use Tailwind/shadcn, old pages should be migrated to eliminate the dual-styling overhead. Can be done incrementally per page.

**Independent Test**: Each migrated page passes its existing Jest/Playwright tests with no visual regression. The styled-components package is removed from `package.json` after the final page is migrated.

**Acceptance Scenarios**:

1. **Given** a page is migrated from styled-components to Tailwind, **When** compared to the original, **Then** the visual appearance is identical (verified by Playwright screenshot comparison)
2. **Given** all pages have been migrated, **When** styled-components is removed from dependencies, **Then** the build succeeds with no import errors
3. **Given** a migrated page, **When** toggling dark mode, **Then** all elements respect the theme via Tailwind `dark:` classes
4. **Given** the migration is in progress, **When** both old and new styling co-exist, **Then** the application remains fully functional with no style conflicts
5. **Given** an existing page has Jest tests, **When** the page is migrated to shadcn components, **Then** tests are updated to query the new component structure and still pass

---

### User Story 5 — TanStack Table for Data-Heavy Pages (Priority: P3)

Admin and data-heavy pages use TanStack Table for sorting, filtering, pagination, and column management, providing a consistent and performant data grid experience.

**Why this priority**: Only relevant for specific pages (User Management, future Finance transactions). Not blocking any other work. Pairs naturally with shadcn Table component.

**Independent Test**: Open User Management page. Verify sorting by any column, filtering by search term, and pagination controls all function correctly with TanStack Table powering the logic.

**Acceptance Scenarios**:

1. **Given** a data table with 100+ rows, **When** the user clicks a column header, **Then** the table sorts by that column (ascending, then descending on second click)
2. **Given** a search filter input, **When** the user types a search term, **Then** the table filters rows in real-time with debounced input
3. **Given** pagination is configured at 25 rows per page, **When** the user clicks "Next", **Then** the next page of results is displayed with correct page indicators
4. **Given** TanStack Table is used with shadcn Table component, **When** a new data table is needed, **Then** developers can reuse the same pattern with minimal boilerplate
5. **Given** an API returns paginated data, **When** server-side pagination is configured, **Then** TanStack Table sends correct `page` and `pageSize` parameters to the API

---

## Technical Architecture

### Tailwind Configuration Strategy

```
packages/
  ui/
    tailwind.preset.ts      ← Shared design tokens (replaces layout.ts, typography.ts)
    src/
      styles/
        index.ts            ← Re-exports design tokens for backward compatibility
      components/
        ui/                 ← shadcn components live here
          button.tsx
          card.tsx
          input.tsx
          ...
apps/
  web/
    tailwind.config.ts      ← Extends shared preset
    postcss.config.js       ← Tailwind + autoprefixer
    src/
      lib/
        utils.ts            ← cn() helper (clsx + tailwind-merge)
```

### TanStack Query Architecture

```
apps/web/src/
  providers/
    QueryProvider.tsx        ← QueryClientProvider wrapping App
  hooks/
    queries/
      useTasks.ts           ← useQuery + useMutation for tasks
      useEvents.ts          ← useQuery + useMutation for events
      useGroups.ts          ← useQuery + useMutation for task groups
      useStatistics.ts      ← useQuery for dashboard stats
      useUsers.ts           ← useQuery + useMutation for admin
    query-keys.ts           ← Centralised query key factory
```

### Form Architecture

```
packages/schema/src/
  task.ts                   ← Zod schemas: createTaskSchema, updateTaskSchema
  event.ts                  ← Zod schemas: createEventSchema, updateEventSchema
  auth.ts                   ← Zod schemas: loginSchema, registerSchema
  user.ts                   ← Zod schemas: createUserSchema, updateUserSchema

apps/web/src/
  hooks/
    forms/
      useTaskForm.ts        ← React Hook Form + Zod resolver
      useEventForm.ts
      useAuthForm.ts
```

### Theme Migration

| Current (styled-components) | Target (Tailwind) |
|---|---|
| `theme.colors.primary` | `bg-primary`, `text-primary` |
| `theme.colors.text` | `text-foreground` |
| `theme.colors.background` | `bg-background` |
| `spacing.lg` (16px) | `p-4` (16px) |
| `borderRadius.sm` (6px) | `rounded-md` (6px) |
| `shadows.elevated` | `shadow-lg` |
| `${({ theme }) => ...}` | CSS variables `hsl(var(--primary))` |

Dark mode switches from JavaScript `ThemeProvider` to CSS class strategy:

```html
<!-- Light mode -->
<html class="light">
<!-- Dark mode -->
<html class="dark">
```

CSS variables in `:root` and `.dark` selectors replace the JavaScript theme object.

---

## Dependencies & Compatibility

### Package Additions

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^3.4 | Utility-first CSS |
| `@tailwindcss/vite` | ^4.0 | Vite plugin (if using Tailwind v4) |
| `postcss` | ^8.4 | CSS processing |
| `autoprefixer` | ^10.4 | Browser prefixing |
| `tailwind-merge` | ^2.0 | Deduplicates Tailwind classes |
| `clsx` | ^2.0 | Conditional class joining |
| `class-variance-authority` | ^0.7 | Component variant API |
| `@radix-ui/react-*` | Latest | Accessible UI primitives (per shadcn component) |
| `@tanstack/react-query` | ^5.0 | Server state management |
| `@tanstack/react-query-devtools` | ^5.0 | Dev tools (dev only) |
| `@tanstack/react-table` | ^8.0 | Headless data tables |
| `react-hook-form` | ^7.0 | Form state management |
| `@hookform/resolvers` | ^3.0 | Zod resolver for RHF |

### Package Removals (after full migration)

| Package | Reason |
|---------|--------|
| `styled-components` | Replaced by Tailwind CSS |
| `@types/styled-components` | No longer needed |

---

## Success Criteria

1. All new features use Tailwind CSS + shadcn/ui exclusively
2. TanStack Query manages all server state — no `useState` + `useEffect` for data fetching
3. All forms use React Hook Form + Zod with schemas from `@life-manager/schema`
4. Zero `styled-components` imports remain after migration is complete
5. React Doctor health score ≥ 90
6. All existing tests pass after migration
7. Lighthouse performance score improves (no runtime CSS overhead)
8. Dark/light mode works via CSS class strategy

---

## Rejected Approaches

| Approach | Reason |
|----------|--------|
| **TanStack Router** | React Router v6 is sufficient. Migration cost not justified until multi-app shell requires complex cross-app routing. |
| **TanStack Form** | Less mature than React Hook Form. Smaller ecosystem, fewer resources, shadcn built for RHF. |
| **TanStack Virtual** | No current lists exceed hundreds of items. Defer until finance transaction lists are built. |
| **CSS Modules** | Already rejected (ADR-004). Tailwind is the modern replacement for styled-components, not CSS Modules. |
| **MUI / Ant Design** | Heavy runtime libraries. shadcn gives component ownership without dependency lock-in. |
| **Emotion** | Same runtime CSS-in-JS problems as styled-components. Moving away from the pattern entirely. |
| **Big-bang migration** | Risk of breaking everything at once. Phased migration with co-existence is safer. |

---

## Future Enhancements

- **TanStack Router**: Adopt when the application hub / multi-app shell is built (Phase 6+)
- **TanStack Virtual**: Adopt when finance transaction lists are built (Phase 41+)
- **TanStack Start**: Evaluate when SSR is needed for SEO or performance
- **Storybook**: Component documentation once shadcn components stabilise

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/)

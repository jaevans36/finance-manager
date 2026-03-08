# Tasks: Frontend Modernisation

**Input**: `specs/platform/frontend-modernisation.md`  
**Prerequisites**: None (can begin on current codebase)  
**Continues from**: T1256 (Finance Application tasks)

**Organisation**: Tasks grouped by phase for incremental adoption. Each phase is independently deployable. Styled-components and new tooling co-exist until Phase 53.

**Technology Stack**:
- **Frontend**: React 18, TypeScript 5, Vite 6
- **Additions**: Tailwind CSS 3.4+, shadcn/ui, TanStack Query v5, React Hook Form 7, Zod, TanStack Table v8
- **Removals**: styled-components 6 (after Phase 52)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 48: Tailwind CSS & shadcn/ui Foundation (Priority: P1)

**Purpose**: Install and configure Tailwind CSS and shadcn/ui alongside styled-components. Establish shared design tokens as CSS variables and a Tailwind preset. All new components can use Tailwind from this point forward.  
**Estimated Effort**: 1 week (19 tasks)  
**Dependencies**: None

### Infrastructure: Tailwind Installation & Configuration (Days 1-2)

- [ ] T1257 [P] [US1] Install Tailwind CSS, PostCSS, autoprefixer in `apps/web/` — `pnpm --filter @life-manager/web add -D tailwindcss postcss autoprefixer` - 1h
- [ ] T1258 [P] [US1] Install utility packages: `clsx`, `tailwind-merge`, `class-variance-authority` in `apps/web/` - 1h
- [ ] T1259 [US1] Create PostCSS config at `apps/web/postcss.config.js` with Tailwind and autoprefixer plugins - 1h
- [ ] T1260 [US1] Create shared Tailwind preset at `packages/ui/tailwind.preset.ts` mapping existing design tokens (spacing, colours, border-radius, typography, shadows) to Tailwind config - 4h
- [ ] T1261 [US1] Create Tailwind config at `apps/web/tailwind.config.ts` extending the shared preset, with content paths for `apps/web/src/**` and `packages/ui/src/**` - 2h
- [ ] T1262 [US1] Add Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) to `apps/web/src/styles/global.css` - 1h
- [ ] T1263 [US1] Create CSS variable theme at `apps/web/src/styles/theme.css` defining `:root` and `.dark` colour tokens in HSL format (matching existing theme.ts values) - 3h
- [ ] T1264 [US1] Create `cn()` utility at `apps/web/src/lib/utils.ts` combining `clsx` and `tailwind-merge` - 1h
- [ ] T1265 [US1] Update `apps/web/vite.config.ts` — remove `styled-components` from `ui-vendor` chunk, add `@radix-ui` chunking - 1h

### shadcn/ui Initialisation (Days 2-3)

- [ ] T1266 [US1] Initialise shadcn/ui — create `apps/web/components.json` with TypeScript, CSS variables, path aliases (`@/` → `src/`) - 1h
- [ ] T1267 [US1] Add path alias `@/` → `apps/web/src/` in `apps/web/tsconfig.json` and `apps/web/vite.config.ts` resolve.alias - 1h
- [ ] T1268 [US1] Add core shadcn components: Button, Card, Input, Label, Badge, Alert, Separator, Tabs — `npx shadcn@latest add button card input label badge alert separator tabs` into `apps/web/src/components/ui/` - 2h
- [ ] T1269 [US1] Add shadcn Dialog component (replaces custom Modal.tsx) — `npx shadcn@latest add dialog` - 1h
- [ ] T1270 [US1] Add shadcn Select, Textarea, Checkbox, Switch, DropdownMenu components - 1h
- [ ] T1271 [US1] Add shadcn Toast/Sonner component (replaces custom ToastContext) — `npx shadcn@latest add sonner` - 1h

### Theme & Dark Mode (Day 4)

- [ ] T1272 [US1] Implement dark mode class strategy — update `apps/web/src/App.tsx` to apply `dark` class to `<html>` based on user preference, replacing styled-components ThemeProvider for new components - 3h
- [ ] T1273 [US1] Verify co-existence: create test page with mixed styled-components and Tailwind components, confirm no style conflicts - 2h

### Showcase & Testing (Day 5)

- [ ] T1274 [US1] Update `apps/web/src/pages/design-system/DesignSystemPage.tsx` to include a shadcn/Tailwind components section alongside existing styled-components showcase - 3h
- [ ] T1275 [US1] Write Jest tests verifying shadcn Button, Card, Input, Dialog render correctly in both light and dark modes (`apps/web/tests/components/ui/shadcn.test.tsx`) - 3h

**Checkpoint**: Tailwind CSS and shadcn/ui are installed and configured. New components can be built with Tailwind. Existing styled-components pages continue to work. DesignSystemPage shows both systems.

---

## Phase 49: TanStack Query for Server State (Priority: P1)

**Purpose**: Replace all manual `useState`/`useEffect` data fetching with TanStack Query, providing caching, background refetching, optimistic updates, and request deduplication across all pages.  
**Estimated Effort**: 1.5 weeks (24 tasks)  
**Dependencies**: None (independent of Phase 48, can run in parallel)

### Infrastructure: Query Client Setup (Day 1)

- [ ] T1276 [P] [US2] Install `@tanstack/react-query` and `@tanstack/react-query-devtools` in `apps/web/` - 1h
- [ ] T1277 [US2] Create `QueryProvider` wrapper at `apps/web/src/providers/QueryProvider.tsx` with sensible defaults (staleTime: 30s, gcTime: 5m, refetchOnWindowFocus: true) - 2h
- [ ] T1278 [US2] Wrap app with `QueryProvider` in `apps/web/src/App.tsx` — add `QueryClientProvider` and `ReactQueryDevtools` (dev only) - 1h
- [ ] T1279 [US2] Create centralised query key factory at `apps/web/src/hooks/query-keys.ts` with structured keys for tasks, events, groups, statistics, users, system-config - 2h

### Query Hooks: Task Domain (Days 2-3)

- [ ] T1280 [US2] Create `useTasks` hook at `apps/web/src/hooks/queries/useTasks.ts` — `useQuery` wrapping `taskService.getTasks()` with query key `['tasks', filters]` - 2h
- [ ] T1281 [US2] Create `useTask` hook for single task detail — `useQuery` wrapping `taskService.getTask(id)` with query key `['tasks', id]` - 1h
- [ ] T1282 [US2] Create task mutation hooks: `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useToggleTask` with optimistic updates and query invalidation - 4h
- [ ] T1283 [US2] Create `useSubtasks` hook at `apps/web/src/hooks/queries/useSubtasks.ts` — queries and mutations for subtask CRUD with parent task cache invalidation - 3h
- [ ] T1284 [US2] Create `useTaskGroups` hook at `apps/web/src/hooks/queries/useTaskGroups.ts` — CRUD queries and mutations for task groups - 2h

### Query Hooks: Other Domains (Days 3-4)

- [ ] T1285 [P] [US2] Create `useEvents` hook at `apps/web/src/hooks/queries/useEvents.ts` — CRUD queries and mutations for events - 2h
- [ ] T1286 [P] [US2] Create `useStatistics` hook at `apps/web/src/hooks/queries/useStatistics.ts` — wrapping `statisticsService` methods with appropriate staleTime - 2h
- [ ] T1287 [P] [US2] Create `useWeeklyProgress` hook at `apps/web/src/hooks/queries/useWeeklyProgress.ts` — wrapping weekly statistics API calls - 2h
- [ ] T1288 [P] [US2] Create `useUsers` hook at `apps/web/src/hooks/queries/useUsers.ts` (admin) — wrapping `userManagementService` with search/pagination - 2h
- [ ] T1289 [P] [US2] Create `useSystemConfig` hook at `apps/web/src/hooks/queries/useSystemConfig.ts` — wrapping `systemConfigurationService` - 1h
- [ ] T1290 [P] [US2] Create `useProfile` hook at `apps/web/src/hooks/queries/useProfile.ts` — wrapping auth profile endpoints - 1h

### Page Migration to Query Hooks (Days 5-8)

- [ ] T1291 [US2] Migrate `apps/web/src/pages/tasks/TasksPage.tsx` — replace `useState`/`useEffect` data fetching with `useTasks`, `useTaskGroups`, task mutations - 3h
- [ ] T1292 [US2] Migrate `apps/web/src/pages/calendar/CalendarPage.tsx` — replace data fetching with `useTasks`, `useEvents` queries - 2h
- [ ] T1293 [US2] Migrate `apps/web/src/pages/dashboard/DashboardPage.tsx` — replace data fetching with `useStatistics`, `useTasks` queries - 2h
- [ ] T1294 [US2] Migrate `apps/web/src/pages/events/EventsPage.tsx` — replace data fetching with `useEvents` queries and mutations - 2h
- [ ] T1295 [US2] Migrate `apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx` — replace data fetching with `useWeeklyProgress` query - 2h
- [ ] T1296 [US2] Migrate `apps/web/src/pages/admin/AdminDashboard.tsx` and `UserManagement.tsx` — replace with `useUsers`, `useSystemConfig` queries - 3h
- [ ] T1297 [US2] Migrate `apps/web/src/pages/profile/ProfilePage.tsx` — replace with `useProfile` query and mutations - 2h

### Cleanup & Testing (Days 8-10)

- [ ] T1298 [US2] Delete `apps/web/src/utils/queryCache.ts` (hand-rolled cache replaced by TanStack Query) - 1h
- [ ] T1299 [US2] Write Jest tests for all query hooks — mock `apiClient`, verify query keys, test optimistic updates and rollbacks (`apps/web/tests/hooks/queries/`) - 6h

**Checkpoint**: All pages use TanStack Query for data fetching. No `useState`/`useEffect` patterns for API calls remain. Background refetching, caching, and optimistic updates are working. React Query DevTools available in development.

---

## Phase 50: React Hook Form & Zod Validation (Priority: P2)

**Purpose**: Replace manual form state management with React Hook Form and Zod schemas. Shared schemas live in `@life-manager/schema` for frontend-backend consistency.  
**Estimated Effort**: 1.5 weeks (22 tasks)  
**Dependencies**: Phase 49 (mutations from TanStack Query used in form submissions)

### Infrastructure: Packages & Schemas (Days 1-2)

- [ ] T1300 [P] [US3] Install `react-hook-form` and `@hookform/resolvers` in `apps/web/` - 1h
- [ ] T1301 [P] [US3] Install `zod` in `packages/schema/` (if not already present) - 1h
- [ ] T1302 [US3] Create Zod schemas for authentication in `packages/schema/src/auth.ts` — `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema` - 3h
- [ ] T1303 [US3] Create Zod schemas for tasks in `packages/schema/src/task.ts` — `createTaskSchema`, `updateTaskSchema`, `taskFiltersSchema` - 3h
- [ ] T1304 [US3] Create Zod schemas for events in `packages/schema/src/event.ts` — `createEventSchema`, `updateEventSchema` - 2h
- [ ] T1305 [US3] Create Zod schemas for user/profile in `packages/schema/src/user.ts` — `updateProfileSchema`, `changePasswordSchema`, `createUserSchema` (admin) - 2h
- [ ] T1306 [US3] Create Zod schemas for task groups in `packages/schema/src/taskGroup.ts` — `createTaskGroupSchema`, `updateTaskGroupSchema` - 1h
- [ ] T1307 [US3] Create Zod schemas for system config in `packages/schema/src/systemConfig.ts` — `updateSystemConfigSchema` - 1h
- [ ] T1308 [US3] Export all schemas from `packages/schema/src/index.ts` with TypeScript inferred types (`z.infer<typeof schema>`) - 1h

### Form Hooks (Days 3-4)

- [ ] T1309 [US3] Create `useTaskForm` hook at `apps/web/src/hooks/forms/useTaskForm.ts` — React Hook Form with Zod resolver, integrates with `useCreateTask`/`useUpdateTask` mutations - 3h
- [ ] T1310 [US3] Create `useEventForm` hook at `apps/web/src/hooks/forms/useEventForm.ts` — RHF with Zod resolver, integrates with event mutations - 2h
- [ ] T1311 [US3] Create `useLoginForm` and `useRegisterForm` hooks at `apps/web/src/hooks/forms/useAuthForms.ts` — RHF with Zod resolver - 2h
- [ ] T1312 [US3] Create `useProfileForm` hook at `apps/web/src/hooks/forms/useProfileForm.ts` — RHF with Zod resolver - 2h
- [ ] T1313 [US3] Create `useTaskGroupForm` hook at `apps/web/src/hooks/forms/useTaskGroupForm.ts` — RHF with Zod resolver - 1h

### Form Migration (Days 5-8)

- [ ] T1314 [US3] Migrate `apps/web/src/components/tasks/CreateTaskForm.tsx` to use `useTaskForm` hook — replace `useState` chains with `register()` and `handleSubmit()` - 3h
- [ ] T1315 [US3] Migrate task edit mode in `apps/web/src/components/tasks/TaskDetailModal.tsx` to use `useTaskForm` hook - 3h
- [ ] T1316 [US3] Migrate `apps/web/src/components/events/EventForm.tsx` to use `useEventForm` hook - 3h
- [ ] T1317 [US3] Migrate `apps/web/src/components/auth/LoginForm.tsx` and `RegisterForm.tsx` to use `useLoginForm`/`useRegisterForm` hooks - 3h
- [ ] T1318 [US3] Migrate `apps/web/src/pages/auth/ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx` to use RHF + Zod - 2h
- [ ] T1319 [US3] Migrate `apps/web/src/pages/profile/ProfilePage.tsx` form sections to use `useProfileForm` hook - 2h
- [ ] T1320 [US3] Migrate `apps/web/src/components/task-groups/CreateTaskGroupModal.tsx` to use `useTaskGroupForm` hook - 1h

### Testing (Day 9-10)

- [ ] T1321 [US3] Write Jest tests for Zod schemas — validate correct/invalid inputs for all schemas in `packages/schema/` (`packages/schema/tests/`) - 3h

**Checkpoint**: All forms use React Hook Form with Zod validation. Shared schemas in `@life-manager/schema` can be used by both frontend and backend. No manual `useState` form state management remains.

---

## Phase 51: Page Migration Batch 1 — Core Pages (Priority: P2)

**Purpose**: Migrate the most-used pages and shared components from styled-components to Tailwind CSS + shadcn/ui. These are the high-traffic pages that benefit most from the new styling approach.  
**Estimated Effort**: 2 weeks (25 tasks)  
**Dependencies**: Phase 48 (Tailwind + shadcn setup)

### Shared Components (Days 1-3)

- [ ] T1322 [P] [US4] Migrate `apps/web/src/components/layout/PageLayout.tsx` from styled-components to Tailwind — replace all `styled.*` with `className` utilities - 3h
- [ ] T1323 [P] [US4] Migrate `apps/web/src/components/AppHeader.tsx` from styled-components to Tailwind + shadcn DropdownMenu - 4h
- [ ] T1324 [US4] Replace `apps/web/src/components/ui/Modal.tsx` with shadcn Dialog wrapper — update all Modal consumers to use new Dialog API - 4h
- [ ] T1325 [US4] Replace `apps/web/src/contexts/ToastContext.tsx` with shadcn Sonner toast — update all `useToast()` call sites - 3h
- [ ] T1326 [US4] Migrate `apps/web/src/components/ui/Skeleton.tsx` to Tailwind (or replace with shadcn Skeleton) - 1h

### Tasks Page & Components (Days 4-6)

- [ ] T1327 [US4] Migrate `apps/web/src/pages/tasks/TasksPage.tsx` from styled-components to Tailwind - 4h
- [ ] T1328 [US4] Migrate `apps/web/src/components/tasks/TaskList.tsx` to Tailwind - 2h
- [ ] T1329 [US4] Migrate `apps/web/src/components/tasks/TaskItem.tsx` to Tailwind (includes drag-and-drop styles) - 3h
- [ ] T1330 [US4] Migrate `apps/web/src/components/tasks/TaskDetailModal.tsx` to Tailwind + shadcn Dialog - 4h
- [ ] T1331 [US4] Migrate `apps/web/src/components/tasks/CreateTaskForm.tsx` to Tailwind + shadcn form components - 3h
- [ ] T1332 [US4] Migrate subtask components: `SubtaskList.tsx`, `SubtaskItem.tsx`, `SubtaskProgress.tsx`, `SubtaskBulkActions.tsx` to Tailwind - 4h

### Dashboard Page & Components (Days 6-7)

- [ ] T1333 [US4] Migrate `apps/web/src/pages/dashboard/DashboardPage.tsx` and `DashboardLayout.tsx` to Tailwind - 3h
- [ ] T1334 [US4] Migrate `apps/web/src/components/dashboard/TaskStatistics.tsx` to Tailwind + shadcn Card - 3h
- [ ] T1335 [US4] Migrate `apps/web/src/components/dashboard/TaskSearch.tsx` and `TaskSkeleton.tsx` to Tailwind - 2h

### Calendar Page & Components (Days 8-9)

- [ ] T1336 [US4] Migrate `apps/web/src/pages/calendar/CalendarPage.tsx` to Tailwind - 3h
- [ ] T1337 [US4] Migrate `apps/web/src/components/calendar/StyledCalendar.tsx` — replace styled-components overrides for `react-calendar` with Tailwind/CSS classes - 4h
- [ ] T1338 [US4] Migrate `apps/web/src/components/calendar/CalendarFilters.tsx`, `QuickAddTaskModal.tsx`, `DayTaskListModal.tsx` to Tailwind + shadcn - 4h

### Events Page & Components (Days 9-10)

- [ ] T1339 [US4] Migrate `apps/web/src/pages/events/EventsPage.tsx` to Tailwind - 3h
- [ ] T1340 [US4] Migrate `apps/web/src/components/events/EventItem.tsx`, `EventList.tsx`, `EventForm.tsx`, `EditEventModal.tsx` to Tailwind + shadcn - 5h

### Chart Components (Day 10)

- [ ] T1341 [US4] Migrate `apps/web/src/components/charts/BarChartWrapper.tsx`, `LineChartWrapper.tsx`, `PieChartWrapper.tsx` to Tailwind (replace styled wrappers, keep Recharts) - 3h
- [ ] T1342 [US4] Update `apps/web/src/components/charts/chartTheme.ts` — convert `chartColors` to use CSS variables from Tailwind theme - 1h

### Task Groups (Day 10)

- [ ] T1343 [US4] Migrate `apps/web/src/components/task-groups/TaskGroupList.tsx`, `TaskGroupItem.tsx`, `CreateTaskGroupModal.tsx`, `GroupSkeleton.tsx` to Tailwind + shadcn - 4h

### Testing (Days 10-14)

- [ ] T1344 [US4] Update Jest tests for all migrated components — replace styled-components test queries with new component structure (`apps/web/tests/`) - 6h
- [ ] T1345 [US4] Run Playwright E2E tests and fix any visual regressions from migration - 4h
- [ ] T1346 [US4] Verify dark mode works on all migrated pages via Tailwind `dark:` classes - 2h

**Checkpoint**: All core pages (Tasks, Dashboard, Calendar, Events) and shared components (PageLayout, AppHeader, Modal, Toast) use Tailwind + shadcn. No styled-components imports in migrated files.

---

## Phase 52: Page Migration Batch 2 — Auth, Admin & Secondary Pages (Priority: P2)

**Purpose**: Migrate remaining pages from styled-components to Tailwind CSS + shadcn/ui, completing coverage of the entire application.  
**Estimated Effort**: 1.5 weeks (18 tasks)  
**Dependencies**: Phase 51 (shared components like PageLayout, AppHeader, Dialog already migrated)

### Auth Pages (Days 1-3)

- [ ] T1347 [P] [US4] Migrate `apps/web/src/components/auth/LoginForm.tsx` to Tailwind + shadcn Input, Button, Label - 3h
- [ ] T1348 [P] [US4] Migrate `apps/web/src/components/auth/RegisterForm.tsx` to Tailwind + shadcn form components - 3h
- [ ] T1349 [US4] Migrate `apps/web/src/pages/auth/ForgotPasswordPage.tsx` to Tailwind + shadcn - 2h
- [ ] T1350 [US4] Migrate `apps/web/src/pages/auth/ResetPasswordPage.tsx` to Tailwind + shadcn - 2h
- [ ] T1351 [US4] Migrate `apps/web/src/pages/auth/VerifyEmailPage.tsx` to Tailwind + shadcn - 2h
- [ ] T1352 [US4] Migrate `apps/web/src/pages/auth/ResendVerificationPage.tsx` to Tailwind + shadcn - 2h

### Admin Pages (Days 3-4)

- [ ] T1353 [US4] Migrate `apps/web/src/pages/admin/AdminDashboard.tsx` to Tailwind + shadcn Card, Badge - 4h
- [ ] T1354 [US4] Migrate `apps/web/src/pages/admin/UserManagement.tsx` to Tailwind + shadcn Table (basic, pre-TanStack Table) - 4h
- [ ] T1355 [US4] Migrate `apps/web/src/pages/admin/SystemSettings.tsx` to Tailwind + shadcn form components - 3h

### Secondary Pages (Days 4-5)

- [ ] T1356 [US4] Migrate `apps/web/src/pages/profile/ProfilePage.tsx` to Tailwind + shadcn form components - 3h
- [ ] T1357 [US4] Migrate `apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx` to Tailwind - 3h
- [ ] T1358 [US4] Migrate all weekly-progress sub-components: `ChartCard.tsx`, `DailyTaskCard.tsx`, `DateNavigation.tsx`, `ErrorDisplay.tsx`, `GroupFilter.tsx`, `HistoricalCompletionChart.tsx`, `StatisticCard.tsx`, `ViewModeSelector.tsx`, `WeeklyGoalCard.tsx` to Tailwind - 6h
- [ ] T1359 [US4] Migrate `apps/web/src/pages/version/VersionHistoryPage.tsx` to Tailwind + shadcn Badge, Card - 2h

### Remaining Components (Day 5-6)

- [ ] T1360 [US4] Migrate `apps/web/src/components/CalculatorModal.tsx` to Tailwind + shadcn Dialog - 2h
- [ ] T1361 [US4] Migrate `apps/web/src/components/WhatsNewModal.tsx` to Tailwind + shadcn Dialog - 2h

### Testing (Days 6-8)

- [ ] T1362 [US4] Update Jest tests for all Batch 2 migrated components - 4h
- [ ] T1363 [US4] Run full E2E test suite, fix regressions. Verify dark mode on all pages - 4h
- [ ] T1364 [US4] Rewrite `apps/web/src/pages/design-system/DesignSystemPage.tsx` to showcase only Tailwind + shadcn components (remove styled-components examples) - 3h

**Checkpoint**: Every page and component in the application uses Tailwind + shadcn exclusively. No styled-components code remains in `apps/web/src/`.

---

## Phase 53: Cleanup & styled-components Removal (Priority: P2)

**Purpose**: Remove styled-components from all packages, delete obsolete style files, rewrite the shared UI package to export Tailwind-based components, and verify the full application works without styled-components.  
**Estimated Effort**: 1 week (16 tasks)  
**Dependencies**: Phase 52 (all pages migrated)

### Shared Package Rewrite (Days 1-3)

- [ ] T1365 [US4] Rewrite `packages/ui/src/components/index.ts` — replace styled-components with Tailwind + shadcn-based exports (Button, Card, Input, Badge, Alert, Heading1-3, etc.) - 6h
- [ ] T1366 [US4] Rewrite `packages/ui/src/components/Skeleton.tsx` using Tailwind classes - 1h
- [ ] T1367 [US4] Delete `packages/ui/src/styles/GlobalStyles.ts` (replaced by `apps/web/src/styles/global.css` with Tailwind directives) - 1h
- [ ] T1368 [US4] Delete `packages/ui/src/styles/typography.ts` (replaced by Tailwind typography classes in preset) - 1h
- [ ] T1369 [US4] Refactor `packages/ui/src/styles/layout.ts` — migrate remaining exports (`borderRadius`, `shadows`, `focusRing`, `mediaQueries`) to Tailwind preset values, or delete if all consumers migrated - 2h
- [ ] T1370 [US4] Delete `packages/ui/src/contexts/ThemeContext.tsx` and `packages/ui/src/contexts/index.ts` (replaced by CSS class dark mode) - 1h
- [ ] T1371 [US4] Update `packages/ui/src/index.ts` — remove `DefaultTheme` re-export, export new Tailwind-based components and preset - 1h
- [ ] T1372 [US4] Update `packages/ui/package.json` — remove `styled-components` from dependencies, add Tailwind dependencies - 1h

### App Cleanup (Days 3-4)

- [ ] T1373 [US4] Delete `apps/web/src/styles/layout.ts` (migrated to Tailwind config) - 1h
- [ ] T1374 [US4] Delete `apps/web/src/styles/theme.ts` (replaced by CSS variables in `theme.css`) - 1h
- [ ] T1375 [US4] Delete `apps/web/src/styled.d.ts` (styled-components type augmentation no longer needed) - 1h
- [ ] T1376 [US4] Remove `styled-components` and `@types/styled-components` from `apps/web/package.json` - 1h
- [ ] T1377 [US4] Remove any remaining styled-components ThemeProvider wrapping from `apps/web/src/App.tsx` - 1h
- [ ] T1378 [US4] Update `apps/web/vite.config.ts` — remove all styled-components references from build config - 1h

### Verification (Day 5)

- [ ] T1379 [US4] Run full build (`pnpm build`) — verify zero errors, no styled-components imports remain - 2h
- [ ] T1380 [US4] Run full test suite (Jest + Playwright) — verify all tests pass, react-doctor score ≥ 90 - 3h

**Checkpoint**: styled-components is completely removed from the project. All styling uses Tailwind CSS + shadcn/ui. The shared UI package exports Tailwind-based components. React Doctor score is ≥ 90.

---

## Phase 54: TanStack Table for Data-Heavy Pages (Priority: P3)

**Purpose**: Add TanStack Table to data-heavy pages for sorting, filtering, pagination, and column management. Uses shadcn Table component for rendering.  
**Estimated Effort**: 0.5 weeks (8 tasks)  
**Dependencies**: Phase 52 (pages migrated to Tailwind + shadcn)

### Infrastructure (Day 1)

- [ ] T1381 [P] [US5] Install `@tanstack/react-table` in `apps/web/` - 1h
- [ ] T1382 [US5] Add shadcn Table component — `npx shadcn@latest add table` - 1h
- [ ] T1383 [US5] Create reusable `DataTable` component at `apps/web/src/components/ui/DataTable.tsx` — wrapping TanStack Table with shadcn Table, supporting sorting, filtering, and pagination props - 4h

### Page Integration (Days 2-3)

- [ ] T1384 [US5] Refactor `apps/web/src/pages/admin/UserManagement.tsx` to use `DataTable` with TanStack Table — add column sorting, search filtering, server-side pagination - 4h
- [ ] T1385 [US5] Create column definitions at `apps/web/src/pages/admin/columns/userColumns.tsx` — typed column helpers with sorting, formatting, and action cells - 2h

### Testing (Day 3)

- [ ] T1386 [US5] Write Jest tests for `DataTable` component — test sorting, filtering, pagination, empty states (`apps/web/tests/components/ui/DataTable.test.tsx`) - 3h
- [ ] T1387 [US5] Write Jest tests for UserManagement with TanStack Table integration - 2h
- [ ] T1388 [US5] Write E2E test for User Management table operations (sort, filter, paginate) - 3h

**Checkpoint**: UserManagement page uses TanStack Table with full sorting, filtering, and pagination. Reusable `DataTable` component is available for future data-heavy pages (e.g. finance transactions).

---

## Summary

| Phase | Name | Tasks | Effort | Priority |
|-------|------|-------|--------|----------|
| 48 | Tailwind CSS & shadcn/ui Foundation | 19 tasks (T1257-T1275) | 1 week | P1 |
| 49 | TanStack Query for Server State | 24 tasks (T1276-T1299) | 1.5 weeks | P1 |
| 50 | React Hook Form & Zod Validation | 22 tasks (T1300-T1321) | 1.5 weeks | P2 |
| 51 | Page Migration Batch 1 — Core | 25 tasks (T1322-T1346) | 2 weeks | P2 |
| 52 | Page Migration Batch 2 — Auth, Admin & Secondary | 18 tasks (T1347-T1364) | 1.5 weeks | P2 |
| 53 | Cleanup & styled-components Removal | 16 tasks (T1365-T1380) | 1 week | P2 |
| 54 | TanStack Table for Data-Heavy Pages | 8 tasks (T1381-T1388) | 0.5 weeks | P3 |

**Total**: 132 tasks (T1257-T1388), ~9 weeks estimated effort

### Phase Dependencies

```
Phase 48 ──────────────────┐
  (Tailwind + shadcn)      ├──→ Phase 51 ──→ Phase 52 ──→ Phase 53
                           │    (Core       (Auth/Admin   (Cleanup)
Phase 49 ──┐               │     Pages)      Pages)
  (Query)  ├──→ Phase 50   │
           │    (RHF+Zod)  │
           │               │
           └───────────────┘
                           
Phase 54 depends on Phase 52
  (TanStack Table)
```

**Critical Path**: Phase 48 → Phase 51 → Phase 52 → Phase 53  
**Parallel Track**: Phase 49 can start alongside Phase 48

### Files Affected Summary

| Category | Count | Notes |
|----------|-------|-------|
| Files to migrate (styled → Tailwind) | 62 | All files currently importing styled-components |
| Files to create | ~35 | Query hooks, form hooks, Zod schemas, shadcn components, Tailwind config |
| Files to delete | ~8 | Old style files, type augmentations, hand-rolled cache |
| Packages to add | 12 | tailwindcss, shadcn deps, tanstack, rhf, zod |
| Packages to remove | 2 | styled-components, @types/styled-components |

### Migration Strategy: Co-existence

During Phases 48-52, styled-components and Tailwind CSS co-exist:

1. **Phase 48**: Both systems installed, new components use Tailwind
2. **Phases 49-50**: Data/form layer modernised (orthogonal to styling)
3. **Phases 51-52**: Pages migrated file-by-file from styled → Tailwind
4. **Phase 53**: styled-components removed entirely

This ensures the application is deployable at every phase boundary.

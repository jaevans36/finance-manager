# Changelog

All notable changes to Life Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Format: `major.minor.patch`

- **Major (X.0.0)**: Breaking changes, major architecture changes, significant feature additions
- **Minor (0.X.0)**: New features, enhancements, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements, documentation updates

---

## [0.16.0](https://github.com/jaevans36/finance-manager/compare/v0.15.0...v0.16.0) (2026-03-22)


### ⚠ BREAKING CHANGES

* **calendar:** None Files changed: 7 files
* **statistics:** StatisticsController route changed from /api/statistics to /api/v1/statistics
* **phase1:** Existing users will have email_verified=false by default Related to: User Story 1.1 (Password Reset), User Story 1.2 (Email Verification)

### Features

* **a11y:** add comprehensive accessibility improvements ([98dde51](https://github.com/jaevans36/finance-manager/commit/98dde518220e3e26e93a453b61feb74d222cccca))
* add /notifications route to App.tsx (T-P58) ([dac8db4](https://github.com/jaevans36/finance-manager/commit/dac8db4ef3dd8b88246bddeeef4ca0791bbd4377))
* add admin system for design system access ([66cfc26](https://github.com/jaevans36/finance-manager/commit/66cfc26b691f8d20d3e7f4a2cfdf2b8e2e5c2853))
* add API response caching infrastructure (T157) ([28dbbd1](https://github.com/jaevans36/finance-manager/commit/28dbbd1e1976d1b827b6cdc4d5a704764c32251f))
* add assign/unassign endpoints and permission-aware task write access (T1514) ([3f10687](https://github.com/jaevans36/finance-manager/commit/3f10687aa3e734d75ae0af9dd905875bfae24a21))
* add AssignedToUserId field to Task entity (T1505) ([b84c352](https://github.com/jaevans36/finance-manager/commit/b84c3526b89c92551dfc265b2a809a25018386db))
* add assignment badge and assign button to TaskItem (T-P58) ([cbbbd94](https://github.com/jaevans36/finance-manager/commit/cbbbd9497a876a85b3c5cae8f2c35ecd41df69a7))
* add AssignTaskAsync and UnassignTaskAsync with notification dispatch (T1512) ([140369c](https://github.com/jaevans36/finance-manager/commit/140369c44f3c8aa69fb5dac80a2401de3ce34eb2))
* add AssignTaskModal component (T-P58) ([bf78c63](https://github.com/jaevans36/finance-manager/commit/bf78c639505deff7ee4d9c529471b06946dac5e7))
* add brand logo mark and favicon (T1421-T1428) ([3c72b72](https://github.com/jaevans36/finance-manager/commit/3c72b72ff7f3a08e9ae9f1a0f0aa25be8b208bd2))
* add C# .NET Finance API with microservices architecture ([ab0d719](https://github.com/jaevans36/finance-manager/commit/ab0d7197e82e4499dd9a4751e5f9340f875fdcbe))
* add calculator widget modal ([0ebf00c](https://github.com/jaevans36/finance-manager/commit/0ebf00cea6ccf883b7bddcf0c5140af89b9d5e44))
* add comprehensive test management strategy and E2E weekly progress test ([00a9824](https://github.com/jaevans36/finance-manager/commit/00a98240690edcdfd7168b8633c9ade52659d007))
* add comprehensive testing infrastructure with 47 passing tests ([3296a87](https://github.com/jaevans36/finance-manager/commit/3296a87fd6e7770ebac534c6f101b7315d5f273d))
* add delegated and assigned-to-me fields to weekly statistics response (T1516) ([0c20194](https://github.com/jaevans36/finance-manager/commit/0c20194eb29cc8e31fb126ba27e69782d8192d5b))
* add Delegated tasks and Assigned to me stat cards to WeeklyProgressPage (T-P58) ([9a37a07](https://github.com/jaevans36/finance-manager/commit/9a37a0751237a5a2c8d89307326b0adfc84f123a))
* add delegated/assignedToMe fields to WeeklyStatistics type (T-P58) ([42619a0](https://github.com/jaevans36/finance-manager/commit/42619a070cd38f3bb70b45053d88516123f4a538))
* add dev tools and improve auto-refresh ([6666d8b](https://github.com/jaevans36/finance-manager/commit/6666d8b3ae866c15331d40a08648aa926377ccff))
* add EF Core migration for task assignment and notifications (T1508) ([a039f8f](https://github.com/jaevans36/finance-manager/commit/a039f8f189173c273385d34f9857e21146a9f70c))
* add Eisenhower Matrix classification and view (Phase 56)\n\nBackend:\n- Add UrgencyLevel and ImportanceLevel enums to Task entity\n- Add classify, bulk-classify, matrix, suggest-classification endpoints\n- Add ClassificationSuggestionService with auto-suggest from priority+due date\n- Add EF migration for urgency/importance columns + composite index\n\nFrontend:\n- Add QuadrantBadge, ClassificationPicker, AutoSuggestionChip components\n- Add EisenhowerMatrixPage with 2x2 grid, unclassified section, auto-classify\n- Integrate classification in TaskItem, TaskDetailModal, TasksPage\n- Add /matrix route and Matrix navigation item\n\n300/300 tests pass, 0 build errors ([8247b13](https://github.com/jaevans36/finance-manager/commit/8247b1364be8421b58431425ddc6b9bce1601056))
* add energy tagging and smart suggestions (Phase 57) ([4201538](https://github.com/jaevans36/finance-manager/commit/4201538965fdd72078a20cd834695b18a1ce4966))
* add Ethereal test email for development ([fe7efde](https://github.com/jaevans36/finance-manager/commit/fe7efde891ab4ea16ca40caecbea87f297400cb0))
* add Event DTOs, validators, and service (Phase 13.2-13.3) ([e5b553e](https://github.com/jaevans36/finance-manager/commit/e5b553edbb02523517c714b385d6922d34fb8c4b))
* add Event entity and database table (Phase 13.1) ([14ceae6](https://github.com/jaevans36/finance-manager/commit/14ceae6622af59f804dabdcba18f42cc1e990ced))
* add Event React components (Phase 13.8) ([7fd1e6e](https://github.com/jaevans36/finance-manager/commit/7fd1e6ed6059e14a5433f9abfbd802faed181ed3))
* add Events API controller (Phase 13.4) ([a017a0c](https://github.com/jaevans36/finance-manager/commit/a017a0cd730f2e7144fc48bca06364772e6cd004))
* add EventShare entity, DbContext registration, and AddEventShareTable migration (Phase58C) ([a9f6a7c](https://github.com/jaevans36/finance-manager/commit/a9f6a7c198e2010304f139b1afd22f41fa3099d4))
* add EventShareBadge component (T-P58) ([d68daf2](https://github.com/jaevans36/finance-manager/commit/d68daf20dc4ffdc836ea4fb75c65776d24446777))
* add EventShareDtos, UserSummaryDto and fix duplicate taskDtos (T-P58) ([41b5a4e](https://github.com/jaevans36/finance-manager/commit/41b5a4ee75a97f5aa5561c7946c1aece8f81a56c))
* add frontend Event types and service (Phase 13.5-13.6) ([e96ed94](https://github.com/jaevans36/finance-manager/commit/e96ed94861e4e165c208b4a70e6e25ada289e65b))
* add full Docker production stack ([72194a3](https://github.com/jaevans36/finance-manager/commit/72194a3a1db06968105ea5db566d216285cc1f5c))
* add group-level sharing with View/Edit permissions (Phase C) ([1a1a415](https://github.com/jaevans36/finance-manager/commit/1a1a415a0549b7d65eccbe197bd5915c958eee32))
* add HTTPS support and admin log viewer (Phase A & B) ([6556c66](https://github.com/jaevans36/finance-manager/commit/6556c66bc3cf510c913f1f203ea719fed69992c1))
* add in-app user guide at /help (Phase D) ([1e38833](https://github.com/jaevans36/finance-manager/commit/1e38833f52dcfd1f63439db9a8b9fbedd438361d))
* add InvitationCard component (T-P58) ([c16f260](https://github.com/jaevans36/finance-manager/commit/c16f260d55231ee4d7d8e56190ea8272a039d28c))
* add Manage to SharePermission and add ShareStatus enum (T1504) ([632a078](https://github.com/jaevans36/finance-manager/commit/632a0788f3414bde724e826753d1f69231c62d30))
* add Notification entity with NotificationType and NotificationEntityType enums (T1506) ([57b2e3c](https://github.com/jaevans36/finance-manager/commit/57b2e3c348ae02f11cfc36efa34d3037e8986697))
* add NotificationBell component (T-P58) ([a31428a](https://github.com/jaevans36/finance-manager/commit/a31428a83926771b4f6447d830a53b9b343d46d9))
* add NotificationBell to AppHeader (T-P58) ([8e878ce](https://github.com/jaevans36/finance-manager/commit/8e878ce994b2fd533d46cb73e7f542060902d758))
* add NotificationDropdown component (T-P58) ([537c02f](https://github.com/jaevans36/finance-manager/commit/537c02f871b74deca3f304fb07219f87b450a2df))
* add notifications and eventShares query keys (T-P58) ([6a69f57](https://github.com/jaevans36/finance-manager/commit/6a69f57e852b5f6a055841451afb1898034bdc49))
* add NotificationsController with GET, unread-count, and mark-read endpoints (T1515) ([bc9e0c2](https://github.com/jaevans36/finance-manager/commit/bc9e0c2143cfc4e441e80f77ec109347f4e3d1ed))
* add notificationService for notification API calls (T-P58) ([57f4913](https://github.com/jaevans36/finance-manager/commit/57f4913286f735c5cee64cf3c35ed9ace054f0bf))
* add NotificationService with create, query, mark-read (T1510) ([a2f0fc6](https://github.com/jaevans36/finance-manager/commit/a2f0fc6a0a2b98d6a3b1e58c50719cdbe4c063a4))
* add NotificationsPage (T-P58) ([a80c97b](https://github.com/jaevans36/finance-manager/commit/a80c97b44cd9ed13ae64c38a8919990219f93a3c))
* add Phase 1 frontend components for password reset and email verification ([a5a7ab7](https://github.com/jaevans36/finance-manager/commit/a5a7ab7e167866e6fa322a6519e090c331994f8e))
* add Recharts and statistics service for frontend (T191, T197-T198) ([3dd2b61](https://github.com/jaevans36/finance-manager/commit/3dd2b611e236487ddb7c81a4d943603dc02af7bb))
* add release-please automation and GitHub milestones ([2805890](https://github.com/jaevans36/finance-manager/commit/280589045f6329ea32fba1f72bad70ece9f25ecf))
* add share button and EventShareBadge to EventItem (T-P58) ([98583cb](https://github.com/jaevans36/finance-manager/commit/98583cb1364708266218936bee42b645ba112682))
* add ShareEventModal component (T-P58) ([7546a0b](https://github.com/jaevans36/finance-manager/commit/7546a0b3eb078b452989cae6e94c1f4eacb51930))
* add SharingController invitation inbox endpoints and DI registration for IEventShareService (Phase58D) ([2ca4d31](https://github.com/jaevans36/finance-manager/commit/2ca4d312e22ebdc4f1a7381e3ebf97f0d5f2c24f))
* add sharingService for event share API calls (T-P58) ([02f3d22](https://github.com/jaevans36/finance-manager/commit/02f3d2221e67fc30e41419fcd22a177d86842007))
* add task status workflow and WIP limits (Phase 55)\n\nBackend:\n- Add TaskStatus enum (NotStarted, InProgress, Blocked, Completed)\n- Add status, startedAt, blockedReason fields to Task entity\n- Add PATCH /tasks/{id}/status endpoint with state validation\n- Add Settings feature: UserSettings entity, WipService, SettingsController\n- Add WIP limit support to TaskGroups\n- Add EF migrations with data migration for existing completed tasks\n- Register UserSettingsService and WipService in DI\n\nFrontend:\n- Add StatusBadge, StatusSelector, WipCounter components\n- Add settings service and query hooks (useSettings, useWipSummary)\n- Integrate status display in TaskItem and TaskDetailModal\n- Add status change handler in TasksPage\n- Update taskService with updateTaskStatus method\n- Fix test assertions for new status badge labels\n\n300/300 tests pass, 0 build errors" ([66de834](https://github.com/jaevans36/finance-manager/commit/66de834c2adc88ffdbe8a43839a1d8fd429a670e))
* add task view filter tabs and assign modal wiring to TasksPage (T-P58) ([aa493d0](https://github.com/jaevans36/finance-manager/commit/aa493d0542740e2dff2ab70abe1c26989fc968c1))
* add TaskAssignmentBadge component (T-P58) ([7d0f292](https://github.com/jaevans36/finance-manager/commit/7d0f2927a5fe844f27a456fa49772b5917627d92))
* add TaskPermissionService with CanEdit/CanAssign/CanDelete (T1509) ([321594a](https://github.com/jaevans36/finance-manager/commit/321594a1a3f557c07bbef135862ce09e4880a8b2))
* add theme toggle to AppHeader ([56e6635](https://github.com/jaevans36/finance-manager/commit/56e6635ed4ffa4c9caf9b34153de1a830cfb774f))
* add useEventShares TanStack Query hooks (T-P58) ([4efae0d](https://github.com/jaevans36/finance-manager/commit/4efae0dd679f45cb0ad49b31021fbc205592c4e8))
* add useNotifications TanStack Query hooks (T-P58) ([c519695](https://github.com/jaevans36/finance-manager/commit/c519695b25dc3ee02b6baa748499b7670e335af4))
* add username update functionality for existing users ([80bd7cc](https://github.com/jaevans36/finance-manager/commit/80bd7cc867b4b154cc769425b83e7811534ddbc3))
* add version 0.13.0 to Version History page and spec Phase 23 Version History API ([90eb430](https://github.com/jaevans36/finance-manager/commit/90eb4308627684b655f4271bd7dd27f3b62f2300))
* add visual admin badge to navigation header ([ddc183a](https://github.com/jaevans36/finance-manager/commit/ddc183a568807bdeacc62ba5bd1002b8aab9589a))
* add weekly progress dashboard specification (US8) ([707f933](https://github.com/jaevans36/finance-manager/commit/707f933d9ec8e6a655f9a1e023cc57851305f219))
* **api:** add task group DTOs and update task DTOs ([fcf1393](https://github.com/jaevans36/finance-manager/commit/fcf1393a7dca5da0177f410055777fde1f616079))
* **api:** add task groups database models and migration ([35b7247](https://github.com/jaevans36/finance-manager/commit/35b7247bacb8ee6af02c67f0512c282fbd62b7ce))
* **api:** add task groups REST API controller and DI registration ([0f3784a](https://github.com/jaevans36/finance-manager/commit/0f3784a2adea1edd0767c8cb8f07a3d794266681))
* **api:** add username field to User model with unique constraint ([9a1d6c5](https://github.com/jaevans36/finance-manager/commit/9a1d6c5ebf6bd9b54229148bcf187cf1e3d35844))
* **api:** create and apply username migration with backwards compatibility ([70444ce](https://github.com/jaevans36/finance-manager/commit/70444cea3f7da1a9c8944db5393750e83888725d))
* **api:** implement task group service and update task service ([8667816](https://github.com/jaevans36/finance-manager/commit/866781656055b76026e2165034aa10f483c925ae))
* **api:** implement username support in authentication endpoints ([68e9f3c](https://github.com/jaevans36/finance-manager/commit/68e9f3ce78c6d5db7f955eed2cf7df78a6ddedf5))
* **calendar:** add navigation integration and responsive design ([5aab596](https://github.com/jaevans36/finance-manager/commit/5aab596fa3e2dbb43ffa275d77dffe7ab6737c01))
* **calendar:** implement Phase 12 calendar view with filtering ([0e989ea](https://github.com/jaevans36/finance-manager/commit/0e989eaaf6888044d0279e27bbf6d8e5b7e30280))
* **calendar:** styling improvements and UI consistency ([2a30207](https://github.com/jaevans36/finance-manager/commit/2a30207c8d674ccf42f872ad02a62c3181f1ab5d))
* complete backend migration and update infrastructure ([3b694b6](https://github.com/jaevans36/finance-manager/commit/3b694b61e6e8dca76a79462d0182e6b08bd32639))
* complete Phase 13 - Events Feature ([e52a889](https://github.com/jaevans36/finance-manager/commit/e52a889d63d3a265c97ecfe23e0c6407579bee65))
* complete Phase 51 — migrate all components from styled-components to Tailwind CSS\n\nMigrate 60+ component files from styled-components to Tailwind CSS + shadcn/ui:\n\n- Pages: TasksPage, DashboardPage, EventsPage, CalendarPage, WeeklyProgressPage,\n  all auth pages, admin pages, ProfilePage, VersionHistoryPage, DesignSystemPage\n- Task components: TaskItem, TaskList, TaskDetailModal (30 styled), CreateTaskForm,\n  SubtaskItem, SubtaskList, SubtaskProgress, SubtaskBulkActions\n- Calendar: StyledCalendar + new calendar-theme.css, CalendarFilters,\n  QuickAddTaskModal, DayTaskListModal (26 styled)\n- Events: EventItem, EventList, EventForm, EditEventModal\n- Charts: BarChartWrapper, PieChartWrapper, LineChartWrapper\n- Groups: TaskGroupItem, TaskGroupList, CreateTaskGroupModal, GroupSkeleton\n- Dashboard: TaskSearch, TaskSkeleton, TaskStatistics, DashboardLayout\n- Weekly: all 9 sub-components + main page (18 styled)\n- Modals: Modal.tsx, WhatsNewModal, CalculatorModal\n- Misc: AdminRoute, RegisterPage, LoginPage, App.tsx Suspense fallback\n\nZero styled-components imports remain in apps/web/src/**/*.tsx.\nTest utils updated to use @finance-manager/ui ThemeProvider.\n5 test files updated for Tailwind class assertions.\nAll 300 tests pass, build verified (6.94s)." ([e637587](https://github.com/jaevans36/finance-manager/commit/e637587c7ea7519110dc6325609fe01eb04aabaf))
* configure Notification and Task.AssignedToUserId in DbContext (T1507) ([718ac86](https://github.com/jaevans36/finance-manager/commit/718ac865f725a0b86b1a791b0966d08038332a5b))
* create centralized UI component library for consistent theming ([8654fb4](https://github.com/jaevans36/finance-manager/commit/8654fb457445a832e60910df2e41c1f115c34f06))
* create EventsPage with full event management UI ([f94e4e0](https://github.com/jaevans36/finance-manager/commit/f94e4e0fd870e26fb273c893374da139aa959a7d))
* create shared @finance-manager/ui package with complete design system ([a89bcbe](https://github.com/jaevans36/finance-manager/commit/a89bcbe6f92734ff0f29680b48591ab7bf4ce504))
* design system overhaul and TaskDetailModal replacement ([0c1edea](https://github.com/jaevans36/finance-manager/commit/0c1edea57fc6415ccc282732d926edbcd559ccc2))
* enhance events integration across dashboard and calendar (Phase 13.9+) ([3852fbd](https://github.com/jaevans36/finance-manager/commit/3852fbdf5408bd957fd2e21e556bcf62364c1016))
* extend EventService.GetEventsAsync to include accepted shared events; add IsOwner/SharedBy/MyPermission to EventDto (Phase58C) ([5233ee3](https://github.com/jaevans36/finance-manager/commit/5233ee38b0a4de04fc650ef9b1ec2f47b8810295))
* extend TaskService GetTasksAsync to include assigned tasks with view filter (T1511) ([ca841c2](https://github.com/jaevans36/finance-manager/commit/ca841c2fe05f4cbe14bed3dee84ca6ac60c50c11))
* extend taskService with assignment fields and view filter (T-P58) ([07116b1](https://github.com/jaevans36/finance-manager/commit/07116b100a57354a9cba814e4d5b297fc1d6f4b0))
* green subtask badge when all subtasks are completed ([5d81fe1](https://github.com/jaevans36/finance-manager/commit/5d81fe1effb42a626eb32922fc8e865aae990109))
* implement complete admin user management system ([0cc4c3d](https://github.com/jaevans36/finance-manager/commit/0cc4c3d5022917012af3086c005ba1a72c4befef))
* implement comprehensive error logging and monitoring with Serilog (T159) ([7f7195b](https://github.com/jaevans36/finance-manager/commit/7f7195beb7269aa38cd3cb29128ec0cb17aa07df))
* implement comprehensive versioning system (v0.13.0) ([3c9c6f3](https://github.com/jaevans36/finance-manager/commit/3c9c6f3cb74bd955afe7d985cd32f45c0508f5c6))
* implement EventShareService with full permission and notification logic (Phase58C) ([b40ac47](https://github.com/jaevans36/finance-manager/commit/b40ac47b77bd2be103af6919d04bf03ff891ed67))
* implement global AppHeader with dropdown navigation ([6c225f3](https://github.com/jaevans36/finance-manager/commit/6c225f3732d25b5b2308301b0721fe46965e9055))
* implement historical completion rate chart (T231) ([26129f9](https://github.com/jaevans36/finance-manager/commit/26129f9a87cf84a4c8501a9be601dc91fc1708d4))
* implement light/dark theme system with lucide-react icons ([e07b903](https://github.com/jaevans36/finance-manager/commit/e07b903421bcd9a79a5b6f8481d09bb58f46eab2))
* implement month-based data fetching for calendar view (T260) ([508a8fe](https://github.com/jaevans36/finance-manager/commit/508a8fe4628b4c43a6927da96473082a5e4cabcb))
* implement Phase 1 API routes and auth integration ([4b6a175](https://github.com/jaevans36/finance-manager/commit/4b6a175b0fffbd0af2860e021aec6b0f66707845))
* implement Phase 23 Version History API and Admin Dashboard (Quick Wins 1-2) ([6bda58f](https://github.com/jaevans36/finance-manager/commit/6bda58fd80086c85a8e37f3fec0f92ad1f5cff81))
* implement Phase 48-49 — Tailwind CSS + shadcn/ui foundation and TanStack Query integration ([b64fbf6](https://github.com/jaevans36/finance-manager/commit/b64fbf6c144e1fd1a16b078dd8a4763ca4bc3608))
* implement query caching with cache invalidation (T243) ([69b879f](https://github.com/jaevans36/finance-manager/commit/69b879f2cb41483c1ec6ec96cb29f881378ffdb6))
* implement statistics API for weekly progress dashboard (T178-T187, T190) ([ca68e89](https://github.com/jaevans36/finance-manager/commit/ca68e8982846293f3d0b0b57e0048e1185e4ef9a))
* implement subtask feature with inline editing and bulk actions ([f540831](https://github.com/jaevans36/finance-manager/commit/f54083156ae105218679a21d406e3f622d875b3f))
* implement User Management UI and Security features (Quick Wins 3-4) ([d3ffea0](https://github.com/jaevans36/finance-manager/commit/d3ffea0fe3144507d5b782ce5b1e4f036047546b))
* implement Weekly Progress Dashboard UI with charts (T192-T196, T199-T202, T205-T211, T214-T217) ([aa63b52](https://github.com/jaevans36/finance-manager/commit/aa63b523dcc7f5c5deb6b0f500f96344ac13470c))
* integrate events into Calendar view (Phase 13.9) ([044384a](https://github.com/jaevans36/finance-manager/commit/044384a439441d184050d36bf322ed6143c13deb))
* migrate entire backend from Node.js to .NET ([e67326f](https://github.com/jaevans36/finance-manager/commit/e67326f7330313639f4fe600c73f5e211357dd53))
* Phase 50 - React Hook Form & Zod validation migration (T1300-T1321)\n\n- Install react-hook-form and @hookform/resolvers\n- Rewrite Zod schemas: auth (login/register/password), task (with trim),\n  event (with date validation), taskGroup, user/profile\n- Update Priority enum to title-case with Critical level\n- Create 8 form hook files with zodResolver integration\n- Migrate all 10 forms to RHF: LoginForm, RegisterForm,\n  ForgotPasswordPage, ResetPasswordPage, CreateTaskGroupModal,\n  CreateTaskForm, EventForm, TaskDetailModal edit mode,\n  QuickAddTaskModal, ProfilePage\n- Convert schema package from CJS to ESM source-based resolution\n- Fix CalendarPage test pattern (fireEvent outside waitFor)\n- Fix CreateTaskForm test priority value (HIGH -&gt; High)\n- All 300 tests pass, Vite build succeeds" ([dfc6567](https://github.com/jaevans36/finance-manager/commit/dfc6567b93a15d209b3f920db14765d4d2566163))
* Phase 50 — test infra, query migration, sharing, help guide, HTTPS ([78e3387](https://github.com/jaevans36/finance-manager/commit/78e338762138b692e04c08c8852f12b8371b30fd))
* Phase 51 shared components - Tailwind migration (T1322-T1325)\n\n- Migrate PageLayout.tsx from styled-components to Tailwind\n- Migrate AppHeader.tsx to Tailwind + shadcn DropdownMenu\n- Replace custom ToastContext with Sonner wrapper (backward-compatible API)\n- Remove all styled-components imports from shared layout\n- Build passes, all consumers work unchanged" ([bd89969](https://github.com/jaevans36/finance-manager/commit/bd89969295691b2582199390acb0ac37fcde1127))
* Phase 58 — task assignment, event sharing, notifications frontend (Plan 3) ([734bda6](https://github.com/jaevans36/finance-manager/commit/734bda60b53ec803a76333d3270655944444eaf7))
* **phase1:** add email and token infrastructure for password reset and verification ([46d510f](https://github.com/jaevans36/finance-manager/commit/46d510f3a49d9fa2996f4391fb568aa0a734830f))
* **phase1:** add password strength validation and comprehensive progress tracking ([0b955fd](https://github.com/jaevans36/finance-manager/commit/0b955fd892d07324e9afae62da1949a49a86a881))
* **phase1:** implement session management and activity logging services ([0a0c392](https://github.com/jaevans36/finance-manager/commit/0a0c3923f5bd20015389d05ff9c24d0131978d69))
* register INotificationService and ITaskPermissionService in DI container (T1513) ([e27a9bc](https://github.com/jaevans36/finance-manager/commit/e27a9bc2e1f7b0b2d96857e82d004a15a1ef0cc0))
* rename to Life Manager and release v1.0.0 MVP ([342a9bb](https://github.com/jaevans36/finance-manager/commit/342a9bbc71dfa93be5001df385061ed5a216856a))
* restructure dashboard and create dedicated tasks page ([e683e99](https://github.com/jaevans36/finance-manager/commit/e683e990f99a484412c32be70493e81ad2d1d7a4))
* standardize page layouts with PageLayout component ([7c52ffe](https://github.com/jaevans36/finance-manager/commit/7c52ffe07c8627cef23c67a892f50349989fb9f3))
* **statistics:** implement weekly progress dashboard with daily task breakdown ([acb36ca](https://github.com/jaevans36/finance-manager/commit/acb36ca8abef697df36b2aa940768f78d15b7341))
* **ui:** implement design system overhaul - fonts, brand colour, tokens, a11y ([aed61aa](https://github.com/jaevans36/finance-manager/commit/aed61aae66857b96a66761a283ff5c5df9000914))
* update frontend to connect to .NET API ([623f3ca](https://github.com/jaevans36/finance-manager/commit/623f3cadc487a45b9ca9afca71fd0444ac8c0226))
* update QuickAdd modal to support both tasks and events ([062f598](https://github.com/jaevans36/finance-manager/commit/062f5983ee37aa54cd713d71bbfef4318fa1efa4))
* v1.0.0 — MVP launch (keyboard shortcuts, browser notifications, task labels, Life Manager rename) ([57a854d](https://github.com/jaevans36/finance-manager/commit/57a854d03630d00b4d6d7b6679335a4cba67761f))
* **web:** add comprehensive responsive design for mobile devices ([4547755](https://github.com/jaevans36/finance-manager/commit/454775545ba2eaee6a29b3c1c0106d6a759b5177))
* **web:** add keyboard shortcuts (T151) ([4c1cf93](https://github.com/jaevans36/finance-manager/commit/4c1cf93141727b27531581ee7b6a0cad6f4e8600))
* **web:** add loading skeleton screens (T148) ([7775a12](https://github.com/jaevans36/finance-manager/commit/7775a12cca938a31e086f2d53726e886ba1de68b))
* **web:** add responsive design for mobile devices (T147) ([f5e328f](https://github.com/jaevans36/finance-manager/commit/f5e328f8776d088c2999b5f1dc03b29811132987))
* **web:** add task group types and API services ([ec77a66](https://github.com/jaevans36/finance-manager/commit/ec77a66d2b091223e6d51438149dc86ab80e269a))
* **web:** add task group UI components ([5a57d22](https://github.com/jaevans36/finance-manager/commit/5a57d221f6dbe462d9a6637d3537fba838c8d28b))
* **web:** add task search functionality (T152) ([82adf9f](https://github.com/jaevans36/finance-manager/commit/82adf9fb605da23efa38dac7aa12806f97b47bce))
* **web:** add task statistics dashboard component (T153) ([577fae2](https://github.com/jaevans36/finance-manager/commit/577fae2558965f7447f1a8bd3fddebefa7f7ffc7))
* **web:** add toast notification system (T149) ([6df1445](https://github.com/jaevans36/finance-manager/commit/6df14457c21edf6aef55e0e2993ce8d740ce6a47))
* **web:** add user profile page (T150) and docs: add username system specification ([a4aa51b](https://github.com/jaevans36/finance-manager/commit/a4aa51bc9ef69bf0b1b59b7741a00d8556bd5720))
* **web:** implement username support in frontend ([f9aec6f](https://github.com/jaevans36/finance-manager/commit/f9aec6fe8240d290fb102f45fac81f58caf6dd39))
* **web:** improve weekly progress page design and create design system ([20a25cb](https://github.com/jaevans36/finance-manager/commit/20a25cb44566d3a0a1bdc43fb562abdad891441b))
* **web:** integrate task groups into dashboard with filtering ([c3f8b6d](https://github.com/jaevans36/finance-manager/commit/c3f8b6d1bf24c5663f7c3781ad4d37776e285a3e))
* **web:** update task components for group support ([0b8ba12](https://github.com/jaevans36/finance-manager/commit/0b8ba126973149dfd1a4821c07338066200146bc))
* **weekly-progress:** add advanced analytics and productivity insights ([87b697c](https://github.com/jaevans36/finance-manager/commit/87b697c6571bd32d8896a5058e2d2abffcd3aead))
* **weekly-progress:** add chart accessibility and error handling ([711ebed](https://github.com/jaevans36/finance-manager/commit/711ebed95a97b08943ae914a8c89a945920b7969))
* **weekly-progress:** add custom date ranges, month view, and group filtering ([bcc6f9b](https://github.com/jaevans36/finance-manager/commit/bcc6f9bf6185251664aee5fba5df611b373e21a7))
* **weekly-progress:** complete all optional Phase 11 features ([4266640](https://github.com/jaevans36/finance-manager/commit/4266640bcd672c46652db739a716bb93b402bef9))


### Bug Fixes

* accept both date formats in TaskItem tests ([6017f4d](https://github.com/jaevans36/finance-manager/commit/6017f4d57a597147f9ddfe958efaebd7dc788deb))
* achieve 100% E2E test pass rate (4/4 tests passing) ([da00bdf](https://github.com/jaevans36/finance-manager/commit/da00bdf480f263cc835ed5f80011b59ad2364f7e))
* add missing memo import to TaskItem component ([e066e08](https://github.com/jaevans36/finance-manager/commit/e066e08d74e22ec685e343283a1ec75b878fe0e4))
* add npm to PATH in dev scripts for pnpm resolution ([762d0de](https://github.com/jaevans36/finance-manager/commit/762d0dee109465deb0359243d67bde687efdff96))
* add prisma generate postinstall script for CI ([a7c90fc](https://github.com/jaevans36/finance-manager/commit/a7c90fc3272962b8bcbf72c44b8af05e070a9242))
* add proper TypeScript typing for StatIcon color prop ([50d75a0](https://github.com/jaevans36/finance-manager/commit/50d75a010d759f024b65af1d3f5bef7ed4f5e91f))
* add TypeScript interfaces for styled-components transient props ([c773989](https://github.com/jaevans36/finance-manager/commit/c773989bd27b3a9148874d96be261a689baf8d73))
* add TypeScript module declaration for VERSION.json ([0eb3519](https://github.com/jaevans36/finance-manager/commit/0eb351952fd7eaded16be3fb89ad655f511a0fe9))
* add VERSION.json to TypeScript includes ([60b15bc](https://github.com/jaevans36/finance-manager/commit/60b15bc198040390144cde2e7fde48c1d4074a82))
* align InvitationCard with backend EventShareInvitationDto shape (T-P58) ([78d582e](https://github.com/jaevans36/finance-manager/commit/78d582e7188fc2636a4424c05b3d615559fe84c6))
* align priority values between frontend and backend ([be74bb6](https://github.com/jaevans36/finance-manager/commit/be74bb640ff4a1bc192a5242f025332351fd5cee))
* align UnreadCountResponse with backend unreadCount property (T-P58) ([6751de5](https://github.com/jaevans36/finance-manager/commit/6751de5a562123cbd45b226af50b2716c69a3b57))
* align ViewModeSelector buttons with DateNavigation buttons ([8fa12d8](https://github.com/jaevans36/finance-manager/commit/8fa12d877a9da09b58a5cd269e3f4dc428ca5001))
* allow Blocked status selection with reason prompt in StatusSelector ([ecd4a2f](https://github.com/jaevans36/finance-manager/commit/ecd4a2fe86152733bcc966f4261633574da7c211))
* allow integration tests to run with in-memory database in CI ([2e878f5](https://github.com/jaevans36/finance-manager/commit/2e878f555a57ad9ed27f163b2b584f78dd7244a6))
* **api:** correct API routes to use /api/v1/auth prefix ([f7bfa49](https://github.com/jaevans36/finance-manager/commit/f7bfa49565cd64a086ca1ae523e057c56b01f7f2))
* **api:** merge username endpoints into AuthController to resolve routing conflict ([ccfbbcf](https://github.com/jaevans36/finance-manager/commit/ccfbbcf8461dcc1b544546eff72e9bac22fadcbc))
* build @finance-manager/schema before tests ([b4e904c](https://github.com/jaevans36/finance-manager/commit/b4e904c7689c2ac3e1fafde89c53f7f08adb5b1e))
* configure Vite workspace alias and remove redundant VersionHistoryPage header ([4fe50f7](https://github.com/jaevans36/finance-manager/commit/4fe50f73217e2806055b04b0c0a56bc4d818761a))
* consistent page layouts, TaskDetailModal spacing, and nav alignment ([634a817](https://github.com/jaevans36/finance-manager/commit/634a81733e037aa6c657f2ef216f835a308e7926))
* correct BarChartWrapper dataKeys format in ResponsiveCharts tests ([3bfb432](https://github.com/jaevans36/finance-manager/commit/3bfb43259cd4e54bf375af72d0df63254fc292d5))
* correct component props in Design System page ([a60427e](https://github.com/jaevans36/finance-manager/commit/a60427e391953b70b1249b643f5b9536010816ea))
* correct EmptyState SVG styling and button spacing ([396f5d6](https://github.com/jaevans36/finance-manager/commit/396f5d6646fad37d0bfb94dcf1bd7c1c20c32cff))
* correct Flex gap prop types and add created/modified dates to tasks ([17e3715](https://github.com/jaevans36/finance-manager/commit/17e37158f8a26f71bebb7205866126162a59ac5e))
* correct ThemeButton colors to use proper theme values ([9e768db](https://github.com/jaevans36/finance-manager/commit/9e768dbc39d8d425a06bb53869366002fbdbf58b))
* correct VERSION.json import path in App.tsx ([bf5280b](https://github.com/jaevans36/finance-manager/commit/bf5280bdcbdd5574d5be50e29903fa8b385eb1ed))
* correct VERSION.json import path in VersionHistoryPage ([84ba58e](https://github.com/jaevans36/finance-manager/commit/84ba58e64ce2ded0a6c0f67456581eab1e45a7c9))
* correct VERSION.json import path in WhatsNewModal ([e1c1aa3](https://github.com/jaevans36/finance-manager/commit/e1c1aa3d69a38a20d431eca2e03765f1c562899d))
* correct WeeklyStatistics type usage in performance tests ([134de96](https://github.com/jaevans36/finance-manager/commit/134de961c8cbfdc40d2ad5086e3a9688d6eadbd2))
* **css:** move [@import](https://github.com/import) before [@tailwind](https://github.com/tailwind) directives to resolve PostCSS warning ([530b056](https://github.com/jaevans36/finance-manager/commit/530b056736ef1e56e3fceac5e97cd68afbd6ad68))
* explicit catch unknown annotations and remove redundant isOwner fallback (T-P58) ([82099eb](https://github.com/jaevans36/finance-manager/commit/82099ebb79a3edde12a3970261e12c3fb163da02))
* explicitly set SVG color in ThemeButton for dark mode visibility ([4ba17c2](https://github.com/jaevans36/finance-manager/commit/4ba17c223a3ad6e343700108732b75e6252cad10))
* fix ChangelogParserTests temp dir path for Linux CI ([10353d7](https://github.com/jaevans36/finance-manager/commit/10353d747d2fe674845348dbcebbf34b352e7b9e))
* import global.css in main.tsx to enable Tailwind CSS ([d7bfbd2](https://github.com/jaevans36/finance-manager/commit/d7bfbd2ed8495b96e1baf7270e1fa5d265d3247e))
* improve calendar dark mode styling and fix ProfilePage imports ([8564bfc](https://github.com/jaevans36/finance-manager/commit/8564bfc86603320a5781e83a889dd3fb89b501a4))
* improve Weekly Progress Dashboard layout and spacing ([775fec2](https://github.com/jaevans36/finance-manager/commit/775fec209216e9d649723906298875c722176055))
* Low urgency badge unreadable in light mode — fix success-foreground token ([f030ff0](https://github.com/jaevans36/finance-manager/commit/f030ff0fb26d8bf820181f4b89ba6cc72ffd76f1))
* make historical chart respect light/dark theme switching ([e97f02c](https://github.com/jaevans36/finance-manager/commit/e97f02ccb70505c9b464c6130fb8781250ba36a2))
* move CalculatorModal to correct position and fix theme colors ([7aa1a42](https://github.com/jaevans36/finance-manager/commit/7aa1a42288250605f1de43bf78a8733be466d6f8))
* remove emoji characters from PowerShell scripts ([8490103](https://github.com/jaevans36/finance-manager/commit/8490103bee51dd97a4c2abf59f9eea330947e8a5))
* remove redundant inline styles from Events page buttons ([2c1d070](https://github.com/jaevans36/finance-manager/commit/2c1d070f0ae17dbb7f053bb4d7251d2a9d138c31))
* replace fixed-position ThemeToggle with inline header button ([15c00ac](https://github.com/jaevans36/finance-manager/commit/15c00ac81fa6a56bb651eb02e216d482795bdaf1))
* replace React namespace with named type imports in ShareEventModal (T-P58) ([a5de0ba](https://github.com/jaevans36/finance-manager/commit/a5de0ba6683c4833444e58d72b0a8ca20862517c))
* resolve all ESLint errors blocking CI ([23cbd85](https://github.com/jaevans36/finance-manager/commit/23cbd85bc175208ba8ed53e45fda46ef6f4f455a))
* resolve all pre-existing unit test failures (138/138 passing) ([88cd06e](https://github.com/jaevans36/finance-manager/commit/88cd06ef6bd72dee0e0084510079a2e0974d5840))
* resolve App.tsx and TaskItem.tsx compilation errors ([d3e4590](https://github.com/jaevans36/finance-manager/commit/d3e45902d52beda691231691d43924efd1ef5b8e))
* resolve calendar month navigation state management issue ([a070614](https://github.com/jaevans36/finance-manager/commit/a0706144a551cc5eb6044dc68f870657e1e1c647))
* resolve CI failures in backend tests and frontend lint ([dc0c3b9](https://github.com/jaevans36/finance-manager/commit/dc0c3b930ab96851c0a276d309e48bea88f3567e))
* resolve final 11 test failures - achieve 100% pass rate (133/133) ([c318fc6](https://github.com/jaevans36/finance-manager/commit/c318fc68d7cdd0b84d05510e889bad5b6b7b9a15))
* resolve test failures and API response formats ([723fc8c](https://github.com/jaevans36/finance-manager/commit/723fc8c938525e58dde8867a1fb23f49e409b051))
* resolve TypeScript errors in event test files ([b23a4bf](https://github.com/jaevans36/finance-manager/commit/b23a4bf90c9ae3682b0afc61a4a76fd0bab3970b))
* run database migrations before backend tests in CI ([91936bb](https://github.com/jaevans36/finance-manager/commit/91936bbb6bd4cd0ae46a5fdffae5d08f51b5d362))
* skip database migration when using InMemory provider (integration test compatibility) ([905897f](https://github.com/jaevans36/finance-manager/commit/905897fc039006a3b9a10458e004f11dae6ccaf3))
* subtask counter badge not updating when toggling subtasks inline ([66ab993](https://github.com/jaevans36/finance-manager/commit/66ab993afcbfd5d36b1dc8054f4baf08c3d7cc47))
* **tests:** add React imports and test dependencies for calendar tests ([b2ba615](https://github.com/jaevans36/finance-manager/commit/b2ba615103a9bb298b84dac18527d0e245c6a786))
* **tests:** resolve TypeScript errors in CalendarPage and WeekNavigation tests ([3eba3db](https://github.com/jaevans36/finance-manager/commit/3eba3dbec038982df6d4b594d998b0b35abb7876))
* TypeScript errors in EventsPage ([b00a06b](https://github.com/jaevans36/finance-manager/commit/b00a06b9217127048aef0a53107abfc88225880c))
* **ui:** dropdown cursor, calculator bg, subtask sync, text wrappers ([7c7eb40](https://github.com/jaevans36/finance-manager/commit/7c7eb40a15ff064f26c5d59db42cfaa597f1dbfb))
* update deploy-uat.ps1 for Docker Compose + HTTPS stack ([c4501ed](https://github.com/jaevans36/finance-manager/commit/c4501ed68078d4e097d878a9bdc7969439c89dee))
* update E2E tests with correct selectors and add testing strategy doc ([3f241b4](https://github.com/jaevans36/finance-manager/commit/3f241b4869033d5df59919a20d0e1c536694ce4e))
* update integration tests to use LoginRequest.EmailOrUsername ([eab74d4](https://github.com/jaevans36/finance-manager/commit/eab74d49453f4586e8e6028d45d127bd6c6c491d))
* update Node.js to v20 and pnpm to v9 for CI compatibility ([7e235b3](https://github.com/jaevans36/finance-manager/commit/7e235b3ab98a01ebf29c17e005130adce9d1e341))
* update PowerShell scripts for .NET backend ([229a625](https://github.com/jaevans36/finance-manager/commit/229a6259e64b7c4833d86dd60e001f62109c8f72))
* update unit tests for pre-existing date/validation issues and populate DailyStatistics tasks list ([0c48208](https://github.com/jaevans36/finance-manager/commit/0c48208047e57cee36081f9d93aaa27b3b0468a5))
* update unit tests for TaskService constructor and LoginRequest changes ([e47f917](https://github.com/jaevans36/finance-manager/commit/e47f917555d5e9e09eb4bf889e5752b78fe60a86))
* upgrade actions/upload-artifact to v4 and fix ESLint config ([23db97c](https://github.com/jaevans36/finance-manager/commit/23db97c4772d432805d32c48d4587173346fce35))
* upgrade pnpm/action-setup from v2 to v4 ([8484fbf](https://github.com/jaevans36/finance-manager/commit/8484fbf434ae04f4c15742c2849277643cc4c0ea))
* use primary color for theme toggle icon for consistent visibility ([f3c0533](https://github.com/jaevans36/finance-manager/commit/f3c053385952a77e75a4246548b7839e4d042ccc))
* use single quotes in Assign button aria-label (T-P58) ([0d4df23](https://github.com/jaevans36/finance-manager/commit/0d4df23590d0a215221bb74ab9cedf544b17c69a))
* use startDate instead of startTime in Event references ([863c5e1](https://github.com/jaevans36/finance-manager/commit/863c5e13f636cd71499f83d0cd483d3424220b28))
* **web:** add missing React import in TaskSkeleton ([c9c41a5](https://github.com/jaevans36/finance-manager/commit/c9c41a5a94b7fb3f2e2e60553da294c67def8284))
* **web:** make ProfilePage container styling consistent with Dashboard ([f112926](https://github.com/jaevans36/finance-manager/commit/f112926894fd9cb92dd7aedb1e5e9996b54a389d))
* **web:** match ProfilePage header margins with Dashboard ([71fae82](https://github.com/jaevans36/finance-manager/commit/71fae82f57efe04bc48e1e4e5ffc8b940cc269a9))
* **web:** replace any type with proper error handling in ProfilePage ([627a43b](https://github.com/jaevans36/finance-manager/commit/627a43b29f6245a8b67ef6edf28dda7791911281))
* **web:** use transient props in ProfilePage styled components ([7e0ac2e](https://github.com/jaevans36/finance-manager/commit/7e0ac2e95a229747d384f209f24a7b51ed3cbaad))
* weekly progress page empty states and layout gaps ([609b4fb](https://github.com/jaevans36/finance-manager/commit/609b4fb8d7915dee5c46805cd82127cac34df427))
* z-index hierarchy for overlays above sticky header ([916e9e3](https://github.com/jaevans36/finance-manager/commit/916e9e350a596dec8268f48d4a9eb4d19a83c843))


### Performance Improvements

* implement code splitting and lazy loading (T156) ([4ff2e63](https://github.com/jaevans36/finance-manager/commit/4ff2e63c2a90d76fa6b75b4087b9c5abfa169354))

## [1.0.0] - 2026-03-20 "MVP Launch — Life Manager"

### Added
- **Project Rename** — Finance Manager is now Life Manager; all packages, imports, UI text, docs, and container names updated
- **Health Check** — `GET /api/health` returns status, version, and DB connectivity (used by monitoring and production setup guide)
- **Data Export** — `GET /api/v1/auth/export-data` downloads all user data (tasks, groups, events, settings) as a JSON file
- **404 Page** — Not Found page with back/dashboard navigation for any unmatched route
- **Onboarding panel** — Empty-state welcome on dashboard when no tasks exist, with quick-start actions
- **Production setup** — `.env.example`, `appsettings.Production.example.json`, `scripts/backup-db.ps1`, `scripts/restore-db.ps1`, `docs/guides/PRODUCTION-SETUP.md`
- **CLAUDE.md** — Single AI context file replaces scattered SpecKit + Copilot instructions
- **Task Labels** — User-defined coloured labels with full CRUD; labels attach to tasks and appear as coloured badges; filterable on Tasks page; managed in Profile settings; backend: `labels` table with unique (userId, name) constraint, `task_labels` junction table, full API (`GET/POST/PUT/DELETE /api/v1/labels`)
- **Browser Notifications** — Service Worker (`sw.js`) with IndexedDB stores task reminders; polls every 60 s; `reminderAt` field on tasks lets users set a date/time reminder; notifications fire at the scheduled time
- **Keyboard Shortcuts** — Global `KeyboardShortcutProvider` with chord support (`g+t`, `g+c`, `g+d`, `g+m`); `n` to create task, `/` to focus search; `?` opens cheat-sheet overlay; all shortcuts respect input-field focus guards
- **Task Assignment** — Assign tasks to other users within the same group; assignment badge on TaskItem; shared tasks appear across assignee's board
- **Event Sharing** — Share events with other users with view/edit permission levels; invitation flow with accept/decline

### Changed
- Archived `.specify/` (SpecKit) to `_archive/speckit/`
- `docs/CURRENT_STATE.md` rewritten to reflect actual v1.0 state
- `README.md` fully updated with correct stack, scripts, and getting-started steps
- Swagger API description updated to reflect Life Manager (not "finance management")

---

## [0.15.0] - 2026-01-29 "Quick Wins: APIs, Admin & Security"

### Added
- **Version History API** (Phase 23, T788-T795)
  - Created VersionInfo, ChangelogSection, ChangelogItem models
  - Implemented ChangelogParser service to parse CHANGELOG.md (Keep a Changelog format)
  - VersionService with GET /api/version/current, /history, /history/:version endpoints
  - In-memory caching (5 min TTL, disabled in development)
  - Frontend versionService with TypeScript interfaces (VersionInfo, VersionHistory)
  - VersionHistoryPage now fetches from API with loading/error states
  - Removed hardcoded mockChangelog
  - Automatic version display when CHANGELOG.md updated

- **Admin Dashboard**
  - Created AdminDashboard page at /admin route
  - System statistics: Total Users, Active Users, Total Tasks, Total Events
  - Quick Actions: Manage Users, Design System, Version History
  - Recent Activity log (ready for API integration)
  - Shield icon link in navigation (admin-only)

- **User Management UI**
  - Created UserManagement page at /admin/users
  - User table with search by email/username
  - Filter by all, admin, verified, unverified status
  - Stats cards for user metrics
  - Promote/demote admin privileges with confirmation
  - View user details: email, username, admin status, verification, join date
  - Badges for admin and verification status
  - Responsive table design

- **Security: Rate Limiting**
  - RateLimitMiddleware with sliding window algorithm
  - Configurable limits: 60 requests/minute, 1000 requests/hour
  - Returns 429 Too Many Requests with Retry-After header
  - X-RateLimit headers (Limit, Remaining, Reset)
  - Skips health checks and Swagger endpoints
  - Handles X-Forwarded-For and X-Real-IP (proxy support)
  - Automatic cleanup of old entries
  - Thread-safe ConcurrentDictionary implementation

- **Security: Security Headers**
  - SecurityHeadersMiddleware following OWASP best practices
  - X-Content-Type-Options: nosniff (prevent MIME sniffing)
  - X-Frame-Options: DENY (prevent clickjacking)
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: disable geolocation, microphone, camera, payment
  - Content-Security-Policy (strict in production, relaxed in dev)
  - Strict-Transport-Security (HSTS) in production with HTTPS
  - Removes Server, X-Powered-By headers

- **Configuration**
  - RateLimit section in appsettings.json (Enabled, MaxRequestsPerMinute, MaxRequestsPerHour)

### Changed
- VersionHistoryPage now uses API instead of hardcoded data
- Middleware execution order: SecurityHeaders → RateLimit → ErrorLogging

### Performance
- Version history caching reduces file I/O by 5 minutes between CHANGELOG.md reads

---

## [0.14.0] - 2026-01-28 "Admin & Design System"

### Added
- **Admin System**
  - IsAdmin boolean field added to User model with database migration
  - JWT tokens now include "Admin" role claim for authorization
  - AdminOnlyAttribute for protecting backend admin endpoints
  - AdminRoute component for frontend route protection
  - Admin badge with shield icon (🛡️) and tooltip in navigation header
  - Non-admin users redirected to dashboard when accessing admin routes
  - Design System page now admin-only access

- **Design System Package**
  - Created @life-manager/ui shared package in packages/ui/
  - Migrated all design tokens (typography, spacing, theme, colors)
  - Migrated all UI components (Button, Card, Input, Badge, Alert, etc.)
  - Migrated ThemeContext and theme provider
  - Updated 20+ files to use new import pattern from shared package
  - Calculator modal refactored to use design tokens
  - Design System showcase page at /design-system route

- **Documentation**
  - Comprehensive design system usage guide (docs/guides/DESIGN_SYSTEM_USAGE.md)
  - Updated Copilot instructions with mandatory design system standards
  - Package READMEs for @life-manager/ui
  - Documentation index reorganized with design system section

- **Developer Experience**
  - npm script shortcuts (pnpm start, stop, restart, db:reset, logs, test:all)
  - Fixed VS Code tasks configuration for script execution
  - Scripts can now be run from any directory

### Changed
- Design System link in navigation now conditionally displayed (admin only)
- Calculator modal now uses spacing and typography tokens instead of hardcoded values

### Fixed
- Badge and Alert component prop errors in Design System page (variant usage)
- VS Code tasks now properly execute PowerShell scripts with spaces in paths

---

## [0.13.0] - 2026-01-18 "Events Foundation"

### Added
- **Events Feature** (Phase 13)
  - Complete event management system with CRUD operations
  - Event form with title, description, start/end times, location, reminders
  - Event list component with Today/Tomorrow/This Week grouping
  - Event item display with all-day event badges
  - Events API with 5 REST endpoints (GET, POST, PUT, DELETE)
  - Task group assignment for events with color-coded display
  - 68 comprehensive tests (18 backend unit, 16 backend integration, 25 frontend component, 9 E2E)

- **Dashboard Restructure**
  - New dashboard as proper overview hub with widgets
  - Personalized greeting (Good morning/afternoon/evening)
  - Quick Stats cards: Tasks Completed, Upcoming Events, Due Today, Overdue
  - Quick Actions: View All Tasks, Calendar, Weekly Progress, Manage Groups
  - Upcoming Events section showing next 7 days
  - Priority Tasks section sorted by priority and due date
  - Dedicated Tasks page for full task management

- **Navigation Improvements**
  - Active state highlighting for current page in header
  - New navigation links: Dashboard, Tasks, Calendar, Progress, Profile
  - Application renamed to "To Do Manager"
  - Improved routing with /dashboard (overview) and /tasks (management)

- **Calendar Integration**
  - Event badges on calendar dates
  - Event count indicators with color coding
  - Quick event creation from calendar with pre-populated dates
  - All-day event support in calendar view

### Changed
- Separated dashboard overview from task management interface
- Improved header navigation with better visual hierarchy
- Enhanced calendar view with event information

### Technical
- Added Event entity to database with EF Core migration
- Created EventService with business logic layer
- Implemented EventsController with OpenAPI documentation
- Added comprehensive test coverage for events feature
- Updated TEST-INVENTORY.md: 235 → 303 tests

---

## [0.12.0] - 2025-12-20 "Calendar View"

### Added
- **Calendar View** (Phase 12)
  - Monthly calendar interface for visualizing tasks by date
  - Day cells with task count badges and color-coded priorities
  - Click day to add task with pre-populated due date
  - Click task badge to view all tasks for that day
  - Task detail modal with quick completion toggle
  - Month navigation with previous/next and date picker
  - Filter tasks by group and priority in calendar view
  - Responsive design with mobile swipe gestures
  - 20 tests for calendar functionality

### Changed
- Added calendar route and navigation menu item
- Improved date-based task organization
- Enhanced mobile touch interactions

---

## [0.11.0] - 2025-12-15 "Weekly Progress Dashboard"

### Added
- **Weekly Progress Dashboard** (Phase 11)
  - Comprehensive weekly analytics with visualization
  - Weekly overview with bar charts and pie charts (Recharts)
  - Daily breakdown showing 7-day cards with completion rates
  - Urgent tasks panel displaying critical/high priority tasks
  - Historical completion rate chart (8-week trend)
  - Week navigation with previous/next controls
  - Statistics API endpoints (weekly, daily, urgent, historical)
  - Empty states and loading skeletons
  - 45 tests for weekly progress features

### Changed
- Added Weekly Progress to main navigation
- Improved task statistics calculations
- Enhanced data visualization capabilities

---

## [0.10.0] - 2025-12-01 "Username System"

### Added
- **Username System** (Phase 10)
  - Unique username field for user accounts (3-20 characters)
  - Real-time username availability checking with debounce
  - Login with username or email
  - Username update functionality in profile page
  - Reserved username list (admin, support, system, etc.)
  - Username validation (alphanumeric + underscore/hyphen)

### Changed
- Registration form now includes username field
- Login accepts both username and email
- Dashboard displays username instead of email
- Profile page shows username with edit capability

---

## [0.9.0] - 2025-11-20 "Polish & Cross-Cutting"

### Added
- Responsive design for mobile devices (breakpoints, touch targets)
- Loading skeletons for better perceived performance
- Toast notifications for user actions (success/error messages)
- User profile page with account management
- Keyboard shortcuts (N=new task, /=search, Esc=close)
- Task search functionality (search by title/description)
- Task statistics dashboard (total, completed, overdue counts)
- Dark mode theme toggle
- Accessibility improvements (ARIA labels, keyboard navigation)
- API documentation with Swagger UI
- Comprehensive error logging and monitoring
- Security audit completed

### Changed
- Performance optimization with code splitting and lazy loading
- Improved error handling across the application
- Enhanced user experience with visual feedback

---

## [0.8.0] - 2025-11-10 "Task Groups"

### Added
- **Task Groups** (Phase 8)
  - Create named groups for organizing tasks (e.g., "House Renovation", "Work")
  - Group properties: name, description, color, icon
  - Automatic "Uncategorized" default group creation
  - Task group assignment during creation and editing
  - Filter tasks by group with sidebar navigation
  - Group-based color coding throughout the application
  - Task count per group display
  - Group CRUD operations with API endpoints
  - 27 tests for task group functionality

### Changed
- Task model extended with optional groupId
- Dashboard includes task group sidebar
- Task items display group badge with color
- Default group cannot be deleted

---

## [0.7.0] - 2025-11-01 "Task Deletion"

### Added
- **Task Deletion** (Phase 7)
  - Delete button with trash icon on task items
  - Confirmation dialog before deletion
  - Optimistic UI updates with rollback on error
  - Deletion logging for audit trail
  - User ownership validation

### Changed
- Task management now includes delete functionality
- Added error handling for failed deletions

---

## [0.6.0] - 2025-10-25 "Due Date Management"

### Added
- **Due Date Management** (Phase 6)
  - Set due dates on tasks with HTML5 date picker
  - Overdue task indicators with red highlighting
  - Due date display with formatting (relative dates)
  - Filter tasks by due date range
  - Sort tasks by due date
  - Overdue task counter in dashboard statistics
  - Date validation for task creation/editing

### Changed
- Task model includes dueDate field
- Task forms include date input
- Dashboard shows overdue task count

---

## [0.5.0] - 2025-10-15 "Task Prioritization"

### Added
- **Task Prioritization** (Phase 5)
  - Four priority levels: Critical, High, Medium, Low
  - Priority selector dropdown in task forms
  - Priority badge with color coding (red, orange, yellow, green)
  - Filter tasks by priority
  - Sort tasks by priority
  - Priority-based visual hierarchy

### Changed
- Task model includes priority field
- Task items display priority badges
- Dashboard includes priority filter

---

## [0.4.0] - 2025-10-05 "Basic Task Management"

### Added
- **Basic Task Management** (Phase 4)
  - Create tasks with title, description, priority, due date
  - View task list with sorting and filtering
  - Edit task details in modal
  - Mark tasks as complete/incomplete with toggle
  - Task dashboard with list view
  - Task statistics (total, completed)
  - Empty state UI for new users
  - Client-side form validation
  - 22 tests for task CRUD operations

### Changed
- Dashboard now displays task management interface
- Added task-specific navigation

---

## [0.3.0] - 2025-09-25 "User Authentication"

### Added
- **User Registration & Authentication** (Phase 3)
  - User registration with email and password
  - Secure login with JWT tokens
  - Logout functionality
  - Session management with token refresh
  - Password hashing with BCrypt
  - Rate limiting middleware
  - Protected routes requiring authentication
  - 22 tests for authentication flows

### Changed
- Application now requires authentication
- Added auth pages (login, register)
- JWT token storage in localStorage

---

## [0.2.0] - 2025-09-15 "Foundation"

### Added
- **Foundational Infrastructure** (Phase 2)
  - PostgreSQL database with Docker Compose
  - Entity Framework Core with DbContext
  - User and Task entities
  - EF Core migrations
  - JWT authentication middleware
  - Password hashing service
  - React + Vite frontend setup
  - Axios API client with interceptors
  - Authentication context
  - Protected route wrapper
  - Styled-components theming
  - Error boundary component
  - Global exception handling
  - CORS configuration
  - Logging with Serilog

---

## [0.1.0] - 2025-09-01 "Initial Setup"

### Added
- **Project Setup** (Phase 1)
  - Monorepo structure with pnpm workspaces
  - .NET Core 8.0 Web API project
  - React 18 + TypeScript + Vite frontend
  - xUnit testing framework for backend
  - Jest + Testing Library for frontend
  - ESLint and Prettier configuration
  - Git repository with .gitignore
  - Basic project documentation
  - Development scripts (start-dev.ps1, stop-dev.ps1, etc.)

### Infrastructure
- Docker Compose for local development
- PowerShell scripts for development workflow
- Solution structure with feature-based organization
- TypeScript strict mode configuration

---

## Version History Summary

| Version | Release Date | Codename | Key Features |
|---------|--------------|----------|--------------|
| 0.13.0 | 2026-01-18 | Events Foundation | Events system, dashboard restructure |
| 0.12.0 | 2025-12-20 | Calendar View | Monthly calendar with task visualization |
| 0.11.0 | 2025-12-15 | Weekly Progress | Analytics dashboard with charts |
| 0.10.0 | 2025-12-01 | Username System | Username authentication |
| 0.9.0 | 2025-11-20 | Polish | Dark mode, keyboard shortcuts, search |
| 0.8.0 | 2025-11-10 | Task Groups | Group-based task organization |
| 0.7.0 | 2025-11-01 | Task Deletion | Delete tasks with confirmation |
| 0.6.0 | 2025-10-25 | Due Dates | Due date management and overdue tracking |
| 0.5.0 | 2025-10-15 | Prioritization | Four-level task prioritization |
| 0.4.0 | 2025-10-05 | Task Management | Core CRUD operations for tasks |
| 0.3.0 | 2025-09-25 | Authentication | User registration and login |
| 0.2.0 | 2025-09-15 | Foundation | Database, API, frontend infrastructure |
| 0.1.0 | 2025-09-01 | Initial Setup | Project initialization |

---

## Upcoming Releases

### [0.14.0] - TBD "Task Attachments"
- File upload support for tasks
- Image preview functionality
- Document attachment management
- Storage integration

### [0.15.0] - TBD "Email Verification"
- Email confirmation on registration
- Resend verification email
- Password reset functionality
- Email service integration

### [0.16.0] - TBD "Dashboard Widgets"
- Clock/date widget with live time
- Upcoming events widget
- Task statistics widget with charts
- Calculator widget
- Drag-and-drop widget layout

### [0.17.0] - TBD "Header Navigation"
- Global search bar
- Notifications bell icon
- User menu dropdown
- Breadcrumb navigation

### [0.18.0] - TBD "Security Foundation"
- HTTPS enforcement
- CSRF protection
- XSS protection
- Rate limiting enhancements
- Audit logging
- Role-based access control (RBAC)

---

## Contributing

When adding features or fixes:

1. Update `VERSION.json` with version increment
2. Add entry to this CHANGELOG.md under appropriate section
3. Follow semantic versioning guidelines
4. Include breaking change notices when applicable
5. Update phase documentation in `specs/001-todo-app/tasks.md`
6. Create phase completion summary in `docs/phases/`
7. Update `TEST-INVENTORY.md` with new test counts

## Notes

- All dates use ISO 8601 format (YYYY-MM-DD)
- Version numbers follow [Semantic Versioning 2.0.0](https://semver.org/)
- Codenames are optional but recommended for major/minor releases
- Breaking changes are clearly marked in version metadata

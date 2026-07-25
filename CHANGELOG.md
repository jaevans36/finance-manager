# Changelog

All notable changes to Life Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version Format: `major.minor.patch`

- **Major (X.0.0)**: Breaking changes, major architecture changes, significant feature additions
- **Minor (0.X.0)**: New features, enhancements, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements, documentation updates

---

## [Unreleased]

### Added
- **Finance — Cash Flow tab** — new tab showing a single consolidated month picture: a "what's left this month" figure, an income → bills → budgets/pots → savings → safety buffer waterfall, a donut chart, and itemized breakdowns of committed bills, budgeted categories, spending pots (envelope and sinking fund), and active savings goals. Reuses the existing Affordability engine — no new backend endpoint.
- **Finance — AI Insights (Phase 48)** — Spending Velocity (daily burn pace, projected month-end overspend vs budget), Anomaly Detection (category spend spikes, new high-value merchants, potential duplicate charges), Subscription Auditor (recurring-subscription cost roundup with "possibly unused" flagging, reuses the existing recurring-payment detector), Negotiation Helper (generates a personalised negotiation script from a merchant's transaction history with copy-to-clipboard). New "AI Insights" tab on the Finance page; backend `GET /api/v1/finance/insights[/velocity|/anomalies|/subscriptions|/negotiation-script]` endpoints. Rule-based/statistical — no external AI API calls. Anomaly and subscription review actions are client-side only (no new database schema).
- **Finance — Multiple income streams** — the Debt tab's income entry now supports any number of named, separately-tracked income sources (e.g. "My salary", "Wife's salary") instead of a single manual figure; each stream can optionally link to an account, showing a "detected ~£X/mo from N transactions" suggestion (with the actual matched transactions listed) that can be accepted into the amount field. New `IncomeStreams` feature: `GET/POST/PUT/DELETE /api/v1/finance/income-streams`, `GET /api/v1/finance/income-streams/detect?accountId=`.
- **Finance — Planned savings & upcoming costs affect debt affordability** — active Savings Goals' monthly contributions and Sinking Fund pots' monthly allocations are now deducted alongside bills when calculating the Debt tab's safe surplus and recommended debt payment, so a goal like "washing machine, £50/mo" is no longer double-counted as also available for debt repayment. Shown as a new breakdown line on the Debt tab and a new pie slice on the Bills tab's "Pay vs bills" chart.
- **Finance — Sinking funds (T1303–T1306)** — new `SinkingFund` spending-pot type for smoothing recurring lumpy annual costs (car insurance, MOT, boiler service) into a monthly set-aside amount; tracks accumulated progress towards the annual target, shows months remaining until the next payment date, and auto-resets each cycle. `POST /api/v1/finance/pots/{id}/contribute` to set aside the month's allocation. New `PotForm` component — spending pots previously had no create/edit UI at all.
- **Finance — Savings goal contribution suggestions** — the Savings Goal form now suggests a monthly contribution (target amount ÷ months to target date) instead of requiring the user to calculate it themselves.
- **Finance — Budget suggestions** — the Budget form now suggests a starting monthly amount based on the category's actual spend over the last 3 months. `GET /api/v1/finance/budgets/suggested?categoryId=`.
- **Finance — Month-by-month debt burndown table** — the Debt tab's projection now shows a scrollable monthly table (month, total paid, remaining, milestone) alongside the existing balance chart, with a year-range filter and an optional per-debt payment breakdown. The projection engine now tracks the actual minimum + extra/cascade payment applied to each debt every month, not just the resulting balance — `DebtProjectionMonth` gains `Payments`, `TotalPaidThisMonth`, and `PaidOffThisMonth`. The table also calls out which debt is currently receiving the extra "focus" payment on top of its minimum, and the per-debt breakdown splits each cell into its minimum and extra portion (shown as "£X min + £Y extra" beneath the total, rather than a bare "+£Y" that read as additive on top of the total) plus that debt's own remaining balance for the month, so the impact of an overpayment is visible both as a summary and inline per month — not just as one aggregate "Remaining" total.
- **Finance — Bill/debt payment mismatch warning** — a Bill linked to a debt Account and the Account's own "current payment" field are both meant to represent the same real-world payment, but nothing previously stopped them drifting apart or being entered twice. The Bill form now warns inline when the entered amount disagrees with the linked account's payment (before you even save), and the Bills tab shows the same warning on any existing bill that's out of sync — soft warnings only, no auto-correction, since resolving which figure is right still needs a human judgement call.

### Fixed
- **Finance — Existing debt repayments could be double-counted, and mortgages/loans tracked only via a linked Bill were missing from the bucket entirely** — a debt can be tracked either via its Account's own payment fields or via a Bill linked to that account (`Bill.AccountId`); some debts use one, some the other, and a couple used both at once. `ExistingDebtPayments` now resolves one payment per debt with the same precedence the Debt tab already uses (current payment → linked bill → lender minimum), and any Bill linked to a debt account is excluded from `CommittedCosts` so it isn't counted twice. `DebtAccountSummary` gains `EffectiveMonthlyPayment` exposing this resolved figure, and `TotalCurrentPayments` on the Debt tab now uses it too (previously it missed the linked-bill case). The Cash Flow tab's itemized "Committed bills" and "Existing debt repayments" lists now use the same resolution, so they match the top-line figures.
- **Finance — waterfall breakdown rows on the Debt tab and Cash Flow tab said both "Less X" and "− £Y" for the same line** — dropped the redundant "Less " prefix; the minus sign already says it, and the labels now read identically to the itemized section titles below them.
- **Finance — Budgeted discretionary spend was floored to £0 whenever bills exceeded it** — `DiscretionarySpend` was computed as `(Budgets + Pots total) − CommittedCosts`, a pre-existing de-duplication attempt that only makes sense if a budget category genuinely overlaps a bill. In the ordinary case (e.g. a £400 Food budget vs a £4,182 bills total) it just zeroed the figure out, so the Cash Flow tab's top-line number silently disagreed with the itemized category list shown right below it. `DiscretionarySpend` is now simply the real Budget + Pot total, matching the itemized breakdown.
- **Finance — Existing debt repayments weren't counted anywhere in Affordability, and could be miscounted as discretionary spend** — mortgage/loan/credit-card minimum (or current) payments live on debt Accounts, not Bills, so they were invisible to the safe-surplus calculation entirely. Worse, when no Budgets or Spending Pots were configured, the fallback "estimate spend from transactions" calculation swept these same debt repayments up as ordinary discretionary spend (their transactions have no matching Bill record), sometimes producing wildly inflated discretionary-spend figures. `AffordabilityResponse` gains a new `ExistingDebtPayments` field, shown as its own line on both the Debt tab and the new Cash Flow tab; the fallback discretionary estimate now excludes it to avoid double-counting.
- **Finance — Regular Spending Pots weren't counted in safe surplus** — the Affordability calculation (used by both the Debt tab's suggested payment and the new Cash Flow tab) only ever counted Budgets and Sinking Fund pots toward discretionary spend; ordinary envelope-style Spending Pots (Groceries, Fuel, etc.) were invisible to it, overstating available surplus for anyone who budgets via Pots rather than Budgets. They're now summed alongside Budgets.
- **Finance — Debt snowball didn't retain momentum after a payoff** — once a debt cleared, its freed-up minimum payment only boosted the extra pool for the month it happened in, then quietly reverted to the flat configured "extra" amount every month after — so your total monthly debt-servicing spend actually shrank each time a card was paid off, instead of continuing to attack the next one at full strength. The freed minimum now permanently joins the extra pool for all future months (both Avalanche and Snowball), and the same-month cascade now dominoes through more than one payoff in a single month if the extra pool covers it (previously capped at one hop).
- **Finance — Debt payment fallback ignored a real lender minimum when "current payment" was explicitly 0** — `CurrentMonthlyPayment` and `MinimumMonthlyPayment` are separate fields, but the debt projection, overview totals, and strategy selector all used `CurrentMonthlyPayment ?? MinimumMonthlyPayment`, so an account with an explicit `0` current payment (as opposed to unset) silently overrode its real minimum instead of falling back to it. This showed up as a card's minimum vanishing from the burndown simulation and the *entire* extra/focus payment landing on it with no minimum alongside — now `CurrentMonthlyPayment` is only used when greater than zero.

### Breaking

- **Removed `PUT /api/v1/finance/affordability/income`** — replaced by the `IncomeStreams` CRUD endpoints above. Any existing single `ManualMonthlyIncome` value is auto-migrated into a stream named "My income" when the `AddIncomeStreams` migration runs.

---

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

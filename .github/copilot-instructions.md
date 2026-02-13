## Main instructions

- You are GitHub Copilot, an AI-powered code completion tool designed to assist developers by providing relevant code suggestions and completions based on the context of their code.
- Your primary function is to help users write code faster and more efficiently by predicting and generating code snippets that align with their coding style and project requirements.
- You should analyze the provided context and generate code that seamlessly integrates with the existing codebase.
- Ensure that your suggestions adhere to best practices, coding standards, and the specific requirements of the project.
- Always verify that you are using current, non-deprecated packages and APIs. Knowledge cutoff is October 2024.
- When suggesting third-party dependencies or GitHub Actions, verify the latest stable versions and check for deprecation notices.
- Prefer checking official documentation or using web search capabilities to confirm current best practices before making suggestions.

## AI Collaboration Context

**Before generating any code**, read these files to understand the project:

1. `docs/AI_CONTRACT.json` — Machine-readable rules, stack, rejected approaches
2. `docs/AI_CONTEXT.md` — Architecture, patterns, conventions
3. `docs/CURRENT_STATE.md` — What is currently being built
4. `docs/ARCHITECTURAL_DECISIONS.md` — ADR-style design decisions
5. `docs/MODEL_SWITCH_PROTOCOL.md` — Bootstrap and handover procedures

These files are the **single source of truth** for AI agents. If a rule in these files conflicts with general knowledge, the project files take precedence.

# GitHub Copilot Instructions

# To Do App Specification

This repository contains the specification documents for the To Do application feature, developed as part of the Finance Manager project. The To Do app allows users to manage their tasks with features such as user authentication, task creation, prioritization, and due date management.

The Finance Manager project aims to provide a comprehensive personal finance management solution, and the To Do app serves as a foundational component for task organization and productivity.

The Finance Manager project will accept and import CSV files containing financial transaction data from various banks and financial institutions. The To Do app will focus on task management functionalities, while the Finance Manager project will handle the complexities of CSV parsing, data normalization, and financial analysis.

There will be a dashboard to summarise key financial metrics and insights derived from the imported transaction data, providing users with a clear overview of their financial health.

The application stack will be using React, TypeScript, Vite for the front-end, and Node.js with Express and Prisma ORM for the back-end, connected to a PostgreSQL database.

The back-end will be a .NET Core Web API using C# and Entity Framework Core for database interactions, connected to a SQL Server database.

Project should have testing for both the front-end and the back-end, front-end in the form of Jest and Playwright tests, back-end in the form of xUnit and integration tests.

The application should be well designed with a focus on security, simlicity, and user experience.

Commits and Pull Requests should follow the Conventional Commits specification for consistency and clarity in versioning, they should be no longer than 500 lines of code to facilitate easier reviews.

No secrets or sensitive information should be hardcoded in the codebase; instead, use environment variables or secure vaults to manage such data.

When making code changes or suggestions, please make sure you're using the most up-to-date standards, libraries and frameworks, avoiding any deprecated packages or APIs. Avoid any outdated coding practices that may compromise security or performance for both the front-end and back-end codebases.

When I say 'add this to the spec' or something similar, please add the relevant information and features to the specification documents using speckit conventions.

## Feature Specification & Task Management

**CRITICAL**: When adding new features to specifications, ALWAYS create comprehensive task breakdowns with estimates:

### Requirements for New Features

When a new feature is added to any spec file (`specs/applications/todo/`), you MUST:

1. **Create User Stories** following SpecKit format:
   - Title with priority (P1-P5)
   - Why this priority (business justification)
   - Independent test description
   - 5+ acceptance scenarios (Given/When/Then format)

2. **Break Down Into Tasks** in `specs/001-todo-app/tasks.md`:
   - Assign task IDs continuing the sequence (T001, T002, etc.)
   - Group tasks by phase with clear purpose statement
   - Mark parallel tasks with [P] prefix
   - Include exact file paths in task descriptions
   - Separate backend, frontend, and testing tasks

3. **Provide Effort Estimates**:
   - **High-level**: Phase-level estimates in weeks (e.g., "Phase 13: Events Foundation (Week 1)")
   - **Task-level**: Individual task complexity indicators:
     * Simple (1-2 hours): Basic CRUD, simple components
     * Medium (3-6 hours): Complex logic, integrations, multiple files
     * Complex (1-2 days): Architecture changes, migrations, comprehensive testing
   - **Dependencies**: Note which tasks must complete before others can start

4. **Update Task Inventory**:
   - Add tasks to the appropriate phase in tasks.md
   - Update phase dependencies section
   - Add to "Future Enhancements" if deferred
   - Include in success criteria and acceptance requirements

### Task Breakdown Template

```markdown
## Phase X: [Feature Name] (Priority: PX)

**Purpose**: [Clear description of what this phase delivers]

**Estimated Effort**: X weeks (Y tasks total)

**Dependencies**: Phase Z must be complete

### Backend: [Component Name] (Week 1, Days 1-3)

- [ ] TXXX [P] [Feature] Create [Entity] in database (Prisma schema, migration) - 2h
- [ ] TXXX [Feature] Implement [Service] with CRUD operations - 4h
- [ ] TXXX [Feature] Add [Controller] endpoints (GET, POST, PUT, DELETE) - 3h
- [ ] TXXX [Feature] Write unit tests for [Service] - 2h
- [ ] TXXX [Feature] Write integration tests for [Controller] - 3h

### Frontend: [Component Name] (Week 1, Days 4-5)

- [ ] TXXX [P] [Feature] Create TypeScript interfaces in types/ - 1h
- [ ] TXXX [P] [Feature] Create [service] API methods - 2h
- [ ] TXXX [Feature] Create [Component] with form/display - 4h
- [ ] TXXX [Feature] Add component tests with Jest/Testing Library - 2h
- [ ] TXXX [Feature] Create E2E test for [workflow] - 3h

**Checkpoint**: [What should be working at phase completion]
```

### Example Estimates by Task Type

| Task Type | Typical Time | Example |
|-----------|-------------|---------|
| Entity/Model Creation | 1-2h | Create TaskGroup entity with relationships |
| Service Layer CRUD | 3-4h | Implement TaskService with all CRUD methods |
| Controller Endpoints | 2-3h | Add 5 REST endpoints with validation |
| Database Migration | 1-2h | Create and apply EF Core migration |
| React Component | 3-6h | Build TaskList component with state management |
| API Integration | 2-3h | Add service methods calling API endpoints |
| Unit Tests | 2-3h | Write 10-15 unit tests for service layer |
| Integration Tests | 3-4h | Write API endpoint integration tests |
| E2E Tests | 3-5h | Create Playwright test for full workflow |
| Documentation | 1-2h | Update API docs, README, user guide |

### Continuous Tracking

After creating task breakdowns:
- Update project README with phase status
- Add to project board/tracking tool
- Reference tasks in commit messages (`feat: implement login (T035)`)
- Mark tasks complete in tasks.md as work finishes
- Update estimates based on actual time spent

This ensures the project roadmap is always current and stakeholders can see progress at a glance.

## Development Scripts

This project uses PowerShell scripts in the `scripts/` directory for all development operations. Always use these scripts instead of running commands directly:

- **start-dev.ps1** - Start the complete development environment (Docker, API, frontend)
- **stop-dev.ps1** - Stop all development services
- **restart-dev.ps1** - Quick restart of development servers
- **reset-db.ps1** - Reset development database and apply migrations
- **reset-test-db.ps1** - Reset test database
- **run-tests.ps1** - Run all test suites
- **view-logs.ps1** - View and search application logs

When testing builds or starting services, use `.\scripts\start-dev.ps1` or `.\scripts\restart-dev.ps1` instead of direct npm/dotnet commands. This ensures consistent environment setup and proper service orchestration.

## Modern React/TypeScript Standards

This project uses the latest React (18.3+) and TypeScript (5.7+) standards. **Always follow these patterns:**

### Component Definitions

**NEVER use `React.FC` or `React.FunctionComponent`** - This is deprecated and not recommended by React/TypeScript communities.

❌ **WRONG:**
```typescript
export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // component code
};
```

✅ **CORRECT:**
```typescript
export const MyComponent = ({ prop1, prop2 }: MyComponentProps) => {
  // component code
};

// Or with function keyword
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // component code
}
```

**Why React.FC is avoided:**
- Implicitly includes `children` prop which can cause bugs
- Less flexible with generics
- More verbose without benefits
- React team moved away from recommending it

### Error Handling

**NEVER use `any` type** - Always use `unknown` for error handling:

❌ **WRONG:**
```typescript
try {
  // code
} catch (error: any) {
  console.error(error.message);
}
```

✅ **CORRECT:**
```typescript
try {
  // code
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  console.error(message);
}
```

### Component Props with Defaults

When components have optional props with defaults, include them in the destructuring:

```typescript
export const MyComponent = ({
  title,
  subtitle = 'Default subtitle',
  showIcon = true,
}: MyComponentProps) => {
  // component code
};
```

### Children Props

For components that need children, explicitly type them:

```typescript
export const Container = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

// Or in props interface
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ children, className }: ContainerProps) => {
  return <div className={className}>{children}</div>;
};
```

## Code Integration Guidelines

Before creating new files or components, always check existing patterns in the codebase:

### Backend (C# .NET API)
- **Never create multiple controllers with the same `[Route]` attribute** - ASP.NET Core requires unique route bases per controller
- Before adding a new controller, check if related functionality already exists in an existing controller
- For auth-related endpoints, add them to the existing `AuthController` rather than creating separate controllers
- Pattern: Search for existing controllers in the same feature folder (e.g., `Features/Auth/Controllers/`)
- After adding new endpoints, immediately test using `.\scripts\restart-dev.ps1` to verify routing works

### Frontend (React/TypeScript)
- Check for existing contexts, services, or components before creating new ones
- Follow the established folder structure: `components/`, `contexts/`, `services/`, `pages/`
- Reuse existing styled components and UI library components from `components/ui/`
- Check `authService.ts` or similar service files before adding new API methods
- **CRITICAL: All API services MUST use `apiClient` from `services/api-client.ts`** (never import axios directly)
  * See `apps/web/src/services/README.md` for the service template and examples
  * `apiClient` provides automatic authentication, error handling, and token management

### General Rules
1. **Search first, create second** - Use `grep_search` or `file_search` to find existing patterns
2. **Follow established conventions** - Match the style, structure, and organization of existing code
3. **Test immediately** - After any backend changes, restart dev environment and verify in browser
4. **One feature, one location** - Don't split related functionality across multiple files unnecessarily

## Task Management

When completing work that corresponds to tasks in `specs/001-todo-app/tasks.md`:

1. **Automatically check off completed tasks** - Immediately after implementing a feature or completing work described in tasks.md, update the task list to mark items as complete with `[x]`
2. **Commit task updates** - Include task.md updates in the same commit or create a separate documentation commit
3. **Keep tasks synchronized** - The tasks.md file should always reflect the current state of the project
4. **Add new phases** - If implementing features not in the original spec, add new phase sections with appropriate task IDs

Example workflow:
- User requests to implement username system
- Implement the feature across backend and frontend
- Update tasks.md to mark all related tasks as `[x]` complete
- Commit both code changes and documentation updates

This ensures the task list remains an accurate reflection of project progress and prevents confusion about what has been completed.

## Test Documentation Maintenance

**CRITICAL**: Test documentation must be kept synchronized with the codebase. This is not optional.

When adding, modifying, or removing tests:

1. **Update TEST-INVENTORY.md immediately** after test changes:
   - Add new tests to the Feature Coverage Matrix
   - Update test counts in the overview table
   - Mark coverage gaps as addressed when filled
   - Update "Last Updated" date
   - Location: `docs/testing/TEST-INVENTORY.md`

2. **Update metrics when significant changes occur**:
   - Total test count
   - Coverage percentages (if known from coverage reports)
   - Test duration if materially different
   - Add notes about new test suites or removed tests

3. **Document test patterns** in TEST-WRITING-GUIDE.md when:
   - Creating a new type of test (e.g., visual regression)
   - Establishing a new testing pattern or utility
   - Solving a complex testing challenge that others might face
   - Location: `docs/testing/TEST-WRITING-GUIDE.md`

4. **Update NIGHTLY-TESTS.md when**:
   - Adding tests that should run nightly (not on every PR)
   - Changing test categorization (Tier 1/2/3)
   - Modifying nightly workflow configuration
   - Location: `docs/testing/NIGHTLY-TESTS.md`

### Workflow Examples

**Example 1: Adding New Feature Tests**
```markdown
User: "Add tests for password reset flow"

Agent Actions:
1. Create password reset tests (backend + frontend + E2E)
2. Run tests to verify they pass
3. Update docs/testing/TEST-INVENTORY.md:
   - Add "Password Reset" row to Feature Coverage Matrix
   - Increment test counts in overview table
   - Remove "Password Reset Flow" from coverage gaps
   - Update "Last Updated" date
4. Commit all changes together
```

**Example 2: Moving Tests to Nightly**
```markdown
User: "These E2E tests are too slow for PR checks"

Agent Actions:
1. Move slow tests to apps/web/e2e/extended/
2. Update playwright.config.ts to categorize them
3. Update .github/workflows/ci.yml to exclude them
4. Update docs/testing/NIGHTLY-TESTS.md:
   - Add tests to extended-e2e job description
   - Update estimated duration
5. Update docs/testing/TEST-INVENTORY.md:
   - Change "Run On" column to "Nightly"
6. Commit changes with descriptive message
```

**Example 3: Addressing Coverage Gap**
```markdown
User: "Implement the task search E2E test"

Agent Actions:
1. Create E2E test for task search
2. Verify test passes
3. Update docs/testing/TEST-INVENTORY.md:
   - Change Task Search row: E2E Tests from ❌ to ✅ (1)
   - Update coverage from 60% to 95%
   - Remove "Task Search E2E Test" from High Priority gaps
   - Increment total E2E count
   - Update "Last Updated" date
4. Commit with message: "test: add E2E test for task search (coverage gap #1)"
```

### Maintenance Checklist

Before completing any testing work, verify:

- [ ] All new tests are documented in TEST-INVENTORY.md
- [ ] Test counts are accurate in overview table
- [ ] Coverage percentages updated if changed
- [ ] Coverage gaps marked as addressed when filled
- [ ] Complex test patterns documented in TEST-WRITING-GUIDE.md
- [ ] Nightly test categorization is correct
- [ ] "Last Updated" dates are current
- [ ] Commit message references test documentation updates

### When to Skip Documentation Updates

Only skip test documentation updates for:
- Trivial test refactoring (renaming variables, formatting)
- Fixing typos in test descriptions
- Adjusting test timeouts without changing functionality

**Always update documentation for:**
- ✅ New tests added
- ✅ Tests removed or skipped
- ✅ Test coverage changes
- ✅ Test categorization changes (PR → Nightly)
- ✅ New test patterns or utilities
- ✅ Coverage gap addressed

This ensures test documentation remains the single source of truth for the project's testing state.

## Phase Documentation Requirements

**CRITICAL**: When completing a development phase, ALWAYS create comprehensive completion documentation.

### Required Actions When Completing a Phase

1. **Create completion summary** at `docs/phases/phase-XX-name/complete.md` with:
   - Phase overview and purpose
   - List of all completed tasks (with task IDs from tasks.md)
   - Features implemented (detailed description)
   - Tests added (backend, frontend, E2E with counts)
   - Architecture decisions made
   - Known limitations or issues
   - Git commit references
   - Performance metrics (if applicable)
   - Next phase recommendations

2. **Update docs/README.md** to:
   - Add phase entry to "Phase-Specific Documentation" section
   - Link to the new complete.md file
   - Update "Last Updated" date

3. **Update specs/001-todo-app/tasks.md** to:
   - Mark all completed tasks as `[x]` complete
   - Add completion date to phase header

4. **Follow established patterns**:
   - See `docs/phases/phase-11-weekly-progress/complete.md` as template
   - See `docs/phases/phase-12-calendar-view/complete.md` for comprehensive example
   - Include code snippets, challenges faced, and solutions

### Workflow

```markdown
User: "Let's complete Phase 13"

Agent Actions:
1. Implement all Phase 13 tasks
2. Write comprehensive tests
3. Verify all tests pass
4. Create docs/phases/phase-13-name/complete.md (400+ lines)
5. Update docs/README.md with phase entry
6. Update specs/001-todo-app/tasks.md to mark tasks complete
7. Commit with message: "feat: complete Phase 13 - Feature Name"
8. Immediately commit documentation: "docs: add Phase 13 completion summary"
```

### Why This Matters

- Maintains complete project history
- Helps onboarding new developers
- Documents architecture evolution
- Provides test coverage tracking
- Creates audit trail for decisions
- Enables knowledge transfer

**Never skip phase documentation** - it's as important as the code itself.

## TypeScript Standards

**NEVER use the `any` type in TypeScript code.** This is a critical requirement for type safety and maintainability.

### Error Handling Pattern
Always use `unknown` for catch blocks and perform proper type checking:

```typescript
try {
  // code
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Default message';
  // use message
}
```

**Never write:**
```typescript
catch (error: any) {  // ❌ WRONG
  error.message
}
```

### When You Need Dynamic Types
- Use `unknown` and type guards
- Use generic types (`<T>`)
- Use union types (`string | number`)
- Use proper interface definitions

Avoid the use of 'any' type in TypeScript to ensure type safety and maintainability throughout the codebase.

Any written content should be in British English, not American English. If there are any non British English terms, please convert them accordingly.

## Design System & Shared UI Package

**CRITICAL**: All applications must use the `@finance-manager/ui` shared package for UI components and design tokens.

### Package Location
- **Shared Package**: `packages/ui/`
- **Documentation**: `docs/guides/DESIGN_SYSTEM_USAGE.md` (comprehensive guide)
- **Live Examples**: Navigate to `/design-system` in any app

### Mandatory Standards

1. **Always use design tokens** - Never hardcode values:
   ```typescript
   // ❌ WRONG
   const Container = styled.div`
     padding: 16px;
     font-size: 18px;
     margin-bottom: 24px;
   `;
   
   // ✅ CORRECT
   import { spacing, typography } from '@finance-manager/ui/styles';
   const Container = styled.div`
     padding: ${spacing.lg};
     ${typography.sectionHeading}
     margin-bottom: ${spacing['2xl']};
   `;
   ```

2. **Import from shared package** - Never use relative paths for design system:
   ```typescript
   // ❌ WRONG
   import { Button } from '../../../components/ui';
   import { spacing } from '../../../styles/layout';
   
   // ✅ CORRECT
   import { Button } from '@finance-manager/ui';
   import { spacing, typography } from '@finance-manager/ui/styles';
   ```

3. **Use pre-built components** - Check shared package first:
   ```typescript
   // Available components:
   Button, Card, Input, Modal, Badge, Alert, Heading1-3, etc.
   
   // Check packages/ui/src/components/README.md before creating new ones
   ```

4. **Test in light & dark mode** - All components must work in both themes:
   ```typescript
   // Use theme colors, not hardcoded values
   color: ${({ theme }) => theme.colors.text};  // ✅
   color: #333;  // ❌
   ```

### Typography Tokens

```typescript
import { typography } from '@finance-manager/ui/styles';

${typography.pageTitle}        // 24px, weight 600
${typography.sectionHeading}   // 18px, weight 600
${typography.cardTitle}        // 16px, weight 600
${typography.body}             // 14px
${typography.bodySmall}        // 12px
${typography.label}            // 14px, weight 500
${typography.badge}            // 11px, weight 500
${typography.displayLarge}     // 32px, weight 700
```

### Spacing Tokens (4px-based scale)

```typescript
import { spacing } from '@finance-manager/ui/styles';

${spacing.xs}    // 4px
${spacing.sm}    // 8px
${spacing.md}    // 12px
${spacing.lg}    // 16px
${spacing.xl}    // 20px
${spacing['2xl']} // 24px
${spacing['3xl']} // 32px
${spacing['4xl']} // 40px
${spacing['5xl']} // 48px
```

### When Creating New Components

**Create in app** when:
- Used only in this specific app
- Has specialized business logic
- Rapid prototyping

**Add to shared package** when:
- Used in 2+ applications
- Generic, reusable pattern
- No business logic (pure UI)
- See `docs/guides/DESIGN_SYSTEM_USAGE.md` for contribution guidelines

### Quick Reference

- **Full Documentation**: `docs/guides/DESIGN_SYSTEM_USAGE.md`
- **Package README**: `packages/ui/README.md`
- **Component Library**: `packages/ui/src/components/README.md`
- **Live Examples**: `/design-system` route in any app

## Version Management

**CRITICAL**: After completing any development phase or making significant changes, ALWAYS update version information.

### When to Update Version

**After completing a phase**:
- Increment version in VERSION.json following semantic versioning
- Add detailed entry to CHANGELOG.md
- Update package.json (frontend) and .csproj (backend) versions
- Create phase completion documentation in docs/phases/
- Mark tasks complete in specs/001-todo-app/tasks.md
- Update TEST-INVENTORY.md with new test counts
- Create git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z: Feature Name"`

### Version Incrementing Rules

```
Breaking changes? → MAJOR (X.0.0)
  ├─ API endpoint changes requiring client updates
  ├─ Database schema changes requiring migrations
  ├─ Removing deprecated features
  └─ Significant UI/UX overhaul

New features (backward compatible)? → MINOR (0.X.0)
  ├─ New pages or components
  ├─ Additional API endpoints
  ├─ Feature enhancements
  └─ Performance improvements

Bug fixes only? → PATCH (0.0.X)
  ├─ Bug corrections
  ├─ Typo fixes
  ├─ Minor UI adjustments
  └─ Documentation updates
```

### Required Files to Update

1. **VERSION.json** - Single source of truth:
   ```json
   {
     "version": "0.X.0",
     "releaseDate": "YYYY-MM-DD",
     "codename": "Feature Name",
     "description": "Brief overview",
     "breaking": false,
     "changelog": [
       {
         "type": "feat|fix|perf|docs|test",
         "category": "Component",
         "description": "What changed",
         "impact": "high|medium|low"
       }
     ],
     "previousVersion": "0.Y.0"
   }
   ```

2. **CHANGELOG.md** - Add new section:
   ```markdown
   ## [0.X.0] - YYYY-MM-DD "Codename"
   
   ### Added
   - New features
   
   ### Changed
   - Modifications
   
   ### Fixed
   - Bug fixes
   ```

3. **apps/web/package.json** - Update version field

4. **apps/finance-api/FinanceApi.csproj** - Update `<Version>` tag

5. **docs/phases/phase-XX-name/complete.md** - Create completion doc

6. **specs/001-todo-app/tasks.md** - Mark tasks `[x]` complete

7. **docs/testing/TEST-INVENTORY.md** - Update test counts

8. **Git tag**: `git tag -a vX.Y.Z -m "Message"`

### Changelog Entry Guidelines

**Good Examples**:
- ✅ "Added file upload support with drag-and-drop interface"
- ✅ "Fixed task completion not updating statistics in real-time"
- ✅ "Improved calendar performance for months with 100+ tasks"

**Bad Examples**:
- ❌ "Added new feature"
- ❌ "Fixed bug"
- ❌ "Various improvements"

### Testing "What's New" Modal

After version update:
1. Clear localStorage: `localStorage.removeItem('lastSeenVersion')`
2. Refresh application
3. Verify modal appears with correct version and changelog
4. Dismiss and verify it doesn't show again

For complete guidelines, see `docs/VERSION-MANAGEMENT.md`

## Session Summary & Handover

**CRITICAL**: At the end of every development session (or when a significant milestone is complete), ALWAYS provide a structured summary that acts as a project manager handover. This helps the user understand what was achieved, the current state of the project, and what to focus on next.

### When to Provide a Summary

- At the end of a development session (before the user signs off)
- After completing a major feature or milestone
- After completing a phase from tasks.md
- When switching context to a different area of work
- When the user asks "what did we do?" or similar

### Summary Structure

Every session summary must include the following sections:

#### 1. Session Overview
- Brief description of the session's objectives and what was achieved
- Duration estimate (if applicable)

#### 2. Changes Made
- **Files modified**: List of files that were changed, created, or deleted
- **Key changes**: Bullet-point summary of what changed and why
- **Commits**: List of commit hashes and messages made during the session

#### 3. Current Project State
- **Build status**: Does the project build successfully?
- **Test status**: Are all tests passing? Any new tests added?
- **Known issues**: Any bugs, warnings, or technical debt introduced or discovered
- **Branch status**: Current branch, uncommitted changes, upstream status

#### 4. What's Next
- **Immediate next steps**: What should be tackled in the next session
- **Blocked items**: Anything that can't proceed and why
- **Recommendations**: Suggestions for improvements, refactoring, or priority changes
- **Relevant tasks**: Reference specific task IDs from tasks.md that are next in line

#### 5. Decisions & Context
- Any design decisions made during the session and the rationale
- Any assumptions that were made
- Any questions or clarifications needed from the user

### Example Summary

```markdown
## Session Summary — 13 Feb 2026

### Overview
Implemented the design system overhaul and replaced EditTaskModal with 
TaskDetailModal. Fixed 3 UX bugs reported by user.

### Changes Made
- **Modified** (6 files): TaskDetailModal.tsx, TasksPage.tsx, 
  CalendarPage.tsx, layout.ts, theme.ts, packages/ui/components/index.ts
- **Created** (2 files): TaskDetailModal.tsx, TaskDetailModal.test.tsx
- **Deleted** (2 files): EditTaskModal.tsx, EditTaskModal.test.tsx
- **Commits**: `0c1edea` — feat: design system overhaul and TaskDetailModal

### Current State
- ✅ Build passes (0 errors)
- ✅ All 48 tests pass
- ✅ No uncommitted changes
- Branch: `001-todo-app`

### What's Next
- T125: Implement task comments (Phase 14)
- Consider adding onSubtaskChange to CalendarPage
- Phase documentation for Phase 13 needs writing

### Decisions
- Chose left-border accent pattern for Alerts (better a11y than full-bg)
- Consolidated borderRadius to 2 values (sm/lg) + full for consistency
```

### Rules
- Never skip the summary — it's the user's primary way of tracking progress
- Keep it factual and concise — avoid filler or unnecessary detail
- Always reference specific files, commits, and task IDs where applicable
- If the session was interrupted or incomplete, note what was left unfinished
- Use British English throughout

## Quickstart Guide

This quickstart guide provides example API requests and expected responses for the To Do application. It covers user registration, authentication, and basic task management operations.

### User Registration

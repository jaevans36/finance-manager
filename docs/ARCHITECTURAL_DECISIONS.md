# Architectural Decisions Record

> **Last Updated**: 2026-02-25  
> **Format**: ADR (Architecture Decision Record)  
> **Scope**: All decisions affecting structure, patterns, or technology choices

---

## ADR-001: Monorepo with pnpm Workspaces

**Date**: 2025-11  
**Status**: Active

### Context
The platform will have multiple frontend apps, shared packages, and a backend API. Code sharing (types, UI components, validation) must be frictionless.

### Decision
Use a pnpm monorepo with workspace protocol. Structure: `apps/*` for deployable services, `packages/*` for shared libraries.

### Consequences
- (+) Single repository for all code, shared CI, atomic commits
- (+) Workspace protocol (`workspace:*`) for local package linking
- (-) pnpm-specific — contributors must use pnpm, not npm/yarn
- (-) Build ordering requires awareness of package dependencies

---

## ADR-002: .NET 8.0 Backend with Feature-Based Folders

**Date**: 2025-11  
**Status**: Active

### Context
Backend needs structured API with authentication, authorisation, and database access. Team has C# experience.

### Decision
Use .NET 8.0 Web API with feature-based folder structure (`Features/{Feature}/Controllers|Services|DTOs|Models/`). Entity Framework Core with PostgreSQL.

### Consequences
- (+) Feature cohesion — related code co-located
- (+) Easy to extract into microservices later (each feature is self-contained)
- (-) Cross-feature dependencies require careful management
- (-) Feature folders diverge from default .NET project templates

---

## ADR-003: React + TypeScript + Vite Frontend

**Date**: 2025-11  
**Status**: Active

### Context
Need a modern, fast frontend with type safety and good developer experience.

### Decision
React 18 with TypeScript 5, Vite for build tooling. Lazy-loaded routes, styled-components for CSS-in-JS.

### Consequences
- (+) Fast HMR with Vite, strong typing with TypeScript
- (+) Lazy loading improves initial bundle size
- (-) styled-components has runtime cost vs. CSS Modules
- (-) Vite config requires manual chunk splitting for optimal bundles

---

## ADR-004: styled-components over CSS Modules

**Date**: 2025-11  
**Status**: Superseded by ADR-016  
**Superseded**: 2026-02-25

### Context
Need a styling solution that supports theming (light/dark), design tokens, and component-scoped styles.

### Decision
Use styled-components v6 with ThemeProvider. Design tokens defined in `layout.ts` and `theme.ts`. All colours accessed via `theme.colors.*`.

### Consequences
- (+) Full runtime theming with light/dark mode toggle
- (+) Design tokens enforced through imports, not magic strings
- (+) Component-scoped — no class name conflicts
- (-) Runtime CSS generation increases bundle size (~12KB gzipped)
- (-) SSR requires additional configuration (not currently needed)

### Rejected Alternative
CSS Modules — would require separate theme switching mechanism and lose runtime theme injection.

---

## ADR-005: Centralised API Client

**Date**: 2025-12  
**Status**: Active — Non-negotiable

### Context
Multiple service files make HTTP calls. Token attachment, error handling, and base URL must be consistent.

### Decision
Single `apiClient` Axios instance in `services/api-client.ts`. Request interceptor attaches JWT. Response interceptor maps errors and handles 401 redirect. All service files import `apiClient` — never raw `axios`.

### Consequences
- (+) Single point for auth token management
- (+) Consistent error handling across all API calls
- (+) Easy to add request/response logging
- (-) Tight coupling to Axios — migration to `fetch` would require service layer changes

### Rejected Alternative
Direct `axios` imports per service file — led to inconsistent auth handling and duplicated error logic.

---

## ADR-006: Interface-Based Dependency Injection (Backend)

**Date**: 2025-11  
**Status**: Active

### Context
Services need to be testable with mocks. Controllers should not depend on concrete implementations.

### Decision
Define `IService` interface for each service. Register all as `AddScoped<IService, Service>()` in `Program.cs`. Controllers inject interfaces only.

### Consequences
- (+) Full testability with Moq
- (+) Easy to swap implementations
- (+) Clear contracts between layers
- (-) Boilerplate: interface + implementation for every service

---

## ADR-007: JWT Bearer Authentication (Symmetric)

**Date**: 2025-11  
**Status**: Active — Planned migration to RS256/JWKS in Phase 22-24

### Context
Need stateless authentication for SPA. Simple setup required for MVP.

### Decision
HS256 JWT with symmetric key stored in `appsettings.json` (dev) or environment variable (prod). 1-hour token expiry. Token stored in `localStorage` on frontend.

### Consequences
- (+) Simple implementation, no external auth provider needed
- (-) Symmetric key must be shared if multiple services validate tokens
- (-) `localStorage` vulnerable to XSS (mitigated by CSP headers)
- (-) No token refresh mechanism — user must re-login after 1 hour

### Planned Migration
Phase 22-24: Extract to standalone auth service with RS256 asymmetric keys, JWKS endpoint, refresh tokens, OAuth 2.0 providers, and MFA.

---

## ADR-008: PostgreSQL as Primary Database

**Date**: 2025-11  
**Status**: Active

### Context
Need a relational database with JSON support, good EF Core integration, and free hosting options.

### Decision
PostgreSQL 15 (Alpine) via Docker Compose for development. Single database for all features.

### Consequences
- (+) Excellent EF Core support via Npgsql
- (+) JSONB columns available for flexible schemas
- (+) Free, open source, excellent performance
- (-) Single database becomes bottleneck in microservices (planned split in Phase 25-27)

---

## ADR-009: Design System as Shared Package

**Date**: 2026-01  
**Status**: Active — Partially migrated

### Context
Multiple applications will share UI patterns. Need consistent design tokens, components, and themes.

### Decision
Create `@life-manager/ui` package in `packages/ui/`. Export design tokens (`spacing`, `typography`, `borderRadius`, `shadows`, `transitions`), themes (`lightTheme`, `darkTheme`), and reusable components. All apps import from this package.

### Consequences
- (+) Single source of truth for design decisions
- (+) WCAG AAA contrast ratios enforced in theme definition
- (+) New apps get consistent look immediately
- (-) Migration from app-level styles to shared package is incremental
- (-) Changes to shared package affect all apps

### Current State
Tokens and themes are in the shared package. Most components still live in `apps/web/src/components/ui/`. Migration ongoing.

---

## ADR-010: SpecKit Specification Convention

**Date**: 2026-01  
**Status**: Active

### Context
Need structured specifications for features that can be tracked, estimated, and implemented consistently. AI agents must be able to parse and follow them.

### Decision
Custom SpecKit format: user stories with P1-P5 priorities, Given/When/Then acceptance scenarios, task breakdowns with sequential IDs (`T001-Tnnn`), phase grouping, and hour estimates. Specs stored in `specs/` with platform/application split.

### Consequences
- (+) AI agents can deterministically find and follow specifications
- (+) Task IDs in commits create traceability
- (+) Effort estimates enable project planning
- (-) Manual maintenance required to keep specs synchronised with code

---

## ADR-011: Lucide React for Icons (No Emoji)

**Date**: 2026-02  
**Status**: Active — Non-negotiable

### Context
Emoji render differently across OS/browser combinations. Need consistent, accessible, themeable icons.

### Decision
Use `lucide-react` for all icons. No emoji characters in UI components. Icons must use `currentColor` for theme compatibility.

### Consequences
- (+) Consistent rendering across platforms
- (+) Icons respect theme colours
- (+) Tree-shakeable — only imported icons are bundled
- (-) Requires finding appropriate icon for each use case

### Rejected Alternative
Emoji characters — caused inconsistent rendering on Windows vs macOS, poor accessibility, not themeable.

---

## ADR-012: No `React.FC` — Direct Props Typing

**Date**: 2026-02  
**Status**: Active — Non-negotiable

### Context
`React.FC` implicitly includes `children` prop and is no longer recommended by the React team.

### Decision
All components use direct props destructuring: `export const Component = ({ prop }: Props) => {}`. Never `React.FC<Props>`.

### Consequences
- (+) Explicit children handling — no accidental children acceptance
- (+) Better generic type inference
- (+) Aligns with React team recommendations
- (-) Slightly more verbose for components that do need children (must add `children: React.ReactNode`)

---

## ADR-013: No `any` Type in TypeScript

**Date**: 2026-02  
**Status**: Active — Non-negotiable

### Context
`any` bypasses TypeScript's type system, hiding bugs and reducing IDE assistance.

### Decision
Never use `any`. Use `unknown` for catch blocks with type guards. Use generics, union types, or proper interfaces for dynamic types.

### Consequences
- (+) Full type safety throughout codebase
- (+) Better IDE autocompletion and error detection
- (-) More verbose error handling (requires `instanceof` checks)
- (-) Occasional complexity when wrapping untyped third-party APIs

---

## ADR-014: British English Throughout

**Date**: 2025-11  
**Status**: Active — Non-negotiable

### Context
Project owner is UK-based. Consistency in language across code, comments, documentation, and UI text.

### Decision
All written content in British English: "colour" not "color" (in docs/comments/UI — CSS/code identifiers follow library conventions), "organisation" not "organization", "favourite" not "favorite".

### Consequences
- (+) Consistent language across all project artefacts
- (-) Must be vigilant with AI-generated content which defaults to American English
- Note: CSS properties, library APIs, and code identifiers use their standard (American) spelling

---

## ADR-015: PowerShell Dev Scripts

**Date**: 2025-12  
**Status**: Active

### Context
Development environment requires starting Docker, API, frontend, and managing databases. Manual commands are error-prone.

### Decision
PowerShell scripts in `scripts/` directory for all development operations. Always use scripts instead of direct `npm`/`dotnet` commands.

### Consequences
- (+) Consistent environment setup across sessions
- (+) Proper service orchestration (Docker → API → Frontend)
- (-) Windows-specific (PowerShell Core available on macOS/Linux but scripts not tested)

---

## ADR-016: Tailwind CSS + shadcn/ui Replacing styled-components

**Date**: 2026-02-25  
**Status**: Accepted (implementation pending Phase 48-53)  
**Supersedes**: ADR-004

### Context
styled-components generates CSS at runtime, adding ~12KB gzipped to the bundle and increasing TTI. 62 files import styled-components. Theme-aware styles require verbose `${({ theme }) => theme.colors.*}` boilerplate. The shared `@life-manager/ui` package is tightly coupled to styled-components, making it difficult to use in non-React contexts.

### Decision
Replace styled-components with Tailwind CSS (utility-first, build-time CSS) and shadcn/ui (accessible component primitives based on Radix UI). Design tokens move from JS objects to CSS variables. Dark mode switches from JavaScript ThemeProvider to CSS class strategy (`dark:` variants).

### Migration Strategy
1. Phase 48: Install Tailwind + shadcn alongside styled-components (co-existence)
2. Phase 51-52: Migrate all pages file-by-file
3. Phase 53: Remove styled-components entirely

### Consequences
- (+) Zero-runtime CSS — styles compiled at build time
- (+) Smaller bundle — Tailwind purges unused CSS
- (+) shadcn gives component ownership (copy-paste, not dependency)
- (+) Accessible by default — Radix UI primitives handle ARIA, focus, keyboard
- (+) CSS variables for theming — simpler than JS theme objects
- (-) Co-existence period increases complexity temporarily
- (-) 62 files must be migrated (~9 weeks total effort)
- (-) Team must learn Tailwind utility class conventions

### Rejected Alternatives
- **CSS Modules**: Same limitation as ADR-004 — no runtime theme injection (though CSS variables could solve this now)
- **Emotion**: Same runtime CSS-in-JS problems as styled-components
- **MUI / Ant Design**: Heavy runtime, dependency lock-in, poor tree-shaking
- **Big-bang migration**: Too risky — phased migration with co-existence is safer

---

## ADR-017: TanStack Query for Server State Management

**Date**: 2026-02-25  
**Status**: Accepted (implementation pending Phase 49)

### Context
Every page uses `useState` + `useEffect` for data fetching, resulting in ~15 lines of boilerplate per data source (loading state, error state, data state, fetch function, useEffect). No caching exists — navigating between pages re-fetches all data. No optimistic updates — mutations require full page refreshes to see results.

### Decision
Adopt TanStack Query v5 for all server state management. Create custom hooks per domain (useTasks, useEvents, etc.) with centralised query keys. Add optimistic updates for common mutations (task completion, creation).

### Consequences
- (+) Automatic caching — revisiting a page shows cached data instantly
- (+) Background refetching — data stays fresh without manual triggers
- (+) Request deduplication — multiple components using same data make one request
- (+) Optimistic updates — UI responds instantly to user actions
- (+) DevTools for debugging cache state
- (-) Learning curve — query keys, stale time, cache invalidation patterns
- (-) Existing pages must be migrated to use hooks instead of direct service calls

### Rejected Alternatives
- **SWR**: Less feature-rich than TanStack Query, smaller ecosystem
- **Redux Toolkit Query**: Would require Redux, unnecessary complexity for this project
- **Hand-rolled cache** (existing `queryCache.ts`): Only 98 lines, no background refetch, no optimistic updates, no devtools

---

## ADR-018: React Hook Form + Zod for Form Handling

**Date**: 2026-02-25  
**Status**: Accepted (implementation pending Phase 50)

### Context
Forms use `useState` for each field, manual validation in `onSubmit`, and inconsistent patterns across components. Validation rules exist only in the frontend — no shared schemas with the backend. The `@life-manager/schema` package exists but is underutilised.

### Decision
Adopt React Hook Form (RHF) with `@hookform/resolvers` for Zod integration. Define validation schemas in `@life-manager/schema` and share them with the frontend via the Zod resolver. shadcn/ui form components are built for RHF.

### Consequences
- (+) Shared validation schemas between frontend and backend
- (+) Type-safe forms — `z.infer<>` derives types from schemas
- (+) Reduced re-renders — RHF uses uncontrolled inputs by default
- (+) shadcn/ui Form component designed specifically for RHF
- (-) Migration effort for existing forms (~8 forms)
- (-) Zod schemas must be maintained in sync with backend DTOs

### Rejected Alternatives
- **TanStack Form**: Less mature, smaller ecosystem, fewer resources, shadcn not built for it
- **Formik**: Older, larger bundle, less ergonomic than RHF
- **Manual useState**: Current approach — boilerplate-heavy, no schema validation

---

## ADR-019: TanStack Table for Data-Heavy Pages

**Date**: 2026-02-25  
**Status**: Accepted (implementation pending Phase 54)

### Context
The User Management page renders a data table with sorting and filtering using custom implementations. Future pages (finance transactions, admin audit logs) will need similar capabilities.

### Decision
Adopt TanStack Table v8 as a headless table library, rendering through shadcn Table component. Create a reusable `DataTable` component that encapsulates sorting, filtering, and pagination.

### Consequences
- (+) Headless — full control over rendering with shadcn/Tailwind
- (+) Reusable DataTable pattern for all data-heavy pages
- (+) Server-side pagination support built-in
- (-) Only benefits a few pages currently — adoption is narrow

### Rejected Alternatives
- **AG Grid**: Commercial licence, heavy bundle, opinionated rendering
- **React Table (v7)**: Superseded by TanStack Table v8
- **Custom implementation**: Current approach — limited features, must be rebuilt per table

---

## ADR-020: Modified GitFlow Branching Strategy

**Date**: 2026-02-26
**Status**: Accepted

### Context
All development was being done on a single `001-todo-app` branch across multiple phases. This made it impossible to isolate individual phases, roll back a single phase without affecting others, or maintain a clean release history. With 54 phases planned, the project needed a structured branching model that aligns with our semantic versioning and conventional commits practices.

### Decision
Adopt a modified GitFlow model with three branch types:
- `main` — stable releases, tagged with semver
- `develop` — integration branch for completed phases
- `phase-XX/description` — individual phase work, branched from develop

Phase branches are squash-merged into `develop` via PR. Releases merge `develop` into `main` with a version tag. Large phases (>500 LOC) are split into multiple sequential PRs.

Full details in `docs/BRANCHING-STRATEGY.md`.

### Consequences
- (+) Each phase is isolated and can be reviewed independently
- (+) Clean merge history with squash commits
- (+) Aligns with semver — each release is a clear point-in-time
- (+) `main` is always stable and deployable
- (+) Large phases naturally split into reviewable PRs
- (-) Minor overhead creating branches and PRs per phase
- (-) Requires rebasing phase branches if `develop` advances

### Rejected Alternatives
- **Single feature branch**: Current approach — no isolation, no rollback capability
- **Phase branches from main (no develop)**: Simpler, but no integration testing point before release
- **Trunk-based development**: Too risky without comprehensive CI/CD and feature flags

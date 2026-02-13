# Architectural Decisions Record

> **Last Updated**: 2026-02-13  
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
**Status**: Active

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
Create `@finance-manager/ui` package in `packages/ui/`. Export design tokens (`spacing`, `typography`, `borderRadius`, `shadows`, `transitions`), themes (`lightTheme`, `darkTheme`), and reusable components. All apps import from this package.

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

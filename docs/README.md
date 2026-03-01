# Documentation Index

**Finance Manager** - Comprehensive documentation for developers, testers, and maintainers.

---

## 🚀 Getting Started (New Developers)

Start here if you're new to the project:

1. **[README.md](../README.md)** - Project overview, tech stack, current status
2. **[QUICKSTART.md](../QUICKSTART.md)** - Setup instructions, daily workflow
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - High-level architecture, design decisions
4. **[development/pages-structure.md](development/pages-structure.md)** - Frontend organisation

**Estimated Time**: 30 minutes to read, 15 minutes to setup

---

## 📐 Architecture & Design

### Core Architecture
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete architectural overview
  - Technology stack
  - Feature-based organisation (why and how)
  - Project structure
  - Development workflow
  - Testing strategy
  - Deployment architecture
  - Architectural Decision Records (ADRs)

### Frontend Structure
- **[development/pages-structure.md](development/pages-structure.md)** - Frontend organisation guide
  - Feature-based folder structure
  - When to create component subfolders
  - Naming conventions
  - Migration guide from flat to feature-based structure
  - Common patterns and best practices

### Platform Specifications
- **[specs/platform/architecture.md](../specs/platform/architecture.md)** - Platform-level architecture
- **[specs/platform/authentication.md](../specs/platform/authentication.md)** - Auth system design
- **[specs/platform/design-guidelines.md](../specs/platform/design-guidelines.md)** - UI/UX guidelines

---

## 🧪 Testing

### Test Documentation
- **[testing/README.md](testing/README.md)** - Testing overview
- **[testing/TEST-INVENTORY.md](testing/TEST-INVENTORY.md)** - What's tested, coverage gaps
- **[testing/TEST-WRITING-GUIDE.md](testing/TEST-WRITING-GUIDE.md)** - How to write tests
- **[testing/NIGHTLY-TESTS.md](testing/NIGHTLY-TESTS.md)** - Extended test suite

### Test Locations
| Type | Location | Command |
|------|----------|---------|
| Backend Unit | `apps/finance-api-tests/FinanceApi.UnitTests/` | `dotnet test` |
| Frontend Unit | `apps/web/tests/` | `pnpm test` |
| Integration | `apps/web/tests/integration/` | `pnpm test:integration` |
| E2E | `apps/web/e2e/` | `pnpm test:e2e` |
| All Tests | Project root | `.\scripts\run-tests.ps1` |

**Current Status**: 303 tests, 100% pass rate

---

## 🔧 Development

### Scripts & Workflow
- **[scripts/README.md](../scripts/README.md)** - PowerShell development scripts
  - `start-dev.ps1` - Full startup
  - `restart-dev.ps1` - Quick restart
  - `stop-dev.ps1` - Stop all services
  - `reset-db.ps1` - Reset database
  - `run-tests.ps1` - Run all tests
  - `view-logs.ps1` - View logs

### Phase Documentation

All completed phases now have dedicated documentation folders:

**Phases 1-10: Core Todo Application**
- **[phases/phases-01-10-core-app/complete.md](phases/phases-01-10-core-app/complete.md)** - Complete core app (Setup through Username System)

**V2 Security Enhancements**
- **[phases/phase-v2-security/complete.md](phases/phase-v2-security/complete.md)** - Implementation summary
- **[phases/phase-v2-security/progress.md](phases/phase-v2-security/progress.md)** - Progress tracking
- **[phases/phase-v2-security/session-management.md](phases/phase-v2-security/session-management.md)** - Session details
- **[phases/phase-v2-security/test-results.md](phases/phase-v2-security/test-results.md)** - Test results
- **[phases/phase-v2-security/testing-guide.md](phases/phase-v2-security/testing-guide.md)** - Testing guide

**Phase 11: Weekly Progress Dashboard**
- **[phases/phase-11-weekly-progress/complete.md](phases/phase-11-weekly-progress/complete.md)** - Implementation summary

**Phase 12: Calendar View**
- **[phases/phase-12-calendar-view/complete.md](phases/phase-12-calendar-view/complete.md)** - Implementation summary

**Phase 13: Events Foundation**
- **[phases/phase-13-events/complete.md](phases/phase-13-events/complete.md)** - Implementation summary (v0.13.0)

### Development Guides
- **[development/pages-structure.md](development/pages-structure.md)** - Frontend structure guide
- **[development/TESTING_COMPLETE.md](development/TESTING_COMPLETE.md)** - Testing completion status
- **[development/design-system-audit.md](development/design-system-audit.md)** - Design system review

---

## 🔌 API Documentation

### API References
- **[api/routes-phase1.md](api/routes-phase1.md)** - Phase 1 API endpoints
- **[api/swagger.md](api/swagger.md)** - Swagger/OpenAPI setup
- **[api/](api/)** - Additional API documentation

### Service Documentation
- **[apps/web/src/services/README.md](../apps/web/src/services/README.md)** - Service patterns

---

## 🚀 Deployment & Operations

### Environments & Release Process
- **[guides/ENVIRONMENTS_AND_RELEASES.md](guides/ENVIRONMENTS_AND_RELEASES.md)** - **📘 Single source of truth** for environment strategy (Dev/UAT/Production), database management, release process, quality gates, rollback procedures, and go-live checklist
- **[guides/LAN_DEPLOYMENT.md](guides/LAN_DEPLOYMENT.md)** - Step-by-step UAT setup guide (Caddy, custom hostname, firewall)
- **[Production Deployment Spec](../specs/platform/production-deployment.md)** - Phase 25: production infrastructure and security hardening

### CI/CD
- **[operations/CI-CD.md](operations/CI-CD.md)** - Continuous integration setup
- GitHub Actions workflows in `.github/workflows/`

### Branching & Versioning
- **[BRANCHING-STRATEGY.md](BRANCHING-STRATEGY.md)** - Modified GitFlow with phase branches
- **[VERSION-MANAGEMENT.md](VERSION-MANAGEMENT.md)** - Semantic versioning and changelog

### Logging & Monitoring
- **[operations/LOGGING.md](operations/LOGGING.md)** - Logging strategy
- **[operations/error-logging-monitoring.md](operations/error-logging-monitoring.md)** - Error tracking
- **[view-logs.ps1](../scripts/view-logs.ps1)** - Log viewing script

### Email Configuration
- **[operations/EMAIL-SETUP.md](operations/EMAIL-SETUP.md)** - Email service setup

---

## 📋 Feature Specifications

### Current Feature: Todo App
- **[specs/001-todo-app/tasks.md](../specs/001-todo-app/tasks.md)** - Task list (Phases 1-12)
- **[specs/applications/todo/enhancements.md](../specs/applications/todo/enhancements.md)** - Phase 5 enhancements

### Deprecated Specs
- **[specs/001-todo-app.deprecated/](../specs/001-todo-app.deprecated/)** - Historical reference

---

## 🎨 Design & UI

### Design System & Shared UI Package
- **[guides/DESIGN_SYSTEM_USAGE.md](guides/DESIGN_SYSTEM_USAGE.md)** - **📘 Complete guide** for using `@finance-manager/ui`
- **[packages/ui/README.md](../packages/ui/README.md)** - Package documentation
- **[packages/ui/src/components/README.md](../packages/ui/src/components/README.md)** - Component library reference
- **Live Examples** - Navigate to `/design-system` in any app

### Theme System
- **[guides/THEME_IMPLEMENTATION.md](guides/THEME_IMPLEMENTATION.md)** - Theme implementation details
- **[guides/THEME_MANAGEMENT.md](guides/THEME_MANAGEMENT.md)** - Theme management guide
- **[guides/ICON_GUIDE.md](guides/ICON_GUIDE.md)** - Icon usage with Lucide React

### Historical Reference
- **[reference/design-system-summary.md](reference/design-system-summary.md)** - Original design system (deprecated paths)
- **[development/design-system-audit.md](development/design-system-audit.md)** - Design system migration audit

---

## 🗂️ Reference Documentation

### Technical Reference
- **[reference/validation-checklist.md](reference/validation-checklist.md)** - Pre-release checklist
- **[reference/performance-optimizations.md](reference/performance-optimizations.md)** - Performance improvements
- **[reference/security-audit.md](reference/security-audit.md)** - Security review
- **[reference/v2-implementation-summary.md](reference/v2-implementation-summary.md)** - v2.0 summary
- **[reference/PRISMA-CLIENT-FIX.md](reference/PRISMA-CLIENT-FIX.md)** - Historical fixes
---

## 📖 Documentation Maintenance

### When to Update Documentation

**Always update documentation when**:
- ✅ Architectural changes (structure, patterns, tech stack)
- ✅ New features added (specs, API docs, guides)
- ✅ Testing changes (new tests, coverage updates)
- ✅ File/folder moves (update paths throughout docs)
- ✅ Workflow changes (scripts, CI/CD, deployment)

**Commit documentation WITH code changes**, not separately.

### Key Documents to Keep Current

| Document | Update When |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Major architectural changes, ADRs |
| [pages-structure.md](development/pages-structure.md) | Frontend st
| [phases/phase-XX/complete.md](phases/) | When phase is completed |ructure changes |
| [TEST-INVENTORY.md](testing/TEST-INVENTORY.md) | Tests added/removed/modified |
| [tasks.md](../specs/001-todo-app/tasks.md) | Task completion status |
| [README.md](../README.md) | Project status, tech stack, features |

### Documentation Standards

- Use British English spelling
- Follow Markdown best practices
- Include "Last Updated" dates
- Link between related documents
- Keep examples up-to-date with actual code
- Use tables for structured data
- Include code examples where helpful

---

## 📞 Quick Links

### Daily Development
- [Start Development](../scripts/start-dev.ps1)
- [Run Tests](../scripts/run-tests.ps1)
- [View Logs](../scripts/view-logs.ps1)
- [Swagger UI](http://localhost:5000/swagger)

### Code Locations
- Backend: `apps/finance-api/Features/`
- Frontend Pages: `apps/web/src/pages/`
- Tests: `apps/web/tests/` and `apps/finance-api-tests/`
- Specs: `specs/001-todo-app/`

### External Resources
- [React Documentation](https://react.dev/)
- [.NET Documentation](https://learn.microsoft.com/en-us/dotnet/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: 2026-03-01  
**Maintained By**: Development Team

For questions or suggestions about documentation, please discuss in team meetings or create issues in the repository.

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

**Current Status**: 235 tests, 100% pass rate

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
- **[phase1-complete.md](phase1-complete.md)** - Phase 1 implementation summary
- **[phase1-progress.md](phase1-progress.md)** - Phase 1 progress tracking
- **[phase1-session-management.md](phase1-session-management.md)** - Session management details
- **[phase1-test-results.md](phase1-test-results.md)** - Phase 1 test results

### Development Guides
- **[development/TESTING_COMPLETE.md](development/TESTING_COMPLETE.md)** - Testing completion status
- **[development/design-system-audit.md](development/design-system-audit.md)** - Design system review

---

## 🔌 API Documentation

### API References
- **[api-phase1-routes.md](api-phase1-routes.md)** - Phase 1 API endpoints
- **[swagger-documentation.md](swagger-documentation.md)** - Swagger/OpenAPI setup
- **[api/](api/)** - Detailed API documentation (if exists)

### Service Documentation
- **[apps/web/src/services/README.md](../apps/web/src/services/README.md)** - Service patterns

---

## 🚀 Deployment & Operations

### CI/CD
- **[CI-CD.md](CI-CD.md)** - Continuous integration setup
- GitHub Actions workflows in `.github/workflows/`

### Logging & Monitoring
- **[LOGGING.md](LOGGING.md)** - Logging strategy
- **[error-logging-monitoring.md](error-logging-monitoring.md)** - Error tracking
- **[view-logs.ps1](../scripts/view-logs.ps1)** - Log viewing script

### Security & Performance
- **[security-audit.md](security-audit.md)** - Security review
- **[performance-optimizations.md](performance-optimizations.md)** - Performance improvements

### Deployment Plans
- **[specs/applications/todo/enhancements.md](../specs/applications/todo/enhancements.md)** - Phase 5: Deployment specs

---

## 📋 Feature Specifications

### Current Feature: Todo App
- **[specs/001-todo-app/tasks.md](../specs/001-todo-app/tasks.md)** - Task list (Phases 1-12)
- **[specs/applications/todo/enhancements.md](../specs/applications/todo/enhancements.md)** - Phase 5 enhancements

### Deprecated Specs
- **[specs/001-todo-app.deprecated/](../specs/001-todo-app.deprecated/)** - Historical reference

---

## 🎨 Design & UI

### Design System
- **[design-system-summary.md](design-system-summary.md)** - Design system overview
- **[guides/THEME_IMPLEMENTATION.md](guides/THEME_IMPLEMENTATION.md)** - Theme implementation
- **[guides/THEME_MANAGEMENT.md](guides/THEME_MANAGEMENT.md)** - Theme management
- **[guides/ICON_GUIDE.md](guides/ICON_GUIDE.md)** - Icon usage guide

---

## 🗂️ Reference Checklists

### Validation & QA
- **[validation-checklist.md](validation-checklist.md)** - Pre-release checklist
- **[phase1-testing-guide.md](phase1-testing-guide.md)** - Phase 1 testing guide

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
| [pages-structure.md](development/pages-structure.md) | Frontend structure changes |
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

**Last Updated**: 2026-01-14  
**Maintained By**: Development Team

For questions or suggestions about documentation, please discuss in team meetings or create issues in the repository.

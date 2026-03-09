# Tasks: Project Rename — Life Manager → Life Manager

**Input**: `specs/platform/project-rename.md`  
**Prerequisites**: None (can proceed independently)  
**Continues from**: T1126 (Database Abstraction tasks)

**Organisation**: Tasks grouped by phase — code, branding, infrastructure, documentation.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 38: Codebase Rename (Priority: P2)

**Purpose**: Update all code references from Life Manager to Life Manager  
**Estimated Effort**: 1 week (14 tasks)  
**Dependencies**: None

### Solution & Backend (Days 1-2)

- [ ] T1127 [US1] Rename `Life Manager.sln` → `Life Manager.sln` and update project references - 2h
- [ ] T1128 [US1] Rename `apps/finance-api/FinanceApi.csproj` → `apps/api/LifeManager.Api.csproj` - 2h
- [ ] T1129 [US1] Update all C# namespaces: `FinanceApi.*` → `LifeManager.*` across all backend files - 3h
- [ ] T1130 [US1] Update all `using` statements and assembly references - 2h
- [ ] T1131 [US1] Rename test projects: `FinanceApi.UnitTests` → `LifeManager.Api.UnitTests`, etc. - 2h

### Frontend Packages (Days 2-3)

- [ ] T1132 [P] [US1] Update `apps/web/package.json` name to `@life-manager/web` - 1h
- [ ] T1133 [P] [US1] Update `packages/ui/package.json` name to `@life-manager/ui` - 1h
- [ ] T1134 [P] [US1] Update `packages/schema/package.json` name to `@life-manager/schema` - 1h
- [ ] T1135 [US1] Update all import statements referencing `@life-manager/*` across frontend - 2h
- [ ] T1136 [US1] Update `pnpm-workspace.yaml` and root `package.json` - 1h

### Configuration (Days 3-4)

- [ ] T1137 [US1] Update `docker-compose.yml` service names and image names - 1h
- [ ] T1138 [US1] Update environment variable prefixes (`FINANCE_MANAGER_*` → `LIFE_MANAGER_*`) - 2h
- [ ] T1139 [US1] Update `vite.config.ts`, `index.html` title, and `tsconfig.json` paths - 1h

### Verification (Day 5)

- [ ] T1140 [US1] Run full test suite to verify all rename changes are correct (0 failures) - 2h

**Checkpoint**: Codebase fully renamed, all tests passing

---

## Phase 39: Branding & Infrastructure (Priority: P2)

**Purpose**: Update user-facing branding and infrastructure  
**Estimated Effort**: 0.5 weeks (8 tasks)  
**Dependencies**: Phase 38 complete

### Branding (Days 1-2)

- [ ] T1141 [US2] Update application header component with new platform name - 1h
- [ ] T1142 [US2] Update favicon.ico and PWA manifest icons - 2h
- [ ] T1143 [US2] Update login/registration page branding and welcome text - 1h
- [ ] T1144 [US2] Update email templates (verification, password reset) with new name - 1h
- [ ] T1145 [US2] Update meta tags (Open Graph, Twitter Card) in `index.html` - 1h

### Infrastructure (Day 3)

- [ ] T1146 [US3] Rename GitHub repository (`finance-manager` → `life-manager`) - 1h
- [ ] T1147 [US3] Update GitHub Actions workflow files with new repository reference - 1h
- [ ] T1148 [US3] Update Docker registry image names - 1h

**Checkpoint**: User-facing branding updated, repository renamed

---

## Phase 40: Documentation Cleanup (Priority: P3)

**Purpose**: Update all documentation to reference the new platform name  
**Estimated Effort**: 0.5 weeks (6 tasks)  
**Dependencies**: Phase 38 complete

- [ ] T1149 [US4] Update root `README.md` with new platform name and description - 1h
- [ ] T1150 [US4] Search and replace "Life Manager" in all `docs/` files (preserve CHANGELOG history) - 2h
- [ ] T1151 [US4] Search and replace "Life Manager" in all `specs/` files - 2h
- [ ] T1152 [US4] Update `.github/copilot-instructions.md` with new name references - 1h
- [ ] T1153 [US4] Update `QUICKSTART.md` with new name and examples - 1h
- [ ] T1154 [US4] Add CHANGELOG.md entry documenting the rename - 1h

**Checkpoint**: All documentation references updated to Life Manager

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 38 | Codebase Rename | P2 | T1127-T1140 (14) | 1 week |
| 39 | Branding & Infra | P2 | T1141-T1148 (8) | 0.5 weeks |
| 40 | Documentation | P3 | T1149-T1154 (6) | 0.5 weeks |
| **Total** | | | **28 tasks** | **~2 weeks** |

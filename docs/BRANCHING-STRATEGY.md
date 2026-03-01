# Branching Strategy — Finance Manager

> **Last Updated**: 2026-03-01
> **ADR**: ADR-020
> **Status**: Active
> **See also**: [Environments & Releases](guides/ENVIRONMENTS_AND_RELEASES.md) for full deployment and quality gate details

---

## Overview

This project follows a **modified GitFlow** branching model with phase-based feature branches. The strategy aligns with our [version management](VERSION-MANAGEMENT.md) (semantic versioning) and [conventional commits](../CHANGELOG.md) practices.

## Branch Types

| Branch | Purpose | Lifetime | Merges Into |
|--------|---------|----------|-------------|
| `main` | Stable, production-ready releases | Permanent | — |
| `develop` | Integration branch for completed phases | Permanent | `main` (on release) |
| `phase-XX/description` | Single phase of work | Days to weeks | `develop` |
| `hotfix/description` | Urgent fixes for production | Hours to days | `main` + `develop` |

### Branch–Environment Mapping

Each branch type maps to a deployment environment:

| Branch | Environment | Database | Auto-Deploy? |
|--------|-------------|----------|-------------|
| `phase-XX/*` | Dev (local) | `finance_manager_dev` | Manual (`start-dev.ps1`) |
| `develop` | **UAT** | `finance_manager_uat` | Via `deploy-uat.ps1` |
| `main` | Production | `finance_manager_prod` | Via CI/CD pipeline (future) |

> **Note**: UAT is the current "live" LAN deployment — see [Environments & Releases](guides/ENVIRONMENTS_AND_RELEASES.md) for full details on environment strategy, database management, and quality gates.

## Branch Naming Convention

```
phase-{number}/{short-description}
```

**Examples:**
- `phase-50/tanstack-page-migration`
- `phase-51/component-tailwind-migration`
- `phase-14/fitness-app-backend`
- `hotfix/auth-token-expiry`

**Rules:**
- Use lowercase with hyphens (kebab-case)
- Phase number matches `specs/001-todo-app/tasks.md` or `specs/platform/frontend-modernisation-tasks.md`
- Description should be 2-5 words, matching the phase title
- No slashes beyond the `phase-XX/` prefix

## Workflow

### Standard Phase Development

```
main ──────────────────────────────────────────── (stable releases, tagged)
  │
  └── develop ─────────────────────────────────── (integration, always ahead of main)
        │
        ├── phase-50/tanstack-page-migration ──── (active work)
        │     │
        │     ├── commit: feat: migrate TasksPage to useQuery (T1291)
        │     ├── commit: feat: migrate DashboardPage to useQuery (T1293)
        │     └── PR → develop (squash merge)
        │
        ├── phase-51/component-tailwind-migration
        │     ├── PR #1 → develop (if >500 LOC, split into sub-PRs)
        │     └── PR #2 → develop
        │
        └── (release) ── merge develop → main, tag v0.16.0
```

### Step-by-Step

1. **Create phase branch** from `develop`:
   ```powershell
   git checkout develop
   git pull origin develop
   git checkout -b phase-50/tanstack-page-migration
   ```

2. **Work on the phase**, making conventional commits:
   ```powershell
   git commit -m "feat: migrate TasksPage to TanStack Query (T1291)"
   git commit -m "feat: migrate DashboardPage to TanStack Query (T1293)"
   ```

3. **Push and create PR** to `develop`:
   ```powershell
   git push -u origin phase-50/tanstack-page-migration
   # Create PR: phase-50/tanstack-page-migration → develop
   ```

4. **Squash merge** the PR into `develop`:
   - PR title follows conventional commits: `feat: Phase 50 — TanStack Query page migration`
   - Delete the phase branch after merge

5. **Release** (when ready to cut a version):
   ```powershell
   git checkout main
   git merge develop
   git tag -a v0.16.0 -m "Release v0.16.0: TanStack Query migration"
   git push origin main --tags
   ```

### Splitting Large Phases (>500 LOC)

When a phase exceeds the 500-LOC PR guideline, split it into sequential sub-PRs:

```
phase-50/tanstack-page-migration
  ├── PR #1: "feat: add query hooks for tasks and events" (~300 LOC)
  ├── PR #2: "feat: migrate TasksPage and EventsPage to useQuery" (~400 LOC)
  └── PR #3: "feat: migrate remaining pages to useQuery" (~350 LOC)
```

**Approach A — Single branch, multiple PRs to develop:**
- Keep working on the same branch
- Create a PR after each logical chunk reaches ~500 LOC
- Merge PR, continue on the same branch (rebase from develop)

**Approach B — Sub-branches:**
- `phase-50/tanstack-page-migration-1`
- `phase-50/tanstack-page-migration-2`
- Each branches from `develop` after the previous is merged

Prefer Approach A for simplicity unless the sub-tasks are truly independent.

### Hotfixes

For urgent production fixes:

```powershell
git checkout main
git checkout -b hotfix/auth-token-expiry
# Fix, commit, push
# PR → main (merge)
# Then: git checkout develop && git merge main
```

## Release Process

### UAT Deployment (after each phase merge)

When a phase branch is squash-merged into `develop`, deploy to UAT:

1. Run `.\scripts\deploy-uat.ps1` — builds, tests, migrates, deploys, health-checks
2. Perform UAT smoke test checklist (see [Environments & Releases — UAT Gate](guides/ENVIRONMENTS_AND_RELEASES.md))
3. If issues found, fix on a new phase branch and repeat
4. If smoke test passes, the change is UAT-verified

### Production Release (version cut)

1. All planned phases for the release are merged into `develop`
2. UAT smoke test passes on `develop`
3. Final testing on `develop` (run full test suite)
3. Update version files:
   - `VERSION.json` (version, releaseDate, changelog)
   - `CHANGELOG.md` (new section)
   - `apps/web/package.json` (version field)
   - `apps/finance-api/FinanceApi.csproj` (`<Version>` tag)
4. Commit: `chore: bump version to v0.X.0`
5. Merge `develop` → `main`
6. Tag: `git tag -a v0.X.0 -m "Release v0.X.0: Description"`
7. Push: `git push origin main --tags`

## Version Mapping

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| New feature phase | MINOR (0.X.0) | Phase 50 → v0.16.0 |
| Multiple feature phases | MINOR (0.X.0) | Phases 50+51 → v0.17.0 |
| Bug fix only phase | PATCH (0.0.X) | Hotfix → v0.16.1 |
| Breaking change | MAJOR (X.0.0) | Major API change → v1.0.0 |

Releases may bundle multiple phases into a single MINOR version bump if they form a logical unit of work (e.g. Phases 48+49 were bundled as foundational infrastructure).

## Protecting Branches

Configure these rules on the remote (GitHub):

### `main`
- Require PR reviews (1 minimum)
- Require status checks to pass
- No direct pushes
- No force pushes

### `develop`
- Require status checks to pass
- Allow squash merges only (for phase PRs)
- No force pushes

## Current State

As of 2026-03-01, the project is transitioning to this strategy:

1. **Existing branch `001-todo-app`** contains all work through Phase 49
2. This will be merged into `main` to establish the baseline
3. A `develop` branch will be created from `main`
4. Phase 50 onwards will follow this strategy

## Quick Reference

```
# Start a new phase
git checkout develop && git pull
git checkout -b phase-XX/description

# During development
git commit -m "feat: description (TXXX)"

# Ready to merge
git push -u origin phase-XX/description
# Create PR → develop (squash merge)

# Cut a release
git checkout main && git merge develop
git tag -a vX.Y.Z -m "Release vX.Y.Z: Description"
git push origin main --tags
```

# Branching Strategy — Life Manager

> **Last Updated**: 2026-09-04
> **ADR**: ADR-020 (superseded — see "History" below)
> **Status**: Active
> **See also**: [Environments & Releases](guides/ENVIRONMENTS_AND_RELEASES.md) for deployment and quality-gate details

---

## Overview

This project is **trunk-based**: `main` is the single long-lived branch. All work happens on
short-lived branches that merge back into `main` via pull request. There is no `develop` branch.

This replaces the earlier modified-GitFlow model (`phase-*` → `develop` → `main`), which assumed a
team with a separate staging environment and scheduled releases. With a single maintainer and a
single always-on deployment, the two-integration-branch model was pure overhead — keeping `develop`
and `main` in sync added a step and a failure mode without adding a gate that anyone used.

## Branch Types

| Branch | Purpose | Lifetime | Merges Into |
|--------|---------|----------|-------------|
| `main` | The trunk. Always releasable. The deploy source. | Permanent | — |
| `phase-XX/description` | A single phase of spec'd work | Hours to days | `main` |
| `feat/description` / `fix/description` | Ad-hoc work not tied to a spec phase | Hours to days | `main` |

Feature branches are **squash-merged** into `main` (one commit per PR) and deleted automatically on
merge (repo setting: *Automatically delete head branches*).

## Branch Naming Convention

```
phase-{number}/{short-description}     # spec'd phase work
feat/{short-description}               # ad-hoc feature
fix/{short-description}                # ad-hoc fix
```

**Examples:** `phase-64/mcp-server-foundation`, `feat/discord-error-alerts`, `fix/auth-token-expiry`

**Rules:**
- Lowercase kebab-case
- Phase number matches the relevant `specs/**/tasks.md`
- 2–5 word description

## Workflow

```
main ───────────────────────────────────────────────────  (trunk — always releasable, deploy source)
  ├── phase-64/mcp-server-foundation ──┐
  │     ├── feat: … (T1596)            │
  │     └── feat: … (T1601)            │  PR → main (squash merge, CI must be green)
  │                                    ▼
  ├───────────────────────────────── merge ──────────────  → auto-deploy to the VPS
  │
  └── feat/discord-error-alerts ─── PR → main ────────────  → auto-deploy
```

### Step-by-step

1. **Branch from `main`:**
   ```bash
   git checkout main && git pull
   git checkout -b phase-64/mcp-server-foundation
   ```

2. **Work**, making conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`;
   reference task IDs where applicable):
   ```bash
   git commit -m "feat: scaffold MCP server package (T1596)"
   ```

3. **Push and open a PR to `main`:**
   ```bash
   git push -u origin phase-64/mcp-server-foundation
   gh pr create --base main --fill
   ```

4. **Merge** once CI is green (squash merge). The branch auto-deletes. PRs should stay ≤ 500 LOC —
   split larger phases into sequential PRs.

5. **Deploy** happens on merge to `main` (see [Environments & Releases](guides/ENVIRONMENTS_AND_RELEASES.md)).

### Hotfixes

No special flow — a hotfix is just a `fix/*` branch with a fast PR to `main`. Because `main` is the
deploy source, merging the fix ships it.

## Release Process (versioning)

Deployment is decoupled from versioning: every green merge to `main` deploys; version tags are cut
when you want a labelled point in history.

1. **release-please** runs on every push to `main` (`.github/workflows/release-please.yml`) and
   maintains an open **Release PR** with:
   - Version bump from conventional commits (`feat:` → minor, `fix:` → patch, `!`/`BREAKING CHANGE` → major)
   - Updated `CHANGELOG.md`
   - Synced version in `package.json`, `VERSION.json`, `apps/web/package.json`, `LifeApi.csproj`
2. Merge the Release PR when you want to publish → release-please creates a **GitHub Release** + **git tag**.
3. (Optional) update `VERSION.json` metadata (codename, description) in a follow-up commit.

> **Config**: `release-please-config.json`, `.release-please-manifest.json`

### Version Mapping

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| New feature | MINOR (0.X.0) | Phase 64 → v1.2.0 |
| Bug fix only | PATCH (0.0.X) | `fix/*` → v1.1.1 |
| Breaking change | MAJOR (X.0.0) | Major API change → v2.0.0 |

## Branch Protection

Enforced by the **`main-protection`** ruleset (Settings → Rules → Rulesets):

- Require a pull request before merging (no direct pushes)
- Restrict deletions (cannot delete `main`)
- Block force pushes
- Require linear history
- Squash is the only allowed merge method
- Require status checks to pass — add the `ci.yml` job checks (`Backend Tests (.NET)`,
  `Frontend Tests (Jest)`, `Lint & Type Check`, `Build Check`) once they are green on a PR

## Quick Reference

```bash
# Start work
git checkout main && git pull
git checkout -b phase-XX/description   # or feat/… / fix/…

# During development
git commit -m "feat: description (TXXX)"

# Ready to merge
git push -u origin phase-XX/description
gh pr create --base main --fill
# Merge via squash once CI is green — branch auto-deletes, deploy runs

# Cut a release
# Merge the open release-please PR on main → Release + tag are created
```

## History

- **2026-03-01** — Modified-GitFlow model adopted (ADR-020): `phase-*` → `develop` → `main`, with
  `develop` mapped to a LAN "UAT" environment.
- **2026-09-04** — Switched to trunk-based on `main`. `develop` retired (it had been merged to `main`
  and deleted). The LAN UAT environment and `scripts/deploy-uat.ps1` / `.github/workflows/deploy-uat.yml`
  are no longer used; the always-on deployment is the VPS (see
  [VPS deployment](guides/ENVIRONMENTS_AND_RELEASES.md)).

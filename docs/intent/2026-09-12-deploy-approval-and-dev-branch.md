# Intent: a checkpoint before AI-written code reaches live

## The pain point

Merging to `main` auto-deploys straight to the production VPS, with no human step in between.
That was fine when every line was hand-written and reviewed by typing it. It's a different risk
now that a meaningful share of the code is AI-written — tests and CI passing doesn't mean every
line has actually been read by a human before it reaches the app real people (well, one real
person and his family's data) depend on.

Separately, but noticed while discussing the above: there's currently no fast way to see a
branch actually *running* remotely before it's ready to merge — the only options are read the
diff, run it locally, or ship it to production and find out.

## Why now

Prompted directly by today's local-dev-tooling work, which raised the general question of how
safe the dev → test → live pipeline actually is. The specific trigger was recognising that CI
green + merge + auto-deploy has no point where a human deliberately says "yes, this one."

## What "done" looks like

- A merge to `main` still runs CI the same way it does today, but the actual deploy to the VPS
  pauses and waits for a deliberate approval click before it executes.
- Optionally, and independently, pushing to a `dev` branch gets you a running instance you can
  poke at remotely within a couple of minutes — no approval needed, no requirement that every
  change pass through it first.

## Explicitly out of scope

- **Not** reintroducing a mandatory two-branch flow where every change must pass through `dev`
  before `main` — that model existed here before (`develop` → UAT, ADR-020) and was deliberately
  killed 2026-09-04 as pure overhead for a team that doesn't exist. This intent is not "undo that
  decision"; it's a different, narrower problem the old model was never scoped to solve.
- **Not** a second physical server or a wait for the refurb PC — reuses the existing VPS and its
  self-hosted GitHub Actions runner.
- **Not** touching CI itself (`ci.yml`) — the gate belongs on the deploy step, not the test suite.

## Constraints / relevant history

- Solo maintainer, single existing production target (the Hostinger VPS), one self-hosted runner.
- `docs/BRANCHING-STRATEGY.md` already documents why the old `develop`/UAT model was retired —
  worth re-reading before "solving" this the same way again.
- The VPS is explicitly slated for retirement once the refurb PC exists (`VPS Future Use &
  Lifecycle`, vault) — anything built here should assume it's temporary infrastructure, not worth
  over-engineering.

---
*Resulting plan: `C:\Users\Jay\.claude\plans\resilient-tickling-stearns.md` (2026-09-12 revision) —
production approval gate via a GitHub Environment + `dev` branch auto-deployed to a second
Compose stack on the same VPS.*

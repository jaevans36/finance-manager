# Intent files

**Trial convention, started 2026-09-12** — not yet an adopted standard. See
`Areas/Software Engineering/Learning Roadmap.md` (second brain vault) → Track 2 for where this
came from: Anthropic/Boris Cherny's AI-native SDLC playbook, via a video Jay digested.

## The idea

An `intent.md` captures the *real pain point* behind a piece of work, written before any
technical planning starts — the "why", not the "how". It's the first of three artifacts in the
full playbook's chain:

1. **`intent.md`** (this folder) — the pain point, in plain language. What's actually wrong, why
   it matters now, what "done" looks like. No file lists, no architecture.
2. **`spec.md`** — this repo's `specs/` directory already plays this role (requirements/design
   per feature).
3. **`plan.md`** — Claude Code's own plan-mode output already plays this role (files to change,
   order of work, risks) — see `C:\Users\Jay\.claude\plans\` for whichever plan a session
   produced from a given intent.

Life Manager is only trialling stage 1. Stages 2 and 3 already existed here under different
names before this convention was introduced.

## What goes in one

- **The pain point** — what's actually wrong or missing, described as a problem, not a solution
- **Why now** — what prompted this, what happens if it's left alone
- **What "done" looks like** — the outcome, in terms someone non-technical could recognise
- **Explicitly out of scope** — anything a reasonable reader might assume is included but isn't
- **Constraints / relevant history** — anything that shapes the solution space (prior attempts,
  standing decisions, resource limits)

Deliberately does **not** contain: file names, code, architecture, sequencing, or risk analysis —
that's the plan's job once the pain point is agreed.

## Naming

`YYYY-MM-DD-short-slug.md`, one per feature/bugfix trial. Not every change needs one — quick
fixes and vault/notes work don't; anything that reaches a full technical plan probably should
have started with one.

## Status of the trial

Started 2026-09-12. Jay asked to be reminded of the habit each time new coding work starts,
since it's easy to forget mid-flow. If it isn't earning its keep after a few uses, drop it and
note that here rather than letting it silently rot.

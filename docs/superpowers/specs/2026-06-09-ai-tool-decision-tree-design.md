# AI Tool Decision Tree — Design Spec
**Date:** 2026-06-09
**Status:** Approved

---

## Overview

A category-first decision tree for choosing between Claude Code, Gemini, and Ollama (Qwen). Designed to reduce unnecessary token consumption on Claude and Gemini by routing general knowledge, learning, and personal interest questions to a free, local Ollama instance.

The core principle: **reach for the cheapest capable tool first, escalate only when needed.**

---

## Tool Profiles

### Claude Code
- Has full project codebase context
- Can read/write/search the Obsidian vault via CLI
- Has web search
- Costs tokens — reserve for tasks that genuinely need it

### Gemini
- Replaces Google for general web queries
- Native Google Workspace integration (Gmail, Calendar, Docs)
- Good for live/current information
- Costs tokens — use for things that need internet or Google ecosystem

### Ollama (local, via qwen2.5:7b)
- Free, private, no tokens, no internet required
- Best for timeless knowledge: learning, concepts, how-tos, personal interests
- Start/stop scripts: `C:\AI-Stack\start-ai.ps1` / `stop-ai.ps1`
- Stop before gaming to free ~6–8 GB RAM

---

## Decision Tree Branches

### 1. Build & Code → Claude Code
Tasks involving active project files, editing, debugging, testing, refactoring, DevOps, Docker, CI/CD, deployment, and infrastructure across any project (Life Manager, game dev, etc.).

### 2. Plan & Design → Claude Code
Speccing new features, estimating effort and time, architecture decisions, tech stack choices, technical documentation (READMEs, ADRs), stakeholder communication, and translating technical decisions into plain language. Claude Code is used here because it knows the codebase — specs are grounded in actual code, not assumptions.

### 3. Vault Interaction → Claude Code
Programmatic interaction with the Obsidian vault from outside: reading notes, writing/creating notes, searching across the vault, updating the daily note, batch operations, and capturing knowledge from a conversation into notes. Uses the Obsidian CLI tool.

**Note:** For AI assistance *inside* Obsidian while writing, use the Ollama plugins (see below) — these are complementary, not competing.

### 4. Google Workspace → Gemini
Gmail, Google Calendar, Google Docs, Sheets, and Drive. Gemini has native integration with the entire Google ecosystem.

### 5. Live & Current → Gemini
News, politics, game releases, patches and meta, current framework and library documentation, and anything requiring real-time information. Also: professional and personal writing (LinkedIn posts, blog articles, cover letters) where no project context is needed.

### 6. Learning & Knowledge → Ollama (fallback: Gemini)
All general knowledge, learning, and personal interest topics. Ollama handles this for free with no token cost. Falls back to Gemini only if Ollama is not running.

Sub-groups within this branch:

| Group | Topics |
|---|---|
| **PKM & Note-taking** | Zettelkasten methodology, note structure, linking ideas, Obsidian plugin questions |
| **Software** | FE patterns, CSS, TypeScript, accessibility (a11y), Core Web Vitals, browser APIs, animations, WebGL/Canvas |
| **Career & Leadership** | Head of Dev preparation, people management, 1:1s, feedback conversations, hiring & interviewing, Agile, Scrum, sprint delivery |
| **Game Design** | Game mechanics, level design, narrative & world-building, game feel, balancing |
| **Health & Fitness** | Workouts, nutrition, periodisation, injury prevention, sleep optimisation, mobility |
| **Other** | Music theory & production, personal finance (ISAs, pensions, investing), engineering & mechanics, creative ideation, how-tos & manuals |

---

## Escalation Path

If the answer from the first tool isn't sufficient, escalate right:

```
Ollama  →  Gemini  →  Claude Code
```

---

## Obsidian Integration

Two complementary layers:

**Claude Code + Obsidian CLI** — programmatic vault access from outside Obsidian (searches, batch creates, conversation-to-note). Use when Obsidian may not even be open.

**Ollama plugins inside Obsidian** — inline AI assistance while actively writing in the vault:

| Plugin | Purpose |
|---|---|
| Text Generator | Inline text generation and expansion, prompt templates |
| Smart Connections | Semantic search across vault using local AI embeddings |
| Copilot | Chat interface within Obsidian against your notes |

All three connect to Ollama at `http://localhost:11434` with model `qwen2.5:7b`.

---

## Start/Stop Workflow

```powershell
# Before an AI session
C:\AI-Stack\start-ai.ps1

# Before gaming (frees 6–8 GB RAM)
C:\AI-Stack\stop-ai.ps1
```

Ollama does not auto-start with Windows (disabled from startup). Only runs when explicitly started.

---

## Visual Reference

The interactive HTML flowchart is saved at:
`C:\AI-Stack\decision-tree.html`

Open in any browser for a visual reference of all branches.

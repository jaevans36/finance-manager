# Life Manager

> Personal productivity platform — To Do, Calendar, Events, and more.
> *(Currently named "Life Manager" — rename to "Life Manager" in progress)*

[![CI](https://github.com/jaevans36/finance-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/jaevans36/finance-manager/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.15.0-blue)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-300%2B%20passing-brightgreen)](docs/testing/TEST-INVENTORY.md)

---

## Overview

Life Manager is a self-hosted personal productivity platform built as a pnpm monorepo. The **To Do application** is the current MVP — a feature-rich task manager with calendar, events, productivity frameworks (Eisenhower Matrix, energy tagging, WIP limits), and a full dark/light design system.

**AI agents**: Read [`CLAUDE.md`](CLAUDE.md) first — it is the single source of truth for all AI context.

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Backend | .NET 8 / C# / ASP.NET Core Web API |
| Database | PostgreSQL 15 (Docker) + Entity Framework Core 8 |
| Frontend | React 18 + TypeScript 5.7 + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Monorepo | pnpm workspaces |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18 | pnpm ≥ 9 | .NET 8 SDK | Docker Desktop

### Quick Start

```powershell
# Clone and install
git clone https://github.com/jaevans36/finance-manager
cd "Life Manager"
pnpm install

# Start everything (Docker + API + frontend)
.\start-dev.ps1
```

App runs at `http://localhost:5173` | API at `http://localhost:5000`

### Other Scripts

```powershell
.\stop-dev.ps1          # Stop all services
.\restart-dev.ps1       # Quick restart
.\reset-db.ps1          # Reset database + run migrations
.\run-tests.ps1         # Run all tests
.\view-logs.ps1         # View application logs
```

---

## Project Structure

```
Life Manager/
├── CLAUDE.md                   ← AI context (read this first)
├── apps/
│   ├── finance-api/            ← .NET 8 Web API (C#, EF Core, PostgreSQL)
│   │   └── Features/           ← Feature-based: Auth, Tasks, Events, Admin…
│   └── web/                    ← React + TypeScript frontend
│       └── src/
│           ├── components/     ← Tailwind + shadcn/ui components
│           ├── hooks/          ← TanStack Query + React Hook Form hooks
│           ├── pages/          ← Route-level views
│           └── services/       ← API service layer (all use apiClient)
├── packages/
│   ├── ui/                     ← @life-manager/ui (design tokens, components)
│   └── schema/                 ← @life-manager/schema (Zod schemas, types)
├── docs/                       ← Architecture, guides, testing docs, phase history
├── specs/                      ← Feature specifications and task breakdowns
└── scripts/                    ← PowerShell dev scripts
```

---

## Features (v0.15.0)

- **Auth** — Register, login, JWT refresh, password reset, email verification, account lockout, multi-device session management
- **Tasks** — CRUD, priorities, due dates, groups, subtasks, bulk operations, WIP limits
- **Productivity** — Eisenhower Matrix, energy tagging (1–10), status workflow (NotStarted → Blocked → Completed)
- **Calendar** — Day/week/month view, events with RRULE recurrence
- **Progress** — Weekly stats and charts
- **Admin** — User management, activity logs, system stats
- **Theme** — Full light/dark mode (WCAG AAA)

---

## Testing

```powershell
# Run all tests
.\run-tests.ps1

# Specific suites
.\run-tests.ps1 -Backend    # xUnit (.NET)
.\run-tests.ps1 -Frontend   # Jest + React Testing Library
.\run-tests.ps1 -E2E        # Playwright (requires services running)
```

300+ tests, 100% pass rate. See [`docs/testing/`](docs/testing/) for full inventory.

---

## Documentation

| Topic | Location |
| ----- | -------- |
| AI context | [`CLAUDE.md`](CLAUDE.md) |
| Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Current state | [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) |
| LAN deployment | [`docs/guides/LAN_DEPLOYMENT.md`](docs/guides/LAN_DEPLOYMENT.md) |
| Design system | [`docs/guides/DESIGN_SYSTEM_USAGE.md`](docs/guides/DESIGN_SYSTEM_USAGE.md) |
| Testing | [`docs/testing/`](docs/testing/) |
| Specifications | [`specs/`](specs/) |
| Phase history | [`docs/phases/`](docs/phases/) |
| Changelog | [`CHANGELOG.md`](CHANGELOG.md) |

---

## Roadmap

**v1.0 MVP** — Task search, empty-state onboarding, error pages, data export, self-hosted setup guide
**Post-launch** — Task categories, keyboard shortcuts, browser notifications
**Future** — Fitness app, Weather app, Finance app, microservices architecture

See [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) for the complete v1.0 gap list.

---

## Licence

Private project — All rights reserved

---

**Last Updated**: 2026-03-08 | **Version**: 0.15.0 | **Branch**: `phase-50/test-infra-and-query-migration`

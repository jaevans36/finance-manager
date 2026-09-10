# @life-manager/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that wraps the Life
Manager API so an MCP client (Claude CLI, Claude Desktop, MCP Inspector) can read and
manage your tasks and events without a browser.

> **Status:** Phase 64 — task tools shipped (PR1). Events, labels, resources and the SSE
> transport land in follow-ups. See `specs/platform/mcp-server.md`.

## How it authenticates

The server logs in to `life-api` as **you** — set `LM_MCP_EMAIL` / `LM_MCP_PASSWORD` to your
own Life Manager credentials, not a separate service account. Life Manager is multi-user, so
a dedicated bot account would create a third identity whose tasks nobody sees. Everything the
server creates lands on your account; share or assign it to the family with the app's normal
sharing. If another family member wants this, they run their own copy with their own login.

There is no refresh token in `life-api`, so "refresh" here means "log in again": the JWT is
cached in memory, renewed ~5 minutes before it expires, and renewed on any `401`.

## Multi-backend design

`src/backends/` is written so a second API (`finance-api`) is added purely by config — a
`createBackend()` factory per service, a backend registry, and tools that name the backend
they need (`backend: 'life'`). Nothing in the auth/HTTP/tool plumbing changes when a
`finance` backend and `finance_*` tools are added.

## Setup

```bash
cp apps/life-mcp/.env.example apps/life-mcp/.env   # then fill in LM_MCP_PASSWORD
pnpm install
pnpm --filter @life-manager/mcp build
```

| Env var | Purpose |
|---|---|
| `LM_API_BASE_URL` | Base URL of a running `life-api` (e.g. `http://localhost:5000`) |
| `LM_MCP_EMAIL` | Your Life Manager login (email or username) |
| `LM_MCP_PASSWORD` | Your Life Manager password |
| `LM_MCP_USER_AGENT` | Optional — User-Agent for the audit log (default `LifeManager-MCP/1.0`) |

The server does not read a `.env` file itself. In development `pnpm --filter @life-manager/mcp dev`
picks up your shell env; in real use the `claude mcp add` / `~/.claude.json` `env` block supplies it.

## Run it

**MCP Inspector:**
```bash
LM_API_BASE_URL=http://localhost:5000 LM_MCP_EMAIL=you@example.com LM_MCP_PASSWORD=... \
  npx @modelcontextprotocol/inspector node apps/life-mcp/dist/index.js
```

**Claude CLI:**
```bash
claude mcp add life-manager -- node /abs/path/to/apps/life-mcp/dist/index.js
```
then add the three env vars under `mcpServers.life-manager.env` in `~/.claude.json`.

## Tools

| Tool | What it does |
|---|---|
| `list_tasks` | List tasks with filters (status, priority, label, group, completed, due window, limit) |
| `get_task` | One task by id, with subtasks and labels |
| `create_task` | Create a task (only `title` required; **not idempotent**) |
| `update_task` | Update fields; omitted fields unchanged. A due date can't be *removed* here — use the web app |
| `complete_task` | Mark completed (idempotent) |
| `delete_task` | Delete permanently |
| `add_subtask` | Add a subtask under a task |

Priority is the string enum `Low | Medium | High | Critical`. `search_tasks` is deferred until
`life-api` has a search endpoint.

## Development notes

- Source is ESM (`"type": "module"`, tsconfig `module: Node16`). **Relative imports must
  carry a `.js` suffix** (`import { loadConfig } from './config.js'`) even though the file is
  `.ts` — that's the Node16 resolver rule, and `dist/` output depends on it.
- The MCP SDK is ESM-only and is imported in only four files (`src/index.ts`,
  `src/tools/index.ts`, `src/tools/_register.ts`, plus `src/resources/index.ts` later).
  Everything else is SDK-free so the Jest suite runs under CommonJS.
- `pnpm --filter @life-manager/mcp test` · `... typecheck` · `... build`.

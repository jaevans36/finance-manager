# @life-manager/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that wraps the Life
Manager API so an MCP client (Claude CLI, Claude Desktop, MCP Inspector) can read and
manage your tasks, events and labels without a browser.

> **Status:** Phase 64 complete + events/resources part of Phase 65 — 14 tools (task,
> event, label) and 3 resources. Deferred: stats/user tools, the `stats/week` resource,
> and the SSE transport (Phase 66). See `specs/platform/mcp-server.md`.

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
| `list_events` | Events in a date window, grouped by day |
| `get_event` | One event by id |
| `create_event` | Create an event (`title`, `startDate`, `endDate` required; **not idempotent**) |
| `update_event` | Update fields; omitted fields unchanged |
| `delete_event` | Delete permanently |
| `list_labels` | The user's task labels with id and colour |
| `create_label` | Create a label (`name`, `colourHex` `#rrggbb`); fails on a duplicate name |

Priority is the string enum `Low | Medium | High | Critical`. Events have no recurrence in
`life-api` — plain CRUD, no RRULE / delete-mode. `search_tasks` is deferred until `life-api`
has a search endpoint.

## Resources

| URI | Content |
|---|---|
| `life-manager://tasks/today` | Open tasks due today, as a checklist |
| `life-manager://tasks/overdue` | Open tasks past their due date, with days overdue |
| `life-manager://events/upcoming` | The next 7 days of events, grouped by day |

## Verifying against a running life-api

```bash
pnpm --filter @life-manager/mcp typecheck && pnpm --filter @life-manager/mcp test && pnpm --filter @life-manager/mcp build
```

Then drive the tools with the MCP Inspector. **Note:** some installed Inspector CLI versions
mis-parse the positional `node dist/index.js … --method tools/call` form (`"No servers found
in config file"` / `"Method is required"`). Work around it with a small config file:

```jsonc
// inspector.json
{ "mcpServers": { "life-mcp": { "command": "node", "args": ["apps/life-mcp/dist/index.js"] } } }
```
```bash
LM_API_BASE_URL=http://localhost:5000 LM_MCP_EMAIL=you@example.com LM_MCP_PASSWORD=... \
  npx @modelcontextprotocol/inspector --cli --config inspector.json --server life-mcp --method tools/list
```
Delete the config file afterwards — it can end up next to your plaintext password.

## Development notes

- Source is ESM (`"type": "module"`, tsconfig `module: Node16`). **Relative imports must
  carry a `.js` suffix** (`import { loadConfig } from './config.js'`) even though the file is
  `.ts` — that's the Node16 resolver rule, and `dist/` output depends on it.
- The MCP SDK is ESM-only and is imported in only four files (`src/index.ts`,
  `src/tools/index.ts`, `src/tools/_register.ts`, `src/resources/index.ts`). Everything
  else — including every tool handler and resource loader — is SDK-free, so the Jest suite
  runs under CommonJS and tests call handlers/loaders directly.
- `pnpm --filter @life-manager/mcp test` · `... typecheck` · `... build`.

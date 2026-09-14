# @life-manager/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that wraps the Life
Manager API so an MCP client (Claude CLI, Claude Desktop, MCP Inspector) can read and
manage your tasks, events, labels, and (optionally) finances without a browser.

> **Status:** Phase 64 complete + events/resources part of Phase 65 — 14 tools (task,
> event, label) and 3 resources. Deferred: stats/user tools, the `stats/week` resource,
> and the SSE transport (Phase 66). See `specs/platform/mcp-server.md`.
>
> `finance-mcp` core tools slice 1 (2026-09-14, see
> `docs/intent/2026-09-13-finance-mcp-and-ingestion.md`) added 7 `finance_*` tools behind
> an optional `FIN_API_BASE_URL`. CSV/PDF ingestion, cross-session duplicate detection,
> and the remaining Phase 49 tools (health score, AI insights, cashflow forecast, monthly
> report, tax year summary, compare months, export, and more) are a deliberate follow-up
> slice, not done here.

## How it authenticates

The server logs in to `life-api` as **you** — set `LM_MCP_EMAIL` / `LM_MCP_PASSWORD` to your
own Life Manager credentials, not a separate service account. Life Manager is multi-user, so
a dedicated bot account would create a third identity whose tasks nobody sees. Everything the
server creates lands on your account; share or assign it to the family with the app's normal
sharing. If another family member wants this, they run their own copy with their own login.

There is no refresh token in `life-api`, so "refresh" here means "log in again": the JWT is
cached in memory, renewed ~5 minutes before it expires, and renewed on any `401`.

## Multi-backend design

`src/backends/` fronts more than one API. `life-api` is the only one with its own login
(`createBackend()`); `finance-api` has none of its own — it validates the same JWT
`life-api` issues (same `Jwt:Secret`, `ValidateIssuer`/`ValidateAudience` both false), so
it's added with just a base URL, reusing the `life` backend's auth manager
(`createBackendWithSharedAuth()`). Tools name the backend they need (`backend: 'life'` or
`backend: 'finance'`); a tool whose backend isn't configured is skipped at startup with a
warning rather than crashing the server, since `finance` is optional.

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
| `FIN_API_BASE_URL` | Optional — base URL of a running `finance-api` (e.g. `http://localhost:5002`). Enables the `finance_*` tools. No separate email/password: it reuses the `LM_MCP_EMAIL`/`LM_MCP_PASSWORD` login. |

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
| `finance_get_accounts` | List the user's finance accounts, including any shared with them |
| `finance_get_transactions` | Paginated transactions for one account, with date/category/type/search filters |
| `finance_add_manual_transaction` | Record a transaction directly (spoken/typed figure); **does not de-duplicate** |
| `finance_get_bills_due` | Upcoming bills within a window, soonest first |
| `finance_get_pot_balances` | Spending pot (envelope budget) balances for a month |
| `finance_get_savings_goals` | Savings goals with progress and projected completion |
| `finance_get_disposable_income` | Monthly disposable-income breakdown (income, costs, safe surplus) |

Priority is the string enum `Low | Medium | High | Critical`. Events have no recurrence in
`life-api` — plain CRUD, no RRULE / delete-mode. `search_tasks` is deferred until `life-api`
has a search endpoint.

`finance_*` tools require `FIN_API_BASE_URL` (see Setup below); without it they're simply
not registered. Note `finance_get_transactions` only sees transactions on accounts the
caller owns — finance-api's `TransactionsController` isn't sharing-aware yet even though
`AccountsController` is, so a transaction on an account shared with (not owned by) the
caller isn't currently reachable through this tool.

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

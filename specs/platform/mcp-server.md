# Feature Specification: Life Manager MCP Server

**Feature ID**: `012-mcp-server`  
**Created**: 2026-05-20  
**Status**: Draft  
**Priority**: P2  
**Phase**: 64-66  
**Task Range**: T1596–T1670  
**Dependencies**: Life Manager API (all features), JWT Authentication Service

---

## Overview

A **Model Context Protocol (MCP) server** that wraps the Life Manager API and exposes its functionality as structured tools and resources consumable by AI assistants (Claude CLI, Claude Desktop, GitHub Copilot, and any other MCP-compatible client).

This enables an AI second brain workflow — an LLM can query tasks, events, fitness data, notes, and statistics from Life Manager and take actions on behalf of the user, all through the standardised MCP protocol.

---

## Rationale

The Life Manager API is rich but designed for the web frontend. An MCP server provides a second integration surface specifically designed for LLM consumption:

- **Second-brain integration**: Claude CLI / Obsidian workflows can query and update Life Manager data without manual context-switching
- **AI-native interface**: Tools are designed with LLM prompting in mind — clear descriptions, typed inputs, structured outputs
- **Composability**: Any MCP-compatible client gains access without bespoke integrations
- **Security boundary preserved**: The MCP server authenticates against the Life Manager API using a long-lived API token; the LLM never has direct database access

---

## Architecture

```
┌───────────────────┐        MCP (stdio / SSE)       ┌────────────────────┐
│  LLM Client       │ ◄─────────────────────────────► │  MCP Server        │
│  (Claude CLI,     │                                  │  (Node.js / TS)    │
│   Claude Desktop, │                                  │  apps/life-mcp/    │
│   Copilot, etc.)  │                                  └────────┬───────────┘
└───────────────────┘                                           │ HTTP + JWT
                                                                ▼
                                                    ┌───────────────────────┐
                                                    │  Life Manager API     │
                                                    │  apps/life-api/       │
                                                    └───────────────────────┘
```

### Transport

- **Primary**: `stdio` transport for local use (Claude CLI, Claude Desktop)
- **Secondary**: `SSE` (Server-Sent Events) transport for remote / network use

### Location in Monorepo

`apps/life-mcp/` — a new workspace package (`@life-manager/mcp`) alongside `apps/life-api/` and `apps/web/`.

### Technology Stack

- **Runtime**: Node.js 20+ / TypeScript 5.7+
- **MCP SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK)
- **HTTP Client**: `axios` (consistent with web app)
- **Validation**: `zod` (shared with `@life-manager/schema`)
- **Build**: `tsc` (plain TypeScript, no bundler needed for server-side)

---

## Authentication

The MCP server authenticates with the Life Manager API using a **dedicated service account** token approach:

1. An admin creates a dedicated Life Manager user account for the MCP server (e.g. `mcp@life-manager.local`)
2. The MCP server logs in once at startup using credentials from environment variables (`LM_MCP_EMAIL`, `LM_MCP_PASSWORD`) and stores the JWT + refresh token in memory
3. The MCP server silently refreshes the JWT before expiry
4. The LLM client is *never* given the credentials — they live only in the server process environment

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `LM_API_BASE_URL` | Life Manager API base URL (e.g. `http://localhost:5000`) |
| `LM_MCP_EMAIL` | Service account email |
| `LM_MCP_PASSWORD` | Service account password |

---

## MCP Capabilities

### Resources (read-only context)

Resources provide ambient context the LLM can attach to its context window without explicit tool calls.

| Resource URI | Description |
|---|---|
| `life-manager://tasks/today` | All tasks due today (formatted markdown list) |
| `life-manager://tasks/overdue` | All overdue tasks |
| `life-manager://events/upcoming` | Next 7 days of events |
| `life-manager://stats/week` | Weekly productivity statistics summary |
| `life-manager://habits/summary` | Habit tracking overview (current streaks) |

### Tools (actions)

Tools allow the LLM to take actions on behalf of the user.

#### Task Tools

| Tool | Description | Key Inputs |
|------|-------------|-----------|
| `list_tasks` | List tasks with optional filters | `status`, `priority`, `labelIds`, `dueDate`, `groupId`, `limit` |
| `get_task` | Get a single task by ID including subtasks | `taskId` |
| `create_task` | Create a new task | `title`, `priority`, `dueDate?`, `notes?`, `labelIds?`, `groupId?`, `reminderAt?` |
| `update_task` | Update an existing task | `taskId`, any updatable fields |
| `complete_task` | Mark a task as completed | `taskId` |
| `delete_task` | Delete a task | `taskId` |
| `search_tasks` | Full-text search across tasks | `query`, `limit?` |
| `add_subtask` | Add a subtask to a task | `parentTaskId`, `title` |

#### Event Tools

| Tool | Description | Key Inputs |
|------|-------------|-----------|
| `list_events` | List events in a date range | `startDate`, `endDate` |
| `get_event` | Get a single event by ID | `eventId` |
| `create_event` | Create a new event | `title`, `startDate`, `endDate`, `allDay?`, `recurrence?`, `notes?` |
| `update_event` | Update an existing event | `eventId`, any updatable fields |
| `delete_event` | Delete an event | `eventId`, `deleteMode` (single/following/all) |

#### Label Tools

| Tool | Description | Key Inputs |
|------|-------------|-----------|
| `list_labels` | List all user-defined labels | — |
| `create_label` | Create a new label | `name`, `colour` |

#### Statistics Tools

| Tool | Description | Key Inputs |
|------|-------------|-----------|
| `get_weekly_stats` | Get weekly productivity statistics | `weekOffset?` (0 = current, -1 = last, etc.) |
| `get_task_summary` | Get counts by status and priority | — |

#### User / Settings Tools

| Tool | Description | Key Inputs |
|------|-------------|-----------|
| `get_profile` | Get the current user profile | — |
| `update_settings` | Update user preferences | `theme?`, `timezone?` |

---

## Tool Input/Output Design Principles

1. **Human-readable dates**: Accept ISO 8601 strings (`2026-05-20T09:00:00`) and natural language hints in tool descriptions (e.g. "use ISO 8601 format, e.g. today's date is …")
2. **Minimal required fields**: Make most fields optional so the LLM can create a task with just a title
3. **Structured but readable output**: Return JSON objects that are also easily readable as text when the LLM summarises them
4. **Descriptive error messages**: When a tool call fails, return a clear explanation the LLM can relay to the user
5. **Idempotent where possible**: `complete_task` is safe to call twice; `create_task` is not — document this clearly in tool descriptions

---

## Data Models

### Task (output)

```typescript
interface TaskResult {
  id: string
  title: string
  status: 'NotStarted' | 'InProgress' | 'Blocked' | 'Completed'
  priority: 1 | 2 | 3 | 4 | 5  // P1 = highest
  dueDate: string | null          // ISO 8601
  notes: string | null
  labels: { id: string; name: string; colour: string }[]
  subtasks: { id: string; title: string; completed: boolean }[]
  group: { id: string; name: string } | null
  reminderAt: string | null
  createdAt: string
  updatedAt: string
}
```

### Event (output)

```typescript
interface EventResult {
  id: string
  title: string
  startDate: string   // ISO 8601
  endDate: string     // ISO 8601
  allDay: boolean
  notes: string | null
  recurrenceRule: string | null  // RRULE format
  isShared: boolean
}
```

---

## Security Considerations

- **Service account principle of least privilege**: The MCP account only has access to the authenticating user's own data — no admin capabilities
- **No credential exposure**: LLM clients never receive the API credentials; they are managed entirely within the server process
- **Input validation**: All tool inputs are validated with Zod before being forwarded to the API
- **Rate limiting**: The MCP server honours the API's rate limits; concurrent tool calls are serialised where required
- **Audit trail**: All MCP-originated mutations are traceable in the API audit log via a custom `User-Agent` header (`LifeManager-MCP/1.0`)
- **Network**: In local deployments the API URL and credentials should be configured for the LAN; in remote deployments TLS is required

---

## Claude CLI / Obsidian Integration

### Claude CLI Setup

After running `npx @modelcontextprotocol/inspector` or installing globally, add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "life-manager": {
      "command": "node",
      "args": ["/path/to/apps/life-mcp/dist/index.js"],
      "env": {
        "LM_API_BASE_URL": "http://192.168.1.x:5000",
        "LM_MCP_EMAIL": "mcp@life-manager.local",
        "LM_MCP_PASSWORD": "your-password"
      }
    }
  }
}
```

### Use Cases for Second Brain

- "What tasks are overdue?" → `list_tasks` with `status=overdue` resource
- "Add a task to review my portfolio this Friday at P2" → `create_task`
- "What have I got on this week?" → `list_events` + `list_tasks` combined
- "I just completed my workout — mark T1234 as done" → `complete_task`
- "How productive was I last week?" → `get_weekly_stats` with `weekOffset=-1`

---

## Phases

| Phase | Feature | Effort |
|-------|---------|--------|
| Phase 64 | MCP Server Foundation + Task Tools | 2 weeks |
| Phase 65 | Event Tools + Statistics Tools + Resources | 1.5 weeks |
| Phase 66 | SSE Transport + Claude/Obsidian Docs + Polish | 1 week |

**Total estimated effort**: ~4.5 weeks

---

## Out of Scope (MVP)

- **Fitness / Finance / Stocks tools** — added in future phases once those applications are built
- **Write access to events via recurrence** — read-only for recurring events in MVP; mutation is complex
- **Multi-user / shared task tools** — single service account per deployment
- **OAuth / PKCE authentication** — password-based service account is sufficient for a personal deployment
- **Prompts capability** — MCP prompts (canned prompt templates) deferred post-MVP

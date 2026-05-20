# Tasks: Life Manager MCP Server

**Input**: `specs/platform/mcp-server.md`  
**Prerequisites**: Life Manager API (all features), Node.js 20+  
**Continues from**: T1595 (stocks tasks end)

**Organisation**: Tasks grouped by phase. Phase 64 builds the foundation and all task tools; Phase 65 adds event/stat tools and MCP resources; Phase 66 adds SSE transport and integration documentation.

**Technology Stack**:
- **Runtime**: Node.js 20+ / TypeScript 5.7+
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **HTTP Client**: Axios
- **Validation**: Zod
- **Build**: `tsc`
- **Location**: `apps/life-mcp/` (`@life-manager/mcp`)

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same section

---

## Phase 64: MCP Foundation + Task Tools (Priority: P1)

**Purpose**: Scaffold the MCP server package, implement auth, and expose all task-related tools  
**Estimated Effort**: 2 weeks (30 tasks)  
**Dependencies**: Life Manager API running locally

### Package Setup (Day 1)

- [ ] T1596 [P] Initialise `apps/life-mcp/package.json` as `@life-manager/mcp`; configure `pnpm` workspace entry; add `@modelcontextprotocol/sdk`, `axios`, `zod`, `typescript`, `tsx` as dependencies — 1h
- [ ] T1597 [P] Create `apps/life-mcp/tsconfig.json` extending root tsconfig; set `outDir: dist`, `module: Node16`, `target: ES2022` — 30m
- [ ] T1598 Create `apps/life-mcp/src/index.ts` — entry point that instantiates `McpServer`, registers all tools and resources, and connects stdio transport — 1h
- [ ] T1599 [P] Add `apps/life-mcp` to root `pnpm-workspace.yaml` and root `tsconfig.json` `references` array — 30m
- [ ] T1600 [P] Add `build`, `start`, `dev` scripts to `apps/life-mcp/package.json`; add `mcp:build` and `mcp:start` to root `package.json` — 30m

### Auth Client (Day 1-2)

- [ ] T1601 Create `apps/life-mcp/src/auth/life-manager-auth.ts` — `LifeManagerAuth` class that logs in with `LM_MCP_EMAIL` / `LM_MCP_PASSWORD` env vars on first call, stores JWT + refresh token in memory, and silently refreshes before expiry — 3h
- [ ] T1602 Create `apps/life-mcp/src/api/life-manager-client.ts` — Axios instance pre-configured with `LM_API_BASE_URL`, `Authorization: Bearer <token>` header injected via interceptor using `LifeManagerAuth`, and `User-Agent: LifeManager-MCP/1.0` header — 2h
- [ ] T1603 Add environment variable validation in `apps/life-mcp/src/config.ts` using Zod — fail fast at startup with a clear message if `LM_API_BASE_URL`, `LM_MCP_EMAIL`, or `LM_MCP_PASSWORD` are missing — 1h
- [ ] T1604 Write unit tests for `LifeManagerAuth` (initial login, token refresh, failure handling — 8+ tests) in `apps/life-mcp/src/__tests__/auth.test.ts` — 2h

### Shared Types & Utilities (Day 2)

- [ ] T1605 [P] Create `apps/life-mcp/src/types/task.ts` — TypeScript interfaces for `TaskResult`, `CreateTaskInput`, `UpdateTaskInput`, `SubtaskResult` matching API response shapes — 1h
- [ ] T1606 [P] Create `apps/life-mcp/src/types/event.ts` — TypeScript interfaces for `EventResult`, `CreateEventInput`, `UpdateEventInput` — 1h
- [ ] T1607 [P] Create `apps/life-mcp/src/types/label.ts` and `apps/life-mcp/src/types/stats.ts` — label and statistics response interfaces — 30m
- [ ] T1608 [P] Create `apps/life-mcp/src/utils/format-date.ts` — helper that embeds today's date in tool description strings so the LLM has ambient date context — 30m
- [ ] T1609 [P] Create `apps/life-mcp/src/utils/api-error.ts` — helper that maps API error responses to user-friendly MCP tool error strings — 1h

### Task API Wrapper (Day 3)

- [ ] T1610 Create `apps/life-mcp/src/api/tasks-api.ts` — functions wrapping all task-related API calls: `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`, `searchTasks`, `completeTask`, `addSubtask`; each function typed with Zod-validated inputs — 4h
- [ ] T1611 Write unit tests for `tasks-api.ts` using `axios-mock-adapter` (each function, success + error paths — 16+ tests) — 3h

### Task Tools (Days 3-5)

- [ ] T1612 Implement `list_tasks` tool in `apps/life-mcp/src/tools/tasks/list-tasks.ts` — input schema: `status?`, `priority?`, `labelIds?`, `dueDate?`, `groupId?`, `limit?` (default 20, max 100); output: formatted task list — 2h
- [ ] T1613 Implement `get_task` tool — input: `taskId`; output: full task detail including subtasks and labels — 1h
- [ ] T1614 Implement `create_task` tool — input: `title` (required), `priority?` (1–5, default 3), `dueDate?` (ISO 8601), `notes?`, `labelIds?`, `groupId?`, `reminderAt?`; output: created task — 2h
- [ ] T1615 Implement `update_task` tool — input: `taskId` + any subset of updatable fields; performs a partial update (PATCH semantics); output: updated task — 2h
- [ ] T1616 Implement `complete_task` tool — input: `taskId`; sets status to `Completed`; idempotent (safe to call if already complete); output: confirmation message — 1h
- [ ] T1617 Implement `delete_task` tool — input: `taskId`; output: confirmation; document in tool description that this is irreversible — 1h
- [ ] T1618 Implement `search_tasks` tool — input: `query` (min 2 chars), `limit?` (default 10); output: matching tasks list — 1h
- [ ] T1619 Implement `add_subtask` tool — input: `parentTaskId`, `title`; output: created subtask — 1h
- [ ] T1620 Register all task tools in `apps/life-mcp/src/tools/index.ts` — single function `registerTools(server: McpServer)` called from `index.ts` — 1h
- [ ] T1621 Write Jest tests for each task tool (mocking `tasks-api.ts` — 24+ tests covering happy path + validation errors + API errors) in `apps/life-mcp/src/__tests__/tools/tasks/` — 4h

### Label API + Tools (Day 5)

- [ ] T1622 [P] Create `apps/life-mcp/src/api/labels-api.ts` — `listLabels`, `createLabel` functions — 1h
- [ ] T1623 [P] Implement `list_labels` and `create_label` tools in `apps/life-mcp/src/tools/labels/` — 1h
- [ ] T1624 [P] Write tests for label tools (6+ tests) — 1h

### Phase 64 Integration & Smoke Test (Day 5)

- [ ] T1625 Run the MCP server locally against the dev API; verify all Phase 64 tools work end-to-end via `npx @modelcontextprotocol/inspector` — 1h

---

## Phase 65: Event Tools + Stats Tools + Resources (Priority: P1)

**Purpose**: Complete the MCP surface — events, stats, and MCP resources for ambient context  
**Estimated Effort**: 1.5 weeks (22 tasks)  
**Dependencies**: Phase 64 complete

### Event API Wrapper (Day 1)

- [ ] T1626 Create `apps/life-mcp/src/api/events-api.ts` — `listEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent` functions; `deleteEvent` accepts `deleteMode: 'single' | 'following' | 'all'` for recurring events — 3h
- [ ] T1627 Write unit tests for `events-api.ts` (12+ tests) — 2h

### Event Tools (Days 1-2)

- [ ] T1628 Implement `list_events` tool — input: `startDate`, `endDate`; output: formatted event list with recurrence notes — 2h
- [ ] T1629 Implement `get_event` tool — input: `eventId`; output: full event detail — 1h
- [ ] T1630 Implement `create_event` tool — input: `title`, `startDate`, `endDate`, `allDay?`, `notes?`, `recurrenceRule?` (RRULE string); add RRULE format examples to tool description — 2h
- [ ] T1631 Implement `update_event` tool — input: `eventId` + updatable fields + optional `updateMode` for recurring events — 2h
- [ ] T1632 Implement `delete_event` tool — input: `eventId`, `deleteMode`; document recurrence modes in tool description — 1h
- [ ] T1633 Register event tools in `tools/index.ts` — 30m
- [ ] T1634 Write tests for event tools (20+ tests) — 3h

### Statistics API + Tools (Days 2-3)

- [ ] T1635 [P] Create `apps/life-mcp/src/api/stats-api.ts` — `getWeeklyStats`, `getTaskSummary` functions — 1h
- [ ] T1636 [P] Implement `get_weekly_stats` tool — input: `weekOffset?` (integer, default 0); output: formatted markdown summary with completion rate, tasks completed, streaks — 2h
- [ ] T1637 [P] Implement `get_task_summary` tool — output: counts by status (NotStarted / InProgress / Blocked / Completed) and by priority (P1–P5) — 1h
- [ ] T1638 [P] Register stats tools and write tests (8+ tests) — 1.5h

### User / Settings Tools (Day 3)

- [ ] T1639 [P] Create `apps/life-mcp/src/api/users-api.ts` — `getProfile`, `updateSettings` functions — 1h
- [ ] T1640 [P] Implement `get_profile` tool — output: display name, email, timezone, theme preference — 1h
- [ ] T1641 [P] Implement `update_settings` tool — input: `theme?`, `timezone?`; output: confirmation — 1h
- [ ] T1642 [P] Register user tools and write tests (6+ tests) — 1h

### MCP Resources (Days 3-4)

- [ ] T1643 Create `apps/life-mcp/src/resources/index.ts` — `registerResources(server: McpServer)` called from `index.ts` — 30m
- [ ] T1644 Implement `life-manager://tasks/today` resource — calls `listTasks` filtered to today's due date; returns formatted markdown task list — 2h
- [ ] T1645 Implement `life-manager://tasks/overdue` resource — calls `listTasks` with overdue filter; returns formatted list with days overdue — 2h
- [ ] T1646 Implement `life-manager://events/upcoming` resource — calls `listEvents` for next 7 days; returns day-by-day formatted schedule — 2h
- [ ] T1647 Implement `life-manager://stats/week` resource — calls `getWeeklyStats`; returns markdown summary paragraph — 1h
- [ ] T1648 Write tests for all resources (10+ tests) — 2h

### Phase 65 Integration Test (Day 5)

- [ ] T1649 End-to-end test: launch MCP server against dev API and verify all Phase 65 tools and resources via MCP inspector — 1h

---

## Phase 66: SSE Transport + Integration Docs + Polish (Priority: P2)

**Purpose**: Enable remote/network access via SSE; write setup guides for Claude CLI and Obsidian  
**Estimated Effort**: 1 week (13 tasks)  
**Dependencies**: Phases 64-65 complete

### SSE Transport (Days 1-2)

- [ ] T1650 Add `LM_MCP_TRANSPORT` env var (`stdio` | `sse`, default `stdio`) and `LM_MCP_PORT` (default `3100`); update `config.ts` validation — 1h
- [ ] T1651 Create `apps/life-mcp/src/transports/sse.ts` — Express app with SSE endpoint at `/sse` and POST `/messages`; configure CORS to allow only `localhost` and configured LAN origins — 3h
- [ ] T1652 Update `apps/life-mcp/src/index.ts` — branch on `LM_MCP_TRANSPORT` to connect either `StdioServerTransport` or the SSE transport — 1h
- [ ] T1653 Add SSE port `3100` to `docker-compose.yml` service entry (if MCP server is containerised) — 1h
- [ ] T1654 Write integration tests for SSE transport (connection, tool invocation over SSE, error handling — 6+ tests) — 2h

### Dockerfile & Docker Compose (Day 2)

- [ ] T1655 [P] Create `apps/life-mcp/Dockerfile` — multi-stage build; `node:20-alpine`; copy only `dist/` and `package.json`; non-root user — 1h
- [ ] T1656 [P] Add `life-mcp` service to `docker-compose.yml` (optional `profiles: ["mcp"]`; depends on `life-api`; env vars via `.env`) — 1h

### Integration Guides (Days 3-4)

- [ ] T1657 [P] Write `apps/life-mcp/README.md` — setup instructions, env var reference, running locally, running via Docker — 2h
- [ ] T1658 [P] Write `docs/guides/MCP_SETUP.md` — end-to-end guide: configure Claude CLI `~/.claude.json`, configure Claude Desktop `claude_desktop_config.json`, configure Obsidian (Smart Connections or Text Generator plugin) — 3h
- [ ] T1659 [P] Write `docs/guides/MCP_TOOL_REFERENCE.md` — concise reference for every tool and resource: name, description, inputs, example output — 2h
- [ ] T1660 [P] Write `docs/guides/MCP_SECOND_BRAIN.md` — workflow guide for using Life Manager + Claude CLI + Obsidian as a second brain; include example prompts and multi-tool workflows — 2h

### Polish & Quality (Day 5)

- [ ] T1661 Add graceful shutdown handling (`SIGTERM` / `SIGINT`) — flush in-progress tool calls before exit — 1h
- [ ] T1662 Add structured logging via `console.error` to stderr (MCP protocol requires stdout to be the transport channel for stdio mode) — 1h
- [ ] T1663 Ensure all tool descriptions include the current date context injection (via `format-date.ts` helper) so the LLM has accurate temporal grounding — 1h
- [ ] T1664 Final end-to-end test: Claude CLI session using all tools and resources against the development API; verify correct responses and no auth regressions — 1h
- [ ] T1665 Update `docs/testing/TEST-INVENTORY.md` with MCP server test counts — 30m
- [ ] T1666 Update `CHANGELOG.md` and `VERSION.json` for Phase 64-66 completion — 30m
- [ ] T1667 Commit and tag `v1.2.0` on `develop` — 30m

---

## Task Summary

| Phase | Task Range | Count | Effort |
|-------|-----------|-------|--------|
| Phase 64 — Foundation + Task Tools | T1596–T1625 | 30 | 2 weeks |
| Phase 65 — Event + Stats + Resources | T1626–T1649 | 24 | 1.5 weeks |
| Phase 66 — SSE + Docs + Polish | T1650–T1667 | 18 | 1 week |
| **Total** | **T1596–T1667** | **72** | **~4.5 weeks** |

**Next available task ID**: T1668

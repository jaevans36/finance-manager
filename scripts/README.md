# Development Scripts

PowerShell scripts for common development tasks.

## Available Scripts

### Environment Management

Everything (postgres, life-api, finance-api, web) runs as live-reloading Docker
containers via `docker-compose.yml` + `docker-compose.dev.yml` — no native
`dotnet`/`node` processes on the host. Source edits hot-reload through a bind
mount; a new NuGet/npm package needs a rebuild (`start-dev.ps1` always passes
`--build`, so a plain re-run covers it).

- **start-dev.ps1** - Build and start the full dev stack
- **stop-dev.ps1** - `docker compose down` - stops and removes only this
  project's containers, nothing else on the machine
- **restart-dev.ps1** - Stop then start again (equivalent to running the two
  above back to back) - useful after a config change

### Database Management

- **reset-db.ps1** - Reset development database
  - Drops and recreates the database
  - Applies EF Core migrations
  - Seeds initial data

- **reset-test-db.ps1** - Reset test database
  - Clears test database
  - Applies migrations for testing

### Testing

- **run-tests.ps1** - Run all test suites
  - Executes unit + integration tests for both life-api and finance-api
  - Runs frontend tests with `-Frontend`, E2E with `-E2E`
  - Displays test coverage with `-Coverage`

- **verify.ps1** - Run everything CI (`.github/workflows/ci.yml`) runs, locally
  - Lint + type check (frontend), `dotnet build` for both APIs
  - Full backend + frontend test suites (delegates to `run-tests.ps1`)
  - Also runs automatically as a git pre-push hook (`.husky/pre-push`) — `git push --no-verify` skips it if you need to push through a known-broken state

### Debugging

- **view-logs.ps1** - View and search application logs
  - Display recent log entries
  - Search logs by keyword or level
  - Filter by timestamp

- **create-test-data.ps1** - Generate test data for the weekly progress dashboard
  - Creates 3-5 tasks per day for the current week
  - Assigns random priorities
  - Marks ~60% of tasks as completed
  - Useful for testing the weekly progress dashboard

## Usage

Run scripts from the project root directory:

```powershell
.\scripts\start-dev.ps1
```

## Requirements

- PowerShell 5.1 or later
- Docker Desktop (for Docker-dependent scripts)
- .NET 8.0 SDK
- Node.js and npm

## Notes

- Scripts use the default PowerShell profile and session state
- Environment variables are loaded from `.env` files where applicable
- Check script comments for specific requirements or parameters

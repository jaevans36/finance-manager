# Development Scripts

PowerShell scripts for common development tasks.

## Available Scripts

### Environment Management

- **start-dev.ps1** - Start the complete development environment
  - Starts Docker containers
  - Launches the API backend
  - Starts the frontend development server
  
- **stop-dev.ps1** - Stop all development services
  - Stops frontend and backend servers
  - Stops Docker containers

- **restart-dev.ps1** - Quick restart of development servers
  - Stops and restarts both frontend and backend
  - Useful after configuration changes

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
  - Executes unit tests
  - Runs integration tests
  - Displays test coverage

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

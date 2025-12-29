## Main instructions

- You are GitHub Copilot, an AI-powered code completion tool designed to assist developers by providing relevant code suggestions and completions based on the context of their code.
- Your primary function is to help users write code faster and more efficiently by predicting and generating code snippets that align with their coding style and project requirements.
- You should analyze the provided context and generate code that seamlessly integrates with the existing codebase.
- Ensure that your suggestions adhere to best practices, coding standards, and the specific requirements of the project.
- Always verify that you are using current, non-deprecated packages and APIs. Knowledge cutoff is October 2024.
- When suggesting third-party dependencies or GitHub Actions, verify the latest stable versions and check for deprecation notices.
- Prefer checking official documentation or using web search capabilities to confirm current best practices before making suggestions.

# GitHub Copilot Instructions

# To Do App Specification

This repository contains the specification documents for the To Do application feature, developed as part of the Finance Manager project. The To Do app allows users to manage their tasks with features such as user authentication, task creation, prioritization, and due date management.

The Finance Manager project aims to provide a comprehensive personal finance management solution, and the To Do app serves as a foundational component for task organization and productivity.

The Finance Manager project will accept and import CSV files containing financial transaction data from various banks and financial institutions. The To Do app will focus on task management functionalities, while the Finance Manager project will handle the complexities of CSV parsing, data normalization, and financial analysis.

There will be a dashboard to summarise key financial metrics and insights derived from the imported transaction data, providing users with a clear overview of their financial health.

The application stack will be using React, TypeScript, Vite for the front-end, and Node.js with Express and Prisma ORM for the back-end, connected to a PostgreSQL database.

The back-end will be a .NET Core Web API using C# and Entity Framework Core for database interactions, connected to a SQL Server database.

Project should have testing for both the front-end and the back-end, front-end in the form of Jest and Playwright tests, back-end in the form of xUnit and integration tests.

The application should be well designed with a focus on security, simlicity, and user experience.

Commits and Pull Requests should follow the Conventional Commits specification for consistency and clarity in versioning, they should be no longer than 500 lines of code to facilitate easier reviews.

No secrets or sensitive information should be hardcoded in the codebase; instead, use environment variables or secure vaults to manage such data.

When making code changes or suggestions, please make sure you're using the most up-to-date standards, libraries and frameworks, avoiding any deprecated packages or APIs. Avoid any outdated coding practices that may compromise security or performance for both the front-end and back-end codebases.

When I say 'add this to the spec' or something similar, please add the relevant information and features to the specification documents using speckit conventions.

## Development Scripts

This project uses PowerShell scripts in the `scripts/` directory for all development operations. Always use these scripts instead of running commands directly:

- **start-dev.ps1** - Start the complete development environment (Docker, API, frontend)
- **stop-dev.ps1** - Stop all development services
- **restart-dev.ps1** - Quick restart of development servers
- **reset-db.ps1** - Reset development database and apply migrations
- **reset-test-db.ps1** - Reset test database
- **run-tests.ps1** - Run all test suites
- **view-logs.ps1** - View and search application logs

When testing builds or starting services, use `.\scripts\start-dev.ps1` or `.\scripts\restart-dev.ps1` instead of direct npm/dotnet commands. This ensures consistent environment setup and proper service orchestration.

## Code Integration Guidelines

Before creating new files or components, always check existing patterns in the codebase:

### Backend (C# .NET API)
- **Never create multiple controllers with the same `[Route]` attribute** - ASP.NET Core requires unique route bases per controller
- Before adding a new controller, check if related functionality already exists in an existing controller
- For auth-related endpoints, add them to the existing `AuthController` rather than creating separate controllers
- Pattern: Search for existing controllers in the same feature folder (e.g., `Features/Auth/Controllers/`)
- After adding new endpoints, immediately test using `.\scripts\restart-dev.ps1` to verify routing works

### Frontend (React/TypeScript)
- Check for existing contexts, services, or components before creating new ones
- Follow the established folder structure: `components/`, `contexts/`, `services/`, `pages/`
- Reuse existing styled components and UI library components from `components/ui/`
- Check `authService.ts` or similar service files before adding new API methods
- **CRITICAL: All API services MUST use `apiClient` from `services/api-client.ts`** (never import axios directly)
  * See `apps/web/src/services/README.md` for the service template and examples
  * `apiClient` provides automatic authentication, error handling, and token management

### General Rules
1. **Search first, create second** - Use `grep_search` or `file_search` to find existing patterns
2. **Follow established conventions** - Match the style, structure, and organization of existing code
3. **Test immediately** - After any backend changes, restart dev environment and verify in browser
4. **One feature, one location** - Don't split related functionality across multiple files unnecessarily

## Task Management

When completing work that corresponds to tasks in `specs/001-todo-app/tasks.md`:

1. **Automatically check off completed tasks** - Immediately after implementing a feature or completing work described in tasks.md, update the task list to mark items as complete with `[x]`
2. **Commit task updates** - Include task.md updates in the same commit or create a separate documentation commit
3. **Keep tasks synchronized** - The tasks.md file should always reflect the current state of the project
4. **Add new phases** - If implementing features not in the original spec, add new phase sections with appropriate task IDs

Example workflow:
- User requests to implement username system
- Implement the feature across backend and frontend
- Update tasks.md to mark all related tasks as `[x]` complete
- Commit both code changes and documentation updates

This ensures the task list remains an accurate reflection of project progress and prevents confusion about what has been completed.

## TypeScript Standards

**NEVER use the `any` type in TypeScript code.** This is a critical requirement for type safety and maintainability.

### Error Handling Pattern
Always use `unknown` for catch blocks and perform proper type checking:

```typescript
try {
  // code
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Default message';
  // use message
}
```

**Never write:**
```typescript
catch (error: any) {  // ❌ WRONG
  error.message
}
```

### When You Need Dynamic Types
- Use `unknown` and type guards
- Use generic types (`<T>`)
- Use union types (`string | number`)
- Use proper interface definitions

Avoid the use of 'any' type in TypeScript to ensure type safety and maintainability throughout the codebase.

Any written content should be in British English, not American English. If there are any non British English terms, please convert them accordingly.

## Quickstart Guide

This quickstart guide provides example API requests and expected responses for the To Do application. It covers user registration, authentication, and basic task management operations.

### User Registration

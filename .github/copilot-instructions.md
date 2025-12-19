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

Avoid the use of 'any' type in TypeScript to ensure type safety and maintainability throughout the codebase.

Any written content should be in British English, not American English. If there are any non British English terms, please convert them accordingly.

## Quickstart Guide

This quickstart guide provides example API requests and expected responses for the To Do application. It covers user registration, authentication, and basic task management operations.

### User Registration

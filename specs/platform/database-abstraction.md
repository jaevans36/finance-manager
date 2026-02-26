# Feature Specification: Database Abstraction Layer

**Feature ID**: `008-database-abstraction`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P3  
**Dependencies**: Microservices Architecture

## Overview

Create a platform-level database abstraction module that provides a consistent interface for connecting to and interacting with different database engines (PostgreSQL, SQL Server, MongoDB, MySQL, Firebase/Firestore). This enables microservices to use the most appropriate database technology for their domain whilst maintaining consistent connection management, security, and monitoring across the platform.

## Rationale

As the platform grows, different applications may benefit from different database technologies. The To Do and Finance apps suit relational databases (PostgreSQL), whilst real-time features might benefit from Firebase, and analytics workloads might prefer MongoDB. A consistent abstraction layer prevents each service from implementing its own connection management, ensures security standards are uniformly applied, and simplifies operations.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Connection Management (Priority: P1)

All microservices use a shared connection management module that handles connection pooling, health checks, retry logic, and graceful shutdown — regardless of the underlying database engine.

**Why this priority**: Connection management is the core functionality. Without reliable connections, no database operations are possible.

**Independent Test**: Register connections to PostgreSQL and MongoDB, verify pooling, health checks, automatic reconnection on failure, and graceful connection closure.

**Acceptance Scenarios**:

1. **Given** a microservice starting up, **When** it registers its database connection using the abstraction layer, **Then** a connection pool is established with configurable min/max connections
2. **Given** a registered connection, **When** the service queries the database, **Then** a connection is borrowed from the pool, used, and returned automatically
3. **Given** a database becoming temporarily unavailable, **When** the connection fails, **Then** the abstraction layer retries with exponential backoff (configurable: max retries, initial delay, max delay)
4. **Given** a pool exhaustion scenario, **When** all connections are in use, **Then** requests queue with a configurable timeout and return a clear error if the timeout is exceeded
5. **Given** a microservice shutting down, **When** the shutdown signal is received, **Then** all connections are drained gracefully (in-flight queries complete, no new queries accepted)
6. **Given** multiple database connections, **When** the health check runs, **Then** each connection is tested and its status reported via the health check endpoint

---

### User Story 2 - Multi-Engine Support (Priority: P2)

The abstraction layer supports multiple database engines through a provider pattern, allowing services to connect to PostgreSQL, SQL Server, MongoDB, MySQL, or Firebase whilst using a consistent configuration and lifecycle API.

**Why this priority**: Multi-engine support is the key value proposition of the abstraction layer, but can be rolled out incrementally — PostgreSQL first, others later.

**Independent Test**: Configure connections to two different database engines simultaneously, verify both operate correctly through the same management interface.

**Acceptance Scenarios**:

1. **Given** a configuration specifying PostgreSQL, **When** the provider is initialised, **Then** it uses Npgsql (for .NET) with appropriate pooling and SSL settings
2. **Given** a configuration specifying MongoDB, **When** the provider is initialised, **Then** it uses the MongoDB .NET Driver with appropriate connection string options
3. **Given** a configuration specifying SQL Server, **When** the provider is initialised, **Then** it uses Entity Framework Core's SQL Server provider
4. **Given** a configuration specifying MySQL, **When** the provider is initialised, **Then** it uses Pomelo.EntityFrameworkCore.MySql or MySqlConnector
5. **Given** a configuration specifying Firebase/Firestore, **When** the provider is initialised, **Then** it uses the Google Cloud Firestore SDK with service account authentication
6. **Given** any provider, **When** the service accesses the connection, **Then** it uses the same `IConnectionManager` interface regardless of the underlying engine

---

### User Story 3 - Secure Connection Configuration (Priority: P1)

All database connections are configured securely — connection strings use environment variables or secret vaults, credentials are never logged, and connections use encryption in transit.

**Why this priority**: Security is non-negotiable for database connections. Insecure configurations create critical vulnerabilities.

**Independent Test**: Attempt to log a connection string, verify credentials are masked. Connect with and without SSL, verify SSL is enforced in production.

**Acceptance Scenarios**:

1. **Given** database configuration, **When** connection strings are loaded, **Then** they are read from environment variables or a secret vault — never from source code or config files committed to git
2. **Given** a connection being established, **When** the engine supports SSL/TLS, **Then** encrypted connections are enforced in production and configurable in development
3. **Given** logging enabled, **When** connection events are logged, **Then** passwords and sensitive parameters are masked (e.g., `Host=db-host;Password=****;Database=mydb`)
4. **Given** a connection string validation, **When** required parameters are missing, **Then** the service fails fast on startup with a clear error message indicating what is missing
5. **Given** credential rotation, **When** the secret vault updates credentials, **Then** the connection pool refreshes without downtime

---

### User Story 4 - Migration Management (Priority: P2)

The abstraction layer provides tooling for database schema migrations across all supported relational engines, with version tracking, rollback capability, and migration validation.

**Why this priority**: Consistent migration management prevents schema drift and ensures deployments are repeatable and reversible.

**Independent Test**: Create a migration, apply it to a test database, verify schema changes, roll back, verify the rollback, and confirm version tracking.

**Acceptance Scenarios**:

1. **Given** a developer creating a schema change, **When** they generate a migration using the CLI tool, **Then** a versioned migration file is created with Up and Down methods
2. **Given** a pending migration, **When** the service starts, **Then** the migration is automatically applied (configurable: auto-migrate on startup or require manual trigger)
3. **Given** a failed migration, **When** the Up method throws an error, **Then** the migration is rolled back and the service logs the failure clearly
4. **Given** migration history, **When** a developer checks applied migrations, **Then** they see all applied migrations with timestamps and versions
5. **Given** multiple services, **When** each applies its own migrations, **Then** migrations are scoped to the service's schema — no cross-service migration conflicts

---

### User Story 5 - Connection Monitoring & Observability (Priority: P3)

The abstraction layer exposes metrics and diagnostics for all database connections, enabling operations teams to monitor pool health, query performance, and connection errors.

**Why this priority**: Monitoring is essential for production reliability but the platform can launch without it initially.

**Independent Test**: Verify metrics endpoint returns pool size, active connections, wait time, and query duration. Trigger a connection failure and verify it appears in diagnostics.

**Acceptance Scenarios**:

1. **Given** active database connections, **When** the metrics endpoint is queried, **Then** it returns: pool size, active connections, idle connections, wait queue length, and average checkout time
2. **Given** queries executing, **When** slow query detection is enabled, **Then** queries exceeding the threshold (configurable, default 1s) are logged with the query text and duration
3. **Given** connection errors, **When** a connection fails, **Then** the error is logged with connection details (masked), error type, and suggested remediation
4. **Given** Prometheus integration, **When** the metrics exporter runs, **Then** database metrics are available as Prometheus gauges and histograms
5. **Given** a Grafana dashboard, **When** operators view it, **Then** they see per-service database health including connection pool utilisation, query latency, and error rates

---

## Architecture

### Interface Design

```csharp
// Core abstractions
public interface IConnectionManager
{
    Task<IDbConnection> GetConnectionAsync(string connectionName);
    void RegisterConnection(ConnectionConfig config);
    Task<HealthCheckResult> CheckHealthAsync(string connectionName);
    Task DrainAsync(CancellationToken cancellationToken);
}

public interface IDatabaseProvider
{
    string ProviderName { get; }  // "postgresql", "sqlserver", "mongodb", etc.
    Task<IDbConnection> CreateConnectionAsync(ConnectionConfig config);
    Task<bool> TestConnectionAsync(ConnectionConfig config);
    Task MigrateAsync(MigrationConfig config);
}

public class ConnectionConfig
{
    public string Name { get; set; }              // Logical name: "todo-db", "fitness-db"
    public string Provider { get; set; }          // "postgresql", "sqlserver", "mongodb"
    public string ConnectionString { get; set; }  // From env var / vault
    public PoolConfig Pool { get; set; }
    public RetryConfig Retry { get; set; }
    public bool RequireSsl { get; set; }
}

public class PoolConfig
{
    public int MinSize { get; set; } = 5;
    public int MaxSize { get; set; } = 20;
    public TimeSpan IdleTimeout { get; set; } = TimeSpan.FromMinutes(5);
    public TimeSpan ConnectionTimeout { get; set; } = TimeSpan.FromSeconds(30);
}

public class RetryConfig
{
    public int MaxRetries { get; set; } = 3;
    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(1);
    public TimeSpan MaxDelay { get; set; } = TimeSpan.FromSeconds(30);
}
```

### NuGet Package Structure
```
LifeManager.Data/
├── LifeManager.Data.Abstractions/     # Interfaces, configs
├── LifeManager.Data.PostgreSql/       # PostgreSQL provider
├── LifeManager.Data.SqlServer/        # SQL Server provider
├── LifeManager.Data.MongoDb/          # MongoDB provider
├── LifeManager.Data.MySql/            # MySQL provider
├── LifeManager.Data.Firebase/         # Firebase/Firestore provider
└── LifeManager.Data.Testing/          # In-memory / test helpers
```

## Technical Considerations

### Provider Priorities
1. **PostgreSQL** (immediate): Already in use, migrate existing connections
2. **SQL Server** (Phase 2): Support existing .NET developers familiar with MSSQL
3. **MongoDB** (Phase 3): For document-oriented data (analytics, logs)
4. **MySQL** (Phase 3): Broad compatibility
5. **Firebase** (Phase 4): For real-time features

### Entity Framework Core Integration
- For relational providers, integrate with EF Core's `DbContext`
- Connection pool managed by the abstraction layer, not EF Core directly
- Support EF Core migrations alongside raw SQL migrations

### Performance
- Connection pooling with configurable pool sizes per service
- Prepared statement caching for supported engines
- Batch operations support for bulk inserts/updates
- Read replica support for high-read workloads

### Security
- All connection strings from environment variables or secret vault
- SSL/TLS enforced in production
- Credential rotation without downtime
- Audit logging for connection events
- IP allowlisting for production databases

### Testing
- In-memory providers for unit tests (EF Core InMemory, MongoDb.Driver.InMemory)
- Testcontainers for integration tests (Docker-based ephemeral databases)
- Connection failure simulation for resilience testing

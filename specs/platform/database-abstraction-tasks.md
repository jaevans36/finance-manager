# Tasks: Database Abstraction Layer

**Input**: `specs/platform/database-abstraction.md`  
**Prerequisites**: Microservices architecture  
**Continues from**: T1104 (Weather tasks)

**Organisation**: Tasks grouped by phase for abstraction layer, providers, and monitoring.

**Technology Stack**:
- **Package**: NuGet (.NET) shared across all services
- **Providers**: PostgreSQL (initial), SQL Server, MongoDB
- **Monitoring**: Prometheus metrics, Grafana dashboards

## Format: `[ID] [P?] [Story] Description`

---

## Phase 36: Core Abstraction & PostgreSQL Provider (Priority: P1)

**Purpose**: Create the abstraction interfaces and PostgreSQL provider  
**Estimated Effort**: 1 week (10 tasks)  
**Dependencies**: At least one microservice operational

### Implementation (Week 1)

- [ ] T1105 [P] [US1] Create `LifeManager.Data.Abstractions` project with IConnectionManager, IDatabaseProvider interfaces - 3h
- [ ] T1106 [P] [US3] Create ConnectionConfig, PoolConfig, RetryConfig configuration classes - 2h
- [ ] T1107 [US1] Implement ConnectionManager with pool management, health checks, and retry logic - 6h
- [ ] T1108 [US1] Implement graceful shutdown (drain connections on service stop) - 2h
- [ ] T1109 [US2] Create `LifeManager.Data.PostgreSql` provider using Npgsql with SSL support - 4h
- [ ] T1110 [US3] Implement credential masking for connection string logging - 2h
- [ ] T1111 [US3] Implement connection string validation (fail fast on missing required parameters) - 2h
- [ ] T1112 [US4] Implement migration management via EF Core integration - 3h
- [ ] T1113 [US1-US4] Write unit tests for ConnectionManager, provider, and security (15+ tests) - 3h
- [ ] T1114 [US1-US4] Write integration tests with Testcontainers (PostgreSQL) (10+ tests) - 3h

**Checkpoint**: PostgreSQL provider working, services can migrate to use abstraction layer

---

## Phase 37: Additional Providers & Monitoring (Priority: P2-P3)

**Purpose**: SQL Server/MongoDB providers, Prometheus metrics, Grafana dashboards  
**Estimated Effort**: 1.5 weeks (12 tasks)  
**Dependencies**: Phase 36 complete

### Additional Providers (Week 1, Days 1-3)

- [ ] T1115 [P] [US2] Create `LifeManager.Data.SqlServer` provider using EF Core SQL Server - 3h
- [ ] T1116 [P] [US2] Create `LifeManager.Data.MongoDb` provider using MongoDB .NET Driver - 4h
- [ ] T1117 [P] [US2] Create `LifeManager.Data.Testing` with in-memory providers for unit tests - 3h
- [ ] T1118 [US2] Write integration tests for SQL Server provider with Testcontainers - 3h
- [ ] T1119 [US2] Write integration tests for MongoDB provider with Testcontainers - 3h

### Monitoring & Observability (Week 1, Days 4-5)

- [ ] T1120 [US5] Implement Prometheus metrics exporter (pool size, active connections, checkout time) - 3h
- [ ] T1121 [US5] Implement slow query detection and logging (configurable threshold) - 2h
- [ ] T1122 [US5] Create Grafana dashboard template for database connection health - 3h
- [ ] T1123 [US5] Implement connection error alerting with structured logging - 2h
- [ ] T1124 [US5] Write unit tests for metrics collection and slow query detection (8+ tests) - 2h

### Service Migration (Week 2, Days 1-2)

- [ ] T1125 [US1] Migrate auth service to use LifeManager.Data abstraction layer - 3h
- [ ] T1126 [US1] Migrate todo service to use LifeManager.Data abstraction layer - 3h

**Checkpoint**: Multiple DB providers available, monitoring operational, services migrated

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 36 | Core & PostgreSQL | P1 | T1105-T1114 (10) | 1 week |
| 37 | Providers & Monitoring | P2-P3 | T1115-T1126 (12) | 1.5 weeks |
| **Total** | | | **22 tasks** | **~2.5 weeks** |

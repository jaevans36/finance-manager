# Tasks: Microservices Architecture

**Input**: `specs/platform/microservices-architecture.md`  
**Prerequisites**: Authentication Service extraction (Phase 22)  
**Continues from**: T972 (Auth tasks)

**Organisation**: Tasks grouped by phase for gateway setup, service isolation, and inter-service communication.

**Technology Stack**:
- **Gateway**: .NET Core 8.0 with YARP reverse proxy
- **Event Bus**: RabbitMQ
- **Orchestration**: Docker Compose (dev), Kubernetes-ready

## Format: `[ID] [P?] [Story] Description`

---

## Phase 25: API Gateway (Priority: P1)

**Purpose**: Central entry point routing requests to microservices with auth, rate limiting, and CORS  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Auth service (Phase 22) issuing JWTs

### Backend: Gateway Setup (Week 1)

- [ ] T973 [P] [US1] Create gateway project (`apps/gateway/Gateway.csproj`) with YARP NuGet package - 3h
- [ ] T974 [US1] Configure YARP route definitions for auth, todo, fitness, finance services - 4h
- [ ] T975 [US1] Implement JWT validation middleware using JWKS endpoint from auth service - 3h
- [ ] T976 [US1] Implement rate limiting middleware (per IP and per user) with configurable thresholds - 3h
- [ ] T977 [US1] Implement CORS configuration (allow known frontend origins only) - 1h
- [ ] T978 [US1] Implement request/response logging with correlation IDs - 2h
- [ ] T979 [US1] Implement health check aggregation (query each service's `/health` endpoint) - 3h
- [ ] T980 [US1] Configure circuit breaker pattern for downstream service failures - 3h
- [ ] T981 [US1] Implement 503 fallback responses when services are unavailable - 2h
- [ ] T982 [US1] Write unit tests for gateway middleware (rate limiting, auth, routing) (12+ tests) - 3h
- [ ] T983 [US1] Write integration tests for end-to-end routing through gateway (10+ tests) - 3h

### Infrastructure (Week 1, Days 4-5)

- [ ] T984 [P] [US1] Add gateway service to docker-compose.yml as the single entry point (port 5000) - 2h
- [ ] T985 [US1] Update frontend apiClient base URL to point to gateway - 1h
- [ ] T986 [US1] Create health check dashboard endpoint (aggregated service status) - 2h

**Checkpoint**: All API traffic routes through the gateway with authentication and rate limiting

---

## Phase 26: Service Isolation & Health Checks (Priority: P1)

**Purpose**: Standardise service health endpoints and ensure independent operation  
**Estimated Effort**: 1 week (10 tasks)  
**Dependencies**: Phase 25 gateway operational

### Backend: Health & Independence (Week 1)

- [ ] T987 [P] [US2/US3] Create shared `LifeManager.Common` NuGet package with health check base, logging config - 3h
- [ ] T988 [US3] Implement standardised `/health` endpoint for auth service (DB connectivity, uptime, version) - 2h
- [ ] T989 [P] [US3] Implement standardised `/health` endpoint for todo service - 2h
- [ ] T990 [P] [US3] Implement standardised `/health` endpoint for fitness service - 2h
- [ ] T991 [US2] Implement graceful shutdown handling in each service (drain connections, complete in-flight requests) - 3h
- [ ] T992 [US3] Create service registry configuration (name, port, health endpoint) in gateway - 2h
- [ ] T993 [US2] Test service independence: stop one service, verify others continue operating - 3h
- [ ] T994 [US3] Implement health check alerting (log warning when service degrades) - 2h
- [ ] T995 [US2/US3] Write integration tests for service isolation and health checks (8+ tests) - 3h
- [ ] T996 [US3] Create admin dashboard API endpoint showing all service statuses - 2h

**Checkpoint**: All services have health checks, operate independently, and report status to gateway

---

## Phase 27: Event Bus & Inter-Service Communication (Priority: P2)

**Purpose**: Asynchronous event-driven communication between services  
**Estimated Effort**: 1.5 weeks (12 tasks)  
**Dependencies**: Phase 25 gateway, Phase 26 health checks

### Backend: Event Bus Infrastructure (Week 1)

- [ ] T997 [P] [US4] Add RabbitMQ to docker-compose.yml with management UI - 2h
- [ ] T998 [US4] Create shared event abstractions NuGet package (`LifeManager.Events`) with CloudEvents format - 4h
- [ ] T999 [US4] Implement RabbitMQ publisher service (publish events with routing keys) - 3h
- [ ] T1000 [US4] Implement RabbitMQ consumer service (subscribe, retry, dead letter queue) - 4h
- [ ] T1001 [US4] Implement idempotency handler (track processed event IDs, skip duplicates) - 3h
- [ ] T1002 [US4] Define core events: TaskCompleted, HabitCompleted, UserRegistered, GoalAchieved - 2h
- [ ] T1003 [US4] Implement TaskCompleted → HabitCompleted cross-service event flow (todo→fitness) - 4h
- [ ] T1004 [US4] Write unit tests for event publisher, consumer, and idempotency (12+ tests) - 3h
- [ ] T1005 [US4] Write integration tests for event bus with RabbitMQ (8+ tests) - 3h

### Backend: BFF Layer (Week 1, Days 4-5)

- [ ] T1006 [US5] Implement Backend-for-Frontend endpoint in gateway for platform dashboard aggregation - 4h
- [ ] T1007 [US5] Implement circuit breaker for partial data (return available data when one service is slow) - 3h
- [ ] T1008 [US5] Write integration tests for BFF aggregation and partial failure handling (6+ tests) - 3h

**Checkpoint**: Services communicate via events, dashboard aggregates cross-service data

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 25 | API Gateway | P1 | T973-T986 (14) | 1.5 weeks |
| 26 | Service Isolation | P1 | T987-T996 (10) | 1 week |
| 27 | Event Bus & BFF | P2 | T997-T1008 (12) | 1.5 weeks |
| **Total** | | | **36 tasks** | **~4 weeks** |

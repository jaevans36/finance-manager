# Feature Specification: Microservices Architecture

**Feature ID**: `005-microservices-architecture`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P1  
**Dependencies**: Authentication Service

## Overview

Transform the Life Manager platform from its current monolith (Finance API serving all routes) into a microservices architecture where each application domain (To Do, Fitness, Finance, Weather) operates as an independent service with its own database, API, and deployment lifecycle. A central API gateway routes requests, handles authentication, and provides cross-cutting concerns.

## Rationale

As the platform grows beyond the To Do application, a monolithic architecture becomes a bottleneck for development velocity, deployment flexibility, and scalability. Microservices allow independent teams to develop, deploy, and scale each application without affecting others. The gateway provides a unified entry point for clients whilst abstracting the service topology.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - API Gateway & Request Routing (Priority: P1)

All client requests pass through a central API gateway that routes requests to the appropriate microservice based on the URL path, handles authentication, and provides cross-cutting concerns (logging, rate limiting, CORS).

**Why this priority**: The gateway is the foundational infrastructure component. Without it, individual services cannot be accessed by clients.

**Independent Test**: Send requests to the gateway for multiple services, verify correct routing, authentication enforcement, and error handling for service unavailability.

**Acceptance Scenarios**:

1. **Given** a client request to `/api/v1/tasks/*`, **When** the gateway receives it, **Then** it routes to the To Do microservice
2. **Given** a client request to `/api/v1/fitness/*`, **When** the gateway receives it, **Then** it routes to the Fitness microservice
3. **Given** a client request to `/api/v1/finance/*`, **When** the gateway receives it, **Then** it routes to the Finance microservice
4. **Given** a client request to `/api/v1/weather/*`, **When** the gateway receives it, **Then** it routes to the Weather microservice
5. **Given** a client request to `/api/v1/auth/*`, **When** the gateway receives it, **Then** it routes to the Auth microservice
6. **Given** a client request with a valid JWT, **When** the gateway receives it, **Then** the token is validated before routing (using the auth service's JWKS endpoint)
7. **Given** a target microservice that is unavailable, **When** the gateway fails to route, **Then** it returns a 503 Service Unavailable with a descriptive error message
8. **Given** a client exceeding the rate limit, **When** they send additional requests, **Then** the gateway returns 429 Too Many Requests

---

### User Story 2 - Service Independence & Isolation (Priority: P1)

Each microservice operates independently with its own database, configuration, and deployment pipeline, ensuring that failures in one service do not cascade to others.

**Why this priority**: Service isolation is a core architectural requirement. Without it, the platform gains complexity without the benefits of microservices.

**Independent Test**: Stop one microservice, verify all other services continue operating normally. Deploy a new version of one service without downtime on others.

**Acceptance Scenarios**:

1. **Given** the Fitness service is down, **When** a user accesses the To Do application, **Then** To Do functions normally and the user sees a non-disruptive message about Fitness being temporarily unavailable
2. **Given** each microservice has its own database, **When** a database migration runs for one service, **Then** other services are unaffected
3. **Given** a microservice needs updating, **When** a new version is deployed, **Then** deployment is independent of other services and uses blue-green or rolling deployment
4. **Given** a microservice experiencing high load, **When** auto-scaling triggers, **Then** only that specific service scales — other services remain unchanged
5. **Given** a service producing events, **When** it publishes to the event bus, **Then** other services consume events asynchronously without direct coupling

---

### User Story 3 - Health Checks & Service Discovery (Priority: P2)

The platform monitors the health of all microservices with standardised health check endpoints, service registration, and automated alerting when services degrade.

**Why this priority**: Observability is essential for maintaining a microservices platform, but the platform can function without it initially.

**Independent Test**: Call health check endpoints on each service, verify responses, simulate a degraded service, confirm alerts are triggered.

**Acceptance Scenarios**:

1. **Given** each microservice, **When** the gateway queries `/health`, **Then** the service responds with its health status including database connectivity, dependencies, and uptime
2. **Given** a microservice reporting unhealthy, **When** the gateway detects the failure, **Then** it routes to healthy instances and triggers an alert
3. **Given** the admin dashboard, **When** an administrator views service health, **Then** all registered services are displayed with status, uptime, response times, and error rates
4. **Given** a new microservice being deployed, **When** it starts, **Then** it registers itself with the service registry and becomes available for routing
5. **Given** a microservice shutting down gracefully, **When** it deregisters, **Then** the gateway stops routing to it and in-flight requests complete normally

---

### User Story 4 - Event Bus & Inter-Service Communication (Priority: P2)

Services communicate asynchronously via an event bus for cross-domain operations (e.g., a completed task triggering a habit update in the Fitness app). Synchronous communication uses well-defined service-to-service APIs.

**Why this priority**: Inter-service communication is needed for platform integration features, but individual services can function without it initially.

**Independent Test**: Publish an event from Service A, verify Service B receives and processes it. Test event replay, dead letter queues, and idempotency.

**Acceptance Scenarios**:

1. **Given** a user completing a task in To Do, **When** the task is linked to a fitness habit, **Then** a `TaskCompleted` event is published and the Fitness service marks the habit as completed for the day
2. **Given** an event published to the bus, **When** the consuming service is temporarily unavailable, **Then** the event is retained in the queue and delivered when the service recovers
3. **Given** a failed event processing, **When** retries are exhausted, **Then** the event moves to a dead letter queue for manual investigation
4. **Given** an event received multiple times (due to retry), **When** the consumer processes it, **Then** idempotency ensures no duplicate side effects
5. **Given** a new service subscribing to existing events, **When** it registers interest, **Then** it receives only new events (not historical replay unless explicitly requested)

---

### User Story 5 - Shared Data Access Patterns (Priority: P3)

Cross-service data queries (e.g., a dashboard showing data from To Do, Fitness, and Finance) use the API composition pattern or a Backend-for-Frontend (BFF) layer rather than direct database access.

**Why this priority**: Cross-service data aggregation is a complex concern that should be addressed after core service isolation is established.

**Independent Test**: Request the platform dashboard, verify it aggregates data from multiple services via the BFF layer, test failure handling when one service is unavailable.

**Acceptance Scenarios**:

1. **Given** a user viewing the platform dashboard, **When** it loads, **Then** a BFF endpoint aggregates data from To Do, Fitness, and Finance services into a single response
2. **Given** one service being slow, **When** the BFF aggregates data, **Then** it uses circuit breaker patterns to return partial data with degraded indicators rather than failing entirely
3. **Given** a cross-service query, **When** the BFF needs user data, **Then** it includes the user's JWT in service-to-service requests for authorisation
4. **Given** a cross-service operation (e.g., linking a task to a habit), **When** the operation spans two services, **Then** eventual consistency is maintained via the event bus (not distributed transactions)

---

## Architecture Diagram

```
                    ┌──────────────┐
                    │   Frontend   │
                    │   (React)    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  API Gateway │
                    │   (YARP/.NET)│
                    └──────┬───────┘
           ┌───────────────┼───────────────┐───────────────┐
           │               │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼───────┐
    │  Auth Svc   │ │  Todo Svc   │ │ Fitness Svc │ │ Finance Svc │
    │  (.NET)     │ │  (.NET)     │ │  (.NET)     │ │   (.NET)    │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Auth DB    │ │  Todo DB    │ │ Fitness DB  │ │ Finance DB  │
    │ (PostgreSQL)│ │ (PostgreSQL)│ │ (PostgreSQL)│ │ (PostgreSQL)│
    └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Event Bus   │
                    │ (RabbitMQ)   │
                    └──────────────┘
```

## Technical Considerations

### Gateway Technology
- **YARP (Yet Another Reverse Proxy)**: Microsoft's .NET-native reverse proxy, ideal for .NET Core APIs
- Alternative: Ocelot for simpler requirements
- Handles: routing, authentication, rate limiting, load balancing, request/response transformation

### Event Bus
- **RabbitMQ** for message queuing (or Azure Service Bus for cloud deployment)
- Events use CloudEvents specification for interoperability
- Each service has its own exchange/queue for isolation
- Dead letter exchange for failed message handling

### Service Communication
- **Asynchronous**: Event bus for state changes (preferred)
- **Synchronous**: REST HTTP calls between services (use sparingly)
- **gRPC**: Consider for high-throughput internal communication

### Database Strategy
- Each service owns its database schema — no shared databases
- PostgreSQL for all services (initially)
- Database-per-service enables independent migrations and scaling
- Cross-service data: use the event bus to replicate needed data

### Deployment
- Docker containers for each service
- Docker Compose for local development
- Kubernetes (or Azure Container Apps) for production
- CI/CD pipeline per service (independent deployment)
- Health checks and readiness probes for orchestration

### Configuration
- Centralised configuration (e.g., HashiCorp Consul or Azure App Configuration)
- Service-specific `.env` files for local development
- Secrets managed via vault or environment variables

### Observability
- **Logging**: Structured logging with correlation IDs across services (Serilog → Seq/ELK)
- **Metrics**: Prometheus + Grafana for service metrics
- **Tracing**: OpenTelemetry for distributed tracing across service boundaries
- **Alerting**: PagerDuty or Alertmanager for service health alerts

### Migration Strategy (Monolith → Microservices)
1. **Phase 1**: Extract Auth service from monolith
2. **Phase 2**: Set up API gateway, route existing traffic through it
3. **Phase 3**: New services (Fitness, Finance) deploy as independent microservices
4. **Phase 4**: Extract To Do from monolith into its own service
5. **Phase 5**: Decommission monolith, event bus for inter-service communication

# Tasks: Authentication Service

**Input**: `specs/platform/authentication-service.md`  
**Prerequisites**: Existing auth in Finance API  
**Continues from**: T924 (Fitness tasks)

**Organisation**: Tasks grouped by phase for the auth service extraction and OAuth implementation.

**Technology Stack**:
- **Backend**: .NET Core 8.0 Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React 18 with TypeScript

## Format: `[ID] [P?] [Story] Description`

---

## Phase 22: Auth Service Extraction (Priority: P1)

**Purpose**: Extract authentication from the monolith into a standalone microservice  
**Estimated Effort**: 2 weeks (18 tasks)  
**Dependencies**: None (can start immediately)

### Backend: Service Setup (Week 1, Days 1-3)

- [ ] T925 [P] [US2] Create Auth microservice project (`apps/auth-api/AuthApi.csproj`) with EF Core - 3h
- [ ] T926 [P] [US2] Define User, RefreshToken, ActiveSession entities (migrate from Finance API) - 3h
- [ ] T927 [US2] Create AuthDbContext with migrated entities - 2h
- [ ] T928 [US2] Create EF Core migration for Auth tables - 1h
- [ ] T929 [US2] Implement RS256 JWT token issuing (access + refresh tokens) - 4h
- [ ] T930 [US2] Implement JWKS endpoint (GET `/.well-known/jwks`) for public key distribution - 3h
- [ ] T931 [US2] Implement token refresh with rotation (revoke old, issue new) - 3h
- [ ] T932 [US2] Implement token introspection endpoint for service-to-service validation - 2h
- [ ] T933 [US2] Migrate existing register/login/logout endpoints to auth service - 4h
- [ ] T934 [US2] Implement active session tracking (device info, IP, last active) - 3h
- [ ] T935 [US2] Write unit tests for JWT service, token refresh, session management (15+ tests) - 3h
- [ ] T936 [US2] Write integration tests for auth endpoints (12+ tests) - 3h

### Frontend: Auth Service Integration (Week 1, Days 4-5)

- [ ] T937 [P] [US2] Update authService to point to auth microservice endpoints - 2h
- [ ] T938 [US2] Implement automatic token refresh with 401 retry in apiClient interceptor - 3h
- [ ] T939 [US2] Update AuthContext to use new token format and refresh flow - 2h

### Infrastructure (Week 2, Day 1)

- [ ] T940 [P] [US2] Add auth-api service to docker-compose.yml with its own PostgreSQL database - 2h
- [ ] T941 [US2] Configure API gateway to route `/api/v1/auth/*` to auth service - 2h
- [ ] T942 [US2] Data migration script to move user data from Finance DB to Auth DB - 3h

**Checkpoint**: Standalone auth service issuing JWTs validated by other services via JWKS

---

## Phase 23: OAuth 2.0 Integration (Priority: P1)

**Purpose**: Third-party login via Google, GitHub, Facebook, Microsoft  
**Estimated Effort**: 2 weeks (16 tasks)  
**Dependencies**: Phase 22 complete

### Backend: OAuth Providers (Week 1)

- [ ] T943 [P] [US1] Define OAuthConnection entity in `apps/auth-api/Data/Entities/` - 2h
- [ ] T944 [US1] Create EF Core migration for OAuthConnection table - 1h
- [ ] T945 [US1] Implement OAuthService (initiate flow, handle callback, link/unlink accounts) - 6h
- [ ] T946 [US1] Implement Google OAuth provider (OpenID Connect, consent screen redirect, token exchange) - 4h
- [ ] T947 [US1] Implement GitHub OAuth provider (GitHub OAuth Apps, code exchange) - 3h
- [ ] T948 [US1] Implement Facebook OAuth provider (Facebook Login, token exchange) - 3h
- [ ] T949 [US1] Implement Microsoft OAuth provider (Microsoft Identity Platform) - 3h
- [ ] T950 [US1] Implement account linking (link OAuth to existing account with email match) - 3h
- [ ] T951 [US1] Implement account unlinking with safety checks (prevent removing sole login method) - 2h
- [ ] T952 [US1] Write unit tests for OAuthService (12+ tests) - 3h
- [ ] T953 [US1] Write integration tests for OAuth flow (mocked providers) (10+ tests) - 3h

### Frontend: OAuth UI (Week 2, Days 1-3)

- [ ] T954 [P] [US1] Create OAuth TypeScript interfaces (OAuthProvider, OAuthConnection) - 1h
- [ ] T955 [US1] Add "Continue with Google/GitHub/Facebook/Microsoft" buttons to login/register pages - 3h
- [ ] T956 [US1] Create ConnectedAccounts settings section (view, link, unlink providers) - 3h
- [ ] T957 [US1] Write Jest tests for OAuth login UI (6+ tests) - 2h
- [ ] T958 [US1] Write E2E test for complete OAuth login flow (mocked provider) - 3h

**Checkpoint**: Users can register/login via Google, GitHub, Facebook, Microsoft & manage linked accounts

---

## Phase 24: Session Management & MFA (Priority: P2-P3)

**Purpose**: Active session management, multi-factor authentication  
**Estimated Effort**: 1.5 weeks (14 tasks)  
**Dependencies**: Phase 22 complete

### Backend: Sessions & MFA (Week 1)

- [ ] T959 [US3] Implement SessionsController (list active, revoke specific, revoke all) - 3h
- [ ] T960 [US3] Add approximate geolocation from IP (using MaxMind GeoLite2 or similar) - 3h
- [ ] T961 [US4] Implement TOTP service (secret generation, QR code, code verification) - 4h
- [ ] T962 [US4] Implement MFA enable/disable/verify endpoints in AuthController - 3h
- [ ] T963 [US4] Implement backup codes generation and consumption - 2h
- [ ] T964 [US4] Update login flow to check MFA requirement and prompt for second factor - 3h
- [ ] T965 [US3/US4] Write unit tests for session and MFA services (12+ tests) - 3h
- [ ] T966 [US3/US4] Write integration tests for session and MFA endpoints (10+ tests) - 3h

### Frontend: Sessions & MFA UI (Week 1, Days 4-5)

- [ ] T967 [US3] Create ActiveSessions component (device list, revoke buttons, location display) - 4h
- [ ] T968 [US4] Create MFASetup component (QR code display, code verification, backup codes) - 4h
- [ ] T969 [US4] Create MFAChallenge component (TOTP input during login, backup code option) - 3h
- [ ] T970 [US3/US4] Write Jest tests for Sessions and MFA components (8+ tests) - 2h
- [ ] T971 [US3] Write E2E test for session management flow - 2h
- [ ] T972 [US4] Write E2E test for MFA setup and login flow - 3h

**Checkpoint**: Users can view/revoke sessions and enable TOTP-based MFA

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 22 | Auth Extraction | P1 | T925-T942 (18) | 2 weeks |
| 23 | OAuth Integration | P1 | T943-T958 (16) | 2 weeks |
| 24 | Sessions & MFA | P2-P3 | T959-T972 (14) | 1.5 weeks |
| **Total** | | | **48 tasks** | **~5.5 weeks** |

# Feature Specification: Centralised Authentication Service

**Feature ID**: `004-auth-service`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P1  
**Dependencies**: Microservices Architecture

## Overview

Evolve the existing authentication system into a standalone, centralised authentication microservice that handles user identity, authentication, and authorisation across all applications in the Life Manager platform. This service becomes the single source of truth for user identity and access control.

## Rationale

The current authentication is embedded within the Finance API (monolith). As the platform expands to include Fitness, Finance, Weather, and other applications, each requires consistent authentication. A centralised auth service eliminates duplication, ensures consistent security policies, and enables single sign-on (SSO) across all microservices.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - OAuth 2.0 Third-Party Login (Priority: P1)

Users can register and log in using their existing Google, Facebook, GitHub, or Microsoft accounts, reducing friction and eliminating password fatigue.

**Why this priority**: OAuth is increasingly expected by users and significantly reduces registration abandonment. It also improves security by delegating credential management to major providers.

**Independent Test**: Initiate OAuth flow with each provider, complete authentication, verify account creation/linking, and successful session establishment.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they click "Continue with Google", **Then** they are redirected to Google's OAuth consent screen and upon approval, an account is created and they are logged in
2. **Given** a user with an existing account, **When** they log in via OAuth with a matching email, **Then** the OAuth provider is linked to their existing account (after email verification)
3. **Given** a user with linked OAuth providers, **When** they view their profile settings, **Then** they see all linked providers with the option to unlink any that isn't their sole login method
4. **Given** a user logged in via OAuth, **When** they want to add a password for direct login, **Then** they can set a password in their profile settings
5. **Given** a user attempting to link an OAuth provider already associated with another account, **When** they complete the OAuth flow, **Then** they receive a clear error explaining the conflict
6. **Given** a user logged in with OAuth, **When** their OAuth session is valid, **Then** they can access all platform applications without re-authenticating

**Supported Providers** (initial):
- Google (OpenID Connect)
- Facebook (Facebook Login)
- GitHub (GitHub OAuth Apps)
- Microsoft (Microsoft Identity Platform)

**Enhancement**: Apple Sign-In, LinkedIn, X (Twitter) OAuth support.

---

### User Story 2 - JWT Token Management Across Microservices (Priority: P1)

The authentication service issues JWTs that are accepted and validated by all microservices in the platform, providing seamless cross-service authentication.

**Why this priority**: JWT-based auth is the foundation for the microservices architecture. Without it, services cannot verify user identity and authorisation.

**Independent Test**: Obtain a JWT from the auth service, use it to access endpoints on multiple microservices, verify token validation, refresh, and expiry handling.

**Acceptance Scenarios**:

1. **Given** a user authenticating via login or OAuth, **When** authentication succeeds, **Then** the auth service issues an access token (short-lived, 15 min) and a refresh token (long-lived, 7 days)
2. **Given** a valid access token, **When** a microservice receives a request with the token in the Authorization header, **Then** it validates the token by checking the signature against the auth service's public key (JWKS endpoint)
3. **Given** an expired access token, **When** the frontend detects a 401 response, **Then** it automatically uses the refresh token to obtain a new access token without user intervention
4. **Given** a compromised or revoked refresh token, **When** it is used to request a new access token, **Then** the request is rejected and the user is redirected to login
5. **Given** a user logging out, **When** they click logout, **Then** the refresh token is revoked server-side and the access token is removed client-side
6. **Given** the auth service, **When** any microservice needs to validate a token, **Then** it uses asymmetric key verification (RS256) via the JWKS endpoint — no shared secrets between services
7. **Given** a user's role or permissions change, **When** they next refresh their token, **Then** the new access token contains updated claims

---

### User Story 3 - Account Linking & Management (Priority: P2)

Users can manage their authentication methods — linking/unlinking OAuth providers, managing passwords, viewing active sessions, and configuring security settings.

**Why this priority**: Users need control over their security settings, but this builds on core authentication functionality.

**Independent Test**: Link a new OAuth provider, unlink an existing one, change password, view active sessions, and revoke a specific session.

**Acceptance Scenarios**:

1. **Given** a user on the security settings page, **When** they view their connected accounts, **Then** all linked OAuth providers and login methods are displayed
2. **Given** a user with password + OAuth login, **When** they unlink an OAuth provider, **Then** the provider is removed and they can still log in via password
3. **Given** a user with only OAuth login, **When** they attempt to unlink their sole provider, **Then** they are prevented until they set a password or link another provider
4. **Given** a user, **When** they view active sessions, **Then** all active sessions are listed with device info, IP, location (approximate), and last active time
5. **Given** a user viewing active sessions, **When** they revoke a specific session, **Then** that session's refresh token is invalidated and the device is logged out
6. **Given** a user, **When** they click "Sign out everywhere", **Then** all refresh tokens are revoked and all devices are logged out

---

### User Story 4 - Multi-Factor Authentication (Priority: P3)

Users can enable MFA using TOTP (authenticator apps), SMS, or email verification for additional security on their accounts.

**Why this priority**: MFA significantly improves account security but is an optional enhancement. Core auth must work first.

**Independent Test**: Enable TOTP MFA, log out, log back in with password + TOTP code, verify backup codes work, disable MFA.

**Acceptance Scenarios**:

1. **Given** a user on security settings, **When** they enable MFA, **Then** they can choose between authenticator app (TOTP), SMS, or email verification
2. **Given** a user setting up TOTP, **When** they scan the QR code with their authenticator app, **Then** they must enter a valid code to confirm setup and receive backup codes
3. **Given** a user with MFA enabled, **When** they log in with correct credentials, **Then** they are prompted for a second factor before access is granted
4. **Given** a user with MFA enabled who has lost their device, **When** they use a backup code, **Then** they are logged in and the backup code is consumed
5. **Given** a user who has lost all MFA methods, **When** they contact support, **Then** an admin can initiate an identity verification and MFA reset process

---

## Data Model

### Core Entities

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string | null;       // Null for OAuth-only users
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaMethod: 'totp' | 'sms' | 'email' | null;
  mfaSecret: string | null;          // Encrypted TOTP secret
  backupCodes: string[] | null;      // Encrypted
  role: 'user' | 'admin';
  profileImageUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OAuthConnection {
  id: string;
  userId: string;
  provider: 'google' | 'facebook' | 'github' | 'microsoft';
  providerUserId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  accessToken: string;               // Encrypted
  refreshToken: string | null;       // Encrypted
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RefreshToken {
  id: string;
  userId: string;
  token: string;                     // Hashed
  deviceInfo: string | null;
  ipAddress: string | null;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  refreshTokenId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  approximateLocation: string | null;
  lastActiveAt: string;
  createdAt: string;
}
```

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register              Register with email/password
POST   /api/v1/auth/login                 Login with email/password
POST   /api/v1/auth/logout                Logout (revoke refresh token)
POST   /api/v1/auth/refresh               Refresh access token
GET    /api/v1/auth/me                    Get current user
POST   /api/v1/auth/forgot-password       Request password reset
POST   /api/v1/auth/reset-password        Reset password with token
POST   /api/v1/auth/verify-email          Verify email address
```

### OAuth
```
GET    /api/v1/auth/oauth/:provider        Initiate OAuth flow (redirect)
GET    /api/v1/auth/oauth/:provider/callback  OAuth callback handler
POST   /api/v1/auth/oauth/:provider/link     Link OAuth to existing account
DELETE /api/v1/auth/oauth/:provider/unlink   Unlink OAuth provider
GET    /api/v1/auth/oauth/connections        List linked providers
```

### MFA
```
POST   /api/v1/auth/mfa/enable             Enable MFA
POST   /api/v1/auth/mfa/verify             Verify MFA code during login
POST   /api/v1/auth/mfa/disable            Disable MFA
GET    /api/v1/auth/mfa/backup-codes       Generate new backup codes
```

### Sessions
```
GET    /api/v1/auth/sessions               List active sessions
DELETE /api/v1/auth/sessions/:id           Revoke specific session
DELETE /api/v1/auth/sessions               Revoke all sessions
```

### Service-to-Service
```
GET    /api/v1/auth/.well-known/jwks       JWKS public keys for token validation
POST   /api/v1/auth/introspect             Token introspection (service-to-service)
```

## Technical Considerations

### Token Strategy
- **Access Token**: RS256-signed JWT, 15-minute expiry, contains user ID, email, roles, permissions
- **Refresh Token**: Opaque token stored server-side (not JWT), 7-day expiry, rotated on use
- **JWKS Endpoint**: Public keys for all microservices to validate tokens independently

### Security
- Passwords hashed with BCrypt (work factor 12+)
- TOTP secrets encrypted at rest (AES-256-GCM)
- Refresh tokens stored as bcrypt hashes (not plaintext)
- Rate limiting on login (5 attempts per 15 minutes per IP)
- Account lockout after 10 consecutive failures (30-minute cooldown)
- CORS restricted to known frontend origins
- HTTPS-only in production
- Secure cookie settings (HttpOnly, SameSite=Strict, Secure)

### OAuth Provider Configuration
- Client IDs/secrets stored in environment variables or secret vault
- Callback URLs registered per environment (dev, staging, prod)
- Scopes requested: email, profile (minimum necessary)

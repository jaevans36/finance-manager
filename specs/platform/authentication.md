# Platform Authentication & User Management

**Created**: 2026-01-07  
**Status**: Active  
**Scope**: Platform-wide (shared by all applications)

## Overview

The Finance Manager platform uses a centralized authentication system shared by all applications. User accounts, sessions, and permissions are managed at the platform level.

## Features

This specification covers authentication features that were originally part of the To Do application but have been extracted as platform-wide functionality:

### Implemented (Phase 1)

- ✅ User registration with email and password
- ✅ User login with JWT token generation
- ✅ Session management with token refresh
- ✅ Logout functionality
- ✅ Protected routes requiring authentication

### Phase 1 Enhancements (spec-v2-enhancements.md)

- Password reset via email (User Story 1.1)
- Email verification for new accounts (User Story 1.2)
- Session management & security (User Story 1.3)
- Profile image management (User Story 6.9)

## User Registration & Authentication

See original `applications/todo/spec.md` User Story 1 for detailed acceptance scenarios.

### API Endpoints

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
```

### JWT Token Structure

```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "user",
  "iat": 1704672000,
  "exp": 1704758400
}
```

**Token Expiry**: 24 hours  
**Storage**: localStorage + HTTP-only cookie  
**Refresh**: Automatic on API 401 responses

## Password Reset via Email

**User Story 1.1** from spec-v2-enhancements.md Phase 1

### Key Features

- Users can request password reset via email
- Secure token generated with 1-hour expiry
- Email sent with reset link
- User sets new password, old tokens invalidated
- Expired links show clear error message

### API Endpoints

```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/validate-reset-token/:token
```

### Email Template

Subject: Reset Your Password

```
Hi {{username}},

You requested to reset your password for Finance Manager.

Click the link below to set a new password:
{{resetLink}}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Thanks,
Finance Manager Team
```

## Email Verification

**User Story 1.2** from spec-v2-enhancements.md Phase 1

### Key Features

- New users receive verification email immediately
- Account access restricted until verified
- Verification link expires after 24 hours
- Users can request new verification email
- Old verification links invalidated when new one requested

### API Endpoints

```
POST /api/v1/auth/verify-email/:token
POST /api/v1/auth/resend-verification
```

### Database Schema

```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verification_token_expires TIMESTAMP;
```

## Session Management & Security

**User Story 1.3** from spec-v2-enhancements.md Phase 1

### Key Features

- Concurrent session management (max 5 devices)
- Session tracking with device info and IP address
- Manual session termination ("Sign out all devices")
- Automatic session cleanup (expired sessions removed)
- Admin can force logout users

### Database Schema

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_info TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

### API Endpoints

```
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:sessionId
DELETE /api/v1/auth/sessions/all
```

## Profile Image Management

**User Story 6.9** from spec-v2-enhancements.md Phase 6

### Key Features

- Upload profile images (JPEG, PNG, WebP)
- Maximum 5MB file size
- Automatic resize and thumbnail generation (512px, 128px, 64px, 32px)
- Image optimization (WebP conversion, metadata stripping)
- Avatar displayed throughout platform (info bar, comments, admin panel)
- Fallback to initials if no image uploaded

### Database Schema

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN avatar_updated_at TIMESTAMP;

-- Profile images storage
CREATE TABLE user_profile_images (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_512_path VARCHAR(500),
  thumbnail_128_path VARCHAR(500),
  thumbnail_64_path VARCHAR(500),
  thumbnail_32_path VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profile_images_updated ON user_profile_images(updated_at DESC);
```

### API Endpoints

```
POST   /api/v1/user/profile/avatar          (Upload new avatar)
DELETE /api/v1/user/profile/avatar          (Remove avatar)
GET    /api/v1/user/profile/avatar/:size    (Get specific size)
GET    /api/v1/user/:userId/avatar/:size    (Public: view other users)
```

### File Storage

**Development**: Local filesystem (`/uploads/avatars`)  
**Production**: Cloud storage (AWS S3, Azure Blob, Google Cloud Storage)  
**CDN**: Enabled for optimal delivery  
**Caching**: Aggressive (24-hour cache headers)

### Security Considerations

1. File type validation (magic bytes, not just extension)
2. Size limits enforced (5MB maximum)
3. Rate limiting (5 uploads per hour)
4. Strip EXIF metadata (privacy)
5. Unique filenames (prevent overwrites/guessing)
6. Proper access control (users can only manage their own)
7. Automatic cleanup (old images deleted on new upload)

## User Profile Data Structure

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  role: 'user' | 'admin';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: Date;
  timezone?: string;
  locale?: string;
}
```

## Authorization Roles

### User Roles

1. **user** (default): Standard user access
   - Access own data only
   - Cannot access admin panel
   - Can view own profile and settings

2. **admin**: Administrator access
   - Access all user data (read-only for privacy)
   - Full access to admin panel
   - Can manage system configuration
   - View audit logs and analytics

### Role Assignment

- Default role: `user` (assigned on registration)
- Admin role: Manually assigned by existing admin via admin panel
- Role changes logged in audit trail
- Role checks performed on every API request

## Security Best Practices

### Password Requirements

- Minimum 8 characters
- Must include: uppercase, lowercase, number
- No common passwords (dictionary check)
- Password history (prevent reuse of last 5 passwords)
- Bcrypt hashing with cost factor 12

### Session Security

- JWT secret rotated periodically
- Tokens invalidated on logout
- Expired sessions cleaned up daily
- Session hijacking detection (IP/user agent change)

### Rate Limiting

- Login attempts: 5 per 15 minutes
- Registration: 3 per hour per IP
- Password reset: 3 per hour
- Email verification resend: 3 per hour
- Avatar upload: 5 per hour

### GDPR Compliance

- Users can export all their data
- Users can delete their account (30-day grace period)
- All personal data encrypted at rest
- Audit trail for data access
- Clear privacy policy and consent

## Frontend Components

### Authentication Components

```
apps/web/src/
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    ForgotPasswordPage.tsx
    ResetPasswordPage.tsx
    VerifyEmailPage.tsx
    ProfilePage.tsx (with avatar upload)
  
  contexts/
    AuthContext.tsx
  
  components/
    common/
      Avatar.tsx (reusable avatar with fallback)
    profile/
      AvatarUpload.tsx
      AvatarPreview.tsx
      SessionsList.tsx
```

### Avatar Component

```typescript
interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;        // 32, 64, 128
  fallback?: string;    // Initials
  className?: string;
}

// Usage
<Avatar 
  src={user.avatarUrl} 
  alt={user.username}
  size={64}
  fallback={user.username[0].toUpperCase()}
/>
```

## Email Service Configuration

### SMTP Settings

```json
{
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "noreply@financemanager.com",
      "pass": "{{smtp_password}}"
    }
  },
  "from": {
    "name": "Finance Manager",
    "email": "noreply@financemanager.com"
  }
}
```

### Email Templates

Templates stored in: `apps/finance-api/Features/Auth/EmailTemplates/`

- `VerificationEmail.html`
- `PasswordResetEmail.html`
- `WelcomeEmail.html`
- `PasswordChangedEmail.html`

## Migration Notes

### Database Migrations

```sql
-- Phase 1: Email verification
20XX1201000000_AddEmailVerification.cs

-- Phase 1: Session management  
20XX1202000000_AddSessionTracking.cs

-- Phase 6: Profile images
20XX1203000000_AddProfileImages.cs
```

### Data Migration

For existing users when deploying email verification:
- Set `email_verified = TRUE` for all existing users
- Prompt for verification on first login after deployment
- Send verification email automatically

## Testing Checklist

See `applications/todo/checklists/authentication-checklist.md` for comprehensive testing scenarios.

### Key Test Cases

- ✅ User can register with valid credentials
- ✅ User can login and receive JWT token
- ✅ Token expires after 24 hours
- ✅ User can reset password via email
- ✅ User can verify email address
- ✅ User can upload and remove profile image
- ✅ User can view active sessions
- ✅ User can sign out all devices
- ✅ Admin can manage user accounts
- ✅ Rate limiting prevents abuse

## Related Specifications

- **Admin System**: See `platform/admin-system.md` for user management features
- **To Do Application**: See `applications/todo/spec.md` for original authentication implementation
- **Design Guidelines**: See `platform/design-guidelines.md` for avatar styling standards

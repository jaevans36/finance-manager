import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';
import { createTestUser, cleanupTestUser } from '../helpers/auth.helper';

describe('Password Reset API', () => {
  const testEmail = `password-reset-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let userId: string;
  let validToken: string;

  beforeAll(async () => {
    // Create a test user
    const user = await createTestUser(app, testEmail, testPassword);
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.emailToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.activityLog.deleteMany({ where: { userId } });
    await cleanupTestUser(userId);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/password-reset/request', () => {
    it('should accept request with valid email (without revealing if user exists)', async () => {
      const response = await request(app)
        .post('/api/v1/password-reset/request')
        .send({ email: testEmail });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('If your email is registered');
    });

    it('should accept request with non-existent email (security feature)', async () => {
      const response = await request(app)
        .post('/api/v1/password-reset/request')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('If your email is registered');
    });

    it('should reject request with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/password-reset/request')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without email', async () => {
      const response = await request(app)
        .post('/api/v1/password-reset/request')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create a password reset token for valid email', async () => {
      await request(app)
        .post('/api/v1/password-reset/request')
        .send({ email: testEmail });

      // Check if token was created in database
      const token = await prisma.emailToken.findFirst({
        where: {
          userId,
          type: 'PASSWORD_RESET',
          usedAt: null,
        },
      });

      expect(token).toBeTruthy();
      expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now());
      
      // Store for later tests
      validToken = token!.token;
    });
  });

  describe('GET /api/v1/password-reset/verify/:token', () => {
    it('should verify valid unused token', async () => {
      const response = await request(app)
        .get(`/api/v1/password-reset/verify/${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.email).toBe(testEmail);
    });

    it('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/v1/password-reset/verify/invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });

    it('should reject non-existent token', async () => {
      const fakeToken = 'a'.repeat(96); // Valid format but doesn't exist
      const response = await request(app)
        .get(`/api/v1/password-reset/verify/${fakeToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });

    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'b'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const response = await request(app)
        .get(`/api/v1/password-reset/verify/${expiredToken.token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });

    it('should not mark token as used during verification', async () => {
      await request(app)
        .get(`/api/v1/password-reset/verify/${validToken}`);

      // Check token is still not marked as used
      const token = await prisma.emailToken.findUnique({
        where: { token: validToken },
      });

      expect(token!.usedAt).toBeNull();
    });
  });

  describe('POST /api/v1/password-reset/reset', () => {
    it('should reset password with valid token and strong password', async () => {
      const newPassword = 'NewPassword123!@#';
      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: validToken, newPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('successfully reset');

      // Verify token is marked as used
      const token = await prisma.emailToken.findUnique({
        where: { token: validToken },
      });
      expect(token!.usedAt).not.toBeNull();

      // Verify we can login with new password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: newPassword });

      expect(loginResponse.status).toBe(200);

      // Verify old password doesn't work
      const oldLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(oldLoginResponse.status).toBe(401);
    });

    it('should reject weak password', async () => {
      // Create a new token for this test
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'c'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: newToken.token, newPassword: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error?.message).toContain('Password is too weak');
    });

    it('should reject password without uppercase', async () => {
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'd'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: newToken.token, newPassword: 'lowercase123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password without numbers', async () => {
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'e'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: newToken.token, newPassword: 'Password!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password that is too short', async () => {
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'f'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: newToken.token, newPassword: 'Ps1!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject already used token', async () => {
      // Try to use the same token again
      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: validToken, newPassword: 'AnotherPassword123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired token', async () => {
      const expiredToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'g'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: expiredToken.token, newPassword: 'ValidPassword123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ newPassword: 'ValidPassword123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing password', async () => {
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'h'.repeat(96),
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const response = await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: newToken.token });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should clear account lockout after successful password reset', async () => {
      // Create a locked user
      const lockedEmail = `locked-${Date.now()}@example.com`;
      const lockedUser = await createTestUser(app, lockedEmail, testPassword);

      // Lock the account
      await prisma.user.update({
        where: { id: lockedUser.id },
        data: {
          failedLoginAttempts: 5,
          accountLockedUntil: new Date(Date.now() + 1800000), // Locked for 30 minutes
        },
      });

      // Request password reset
      await request(app)
        .post('/api/v1/password-reset/request')
        .send({ email: lockedEmail });

      const resetToken = await prisma.emailToken.findFirst({
        where: { userId: lockedUser.id, type: 'PASSWORD_RESET' },
      });

      // Reset password
      await request(app)
        .post('/api/v1/password-reset/reset')
        .send({ token: resetToken!.token, newPassword: 'NewPassword123!@#' });

      // Verify lockout is cleared
      const updatedUser = await prisma.user.findUnique({
        where: { id: lockedUser.id },
      });

      expect(updatedUser!.failedLoginAttempts).toBe(0);
      expect(updatedUser!.accountLockedUntil).toBeNull();

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: lockedUser.id } });
      await prisma.session.deleteMany({ where: { userId: lockedUser.id } });
      await prisma.activityLog.deleteMany({ where: { userId: lockedUser.id } });
      await cleanupTestUser(lockedUser.id);
    });
  });
});

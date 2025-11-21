import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';
import { createTestUser, cleanupTestUser } from '../helpers/auth.helper';

describe('Email Verification API', () => {
  const testEmail = `email-verify-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let userId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create a test user
    const user = await createTestUser(app, testEmail, testPassword);
    userId = user.id;
    authToken = user.token;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.emailToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.activityLog.deleteMany({ where: { userId } });
    await cleanupTestUser(userId);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/email-verification/verify/:token', () => {
    it('should verify email with valid token', async () => {
      // First create a new unverified user
      const newEmail = `unverified-${Date.now()}@example.com`;
      const newUser = await createTestUser(app, newEmail, testPassword);
      
      const newToken = await prisma.emailToken.findFirst({
        where: { userId: newUser.id, type: 'EMAIL_VERIFICATION' },
      });

      const response = await request(app)
        .get(`/api/v1/email-verification/verify/${newToken!.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('successfully verified');

      // Verify user is marked as verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: newUser.id },
      });
      expect(updatedUser!.emailVerified).toBe(true);

      // Verify token is marked as used
      const usedToken = await prisma.emailToken.findUnique({
        where: { token: newToken!.token },
      });
      expect(usedToken!.usedAt).not.toBeNull();

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: newUser.id } });
      await prisma.session.deleteMany({ where: { userId: newUser.id } });
      await prisma.activityLog.deleteMany({ where: { userId: newUser.id } });
      await cleanupTestUser(newUser.id);
    });

    it('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/v1/email-verification/verify/invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent token', async () => {
      const fakeToken = 'a'.repeat(96);
      const response = await request(app)
        .get(`/api/v1/email-verification/verify/${fakeToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired token', async () => {
      const expiredToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'b'.repeat(96),
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app)
        .get(`/api/v1/email-verification/verify/${expiredToken.token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject already used token', async () => {
      // Create and immediately use a token
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'c'.repeat(96),
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 86400000),
          usedAt: new Date(),
        },
      });

      const response = await request(app)
        .get(`/api/v1/email-verification/verify/${newToken.token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject if email is already verified', async () => {
      // Mark user as verified
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });

      // Create a new token
      const newToken = await prisma.emailToken.create({
        data: {
          userId,
          token: 'd'.repeat(96),
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const response = await request(app)
        .get(`/api/v1/email-verification/verify/${newToken.token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error?.message).toContain('already verified');
    });
  });

  describe('POST /api/v1/email-verification/resend', () => {
    let unverifiedUserId: string;
    let unverifiedAuthToken: string;

    beforeAll(async () => {
      // Create a new unverified user for resend tests
      const unverifiedEmail = `resend-test-${Date.now()}@example.com`;
      const unverifiedUser = await createTestUser(app, unverifiedEmail, testPassword);
      unverifiedUserId = unverifiedUser.id;
      unverifiedAuthToken = unverifiedUser.token;

      // Ensure user is not verified
      await prisma.user.update({
        where: { id: unverifiedUserId },
        data: { emailVerified: false },
      });
    });

    afterAll(async () => {
      await prisma.emailToken.deleteMany({ where: { userId: unverifiedUserId } });
      await prisma.session.deleteMany({ where: { userId: unverifiedUserId } });
      await prisma.activityLog.deleteMany({ where: { userId: unverifiedUserId } });
      await cleanupTestUser(unverifiedUserId);
    });

    it('should resend verification email for unverified user', async () => {
      const response = await request(app)
        .post('/api/v1/email-verification/resend')
        .set('Authorization', `Bearer ${unverifiedAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Verification email sent');

      // Verify a new token was created
      const tokens = await prisma.emailToken.findMany({
        where: {
          userId: unverifiedUserId,
          type: 'EMAIL_VERIFICATION',
          usedAt: null,
        },
      });

      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should reject resend for already verified user', async () => {
      // Mark user as verified
      await prisma.user.update({
        where: { id: unverifiedUserId },
        data: { emailVerified: true },
      });

      const response = await request(app)
        .post('/api/v1/email-verification/resend')
        .set('Authorization', `Bearer ${unverifiedAuthToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error?.message).toContain('already verified');

      // Reset for other tests
      await prisma.user.update({
        where: { id: unverifiedUserId },
        data: { emailVerified: false },
      });
    });

    it('should reject resend without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/email-verification/resend');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject resend with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/email-verification/resend')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/email-verification/status', () => {
    it('should return verification status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/email-verification/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('emailVerified');
      expect(response.body.data).toHaveProperty('email');
      expect(typeof response.body.data.emailVerified).toBe('boolean');
    });

    it('should reject status check without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/email-verification/status');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject status check with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/email-verification/status')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';

describe('Auth API', () => {
  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let userId: string;

  afterAll(async () => {
    // Clean up test user and Phase 1 data
    if (userId) {
      await prisma.emailToken.deleteMany({ where: { userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.activityLog.deleteMany({ where: { userId } });
      await prisma.task.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testEmail,
      });
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      
      // Store userId for cleanup
      userId = response.body.data.user.id;
    });

    it('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email', password: testPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'new@example.com', password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration without email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: testPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration without password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testEmail,
      });
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: testPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login without email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: testPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      authToken = response.body.data.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: testEmail,
      });
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      authToken = response.body.data.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Phase 1: Session Tracking', () => {
    it('should create session on registration', async () => {
      const newEmail = `session-reg-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: newEmail, password: testPassword });

      expect(response.status).toBe(201);
      const newUserId = response.body.data.user.id;

      // Verify session was created
      const session = await prisma.session.findFirst({
        where: { userId: newUserId },
      });

      expect(session).toBeTruthy();
      expect(session!.userId).toBe(newUserId);

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: newUserId } });
      await prisma.session.deleteMany({ where: { userId: newUserId } });
      await prisma.activityLog.deleteMany({ where: { userId: newUserId } });
      await prisma.task.deleteMany({ where: { userId: newUserId } });
      await prisma.user.delete({ where: { id: newUserId } });
    });

    it('should create session on login', async () => {
      // Clear existing sessions
      await prisma.session.deleteMany({ where: { userId } });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(200);

      // Verify session was created
      const session = await prisma.session.findFirst({
        where: { userId },
      });

      expect(session).toBeTruthy();
      expect(session!.userId).toBe(userId);
    });

    it('should delete session on logout', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const token = loginResponse.body.data.accessToken;

      // Get the session that was just created
      const sessionBefore = await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Verify session was deleted
      const sessionAfter = await prisma.session.findUnique({
        where: { id: sessionBefore!.id },
      });

      expect(sessionAfter).toBeNull();
    });
  });

  describe('Phase 1: Activity Logging', () => {
    it('should log registration activity', async () => {
      const newEmail = `log-reg-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: newEmail, password: testPassword });

      expect(response.status).toBe(201);
      const newUserId = response.body.data.user.id;

      // Verify activity log was created (registration logs LOGIN)
      const log = await prisma.activityLog.findFirst({
        where: {
          userId: newUserId,
          action: 'LOGIN',
        },
      });

      expect(log).toBeTruthy();
      expect(log!.action).toBe('LOGIN');

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: newUserId } });
      await prisma.session.deleteMany({ where: { userId: newUserId } });
      await prisma.activityLog.deleteMany({ where: { userId: newUserId } });
      await prisma.task.deleteMany({ where: { userId: newUserId } });
      await prisma.user.delete({ where: { id: newUserId } });
    });

    it('should log login activity', async () => {
      // Clear existing logs
      await prisma.activityLog.deleteMany({
        where: { userId, action: 'LOGIN' },
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      // Verify activity log was created
      const log = await prisma.activityLog.findFirst({
        where: {
          userId,
          action: 'LOGIN',
        },
      });

      expect(log).toBeTruthy();
      expect(log!.action).toBe('LOGIN');
    });

    it('should log logout activity', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const token = loginResponse.body.data.accessToken;

      // Clear existing logout logs
      await prisma.activityLog.deleteMany({
        where: { userId, action: 'LOGOUT' },
      });

      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Verify activity log was created
      const log = await prisma.activityLog.findFirst({
        where: {
          userId,
          action: 'LOGOUT',
        },
      });

      expect(log).toBeTruthy();
      expect(log!.action).toBe('LOGOUT');
    });

    it('should log failed login attempts', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' });

      // Verify failed login was logged (stored as LOGIN with metadata)
      const log = await prisma.activityLog.findFirst({
        where: {
          userId,
          action: 'LOGIN',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(log).toBeTruthy();
      expect(log!.action).toBe('LOGIN');
      expect(log!.description).toContain('Failed login attempt');
    });
  });

  describe('Phase 1: Account Lockout', () => {
    const lockoutEmail = `lockout-${Date.now()}@example.com`;
    let lockoutUserId: string;

    beforeAll(async () => {
      // Create a test user for lockout tests
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: lockoutEmail, password: testPassword });

      lockoutUserId = response.body.data.user.id;
    });

    afterAll(async () => {
      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: lockoutUserId } });
      await prisma.session.deleteMany({ where: { userId: lockoutUserId } });
      await prisma.activityLog.deleteMany({ where: { userId: lockoutUserId } });
      await prisma.task.deleteMany({ where: { userId: lockoutUserId } });
      await prisma.user.delete({ where: { id: lockoutUserId } });
    });

    it('should track failed login attempts', async () => {
      // Make a failed login attempt
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockoutEmail, password: 'WrongPassword!' });

      // Check failed attempts counter
      const user = await prisma.user.findUnique({
        where: { id: lockoutUserId },
      });

      expect(user!.failedLoginAttempts).toBeGreaterThan(0);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Reset failed attempts
      await prisma.user.update({
        where: { id: lockoutUserId },
        data: { failedLoginAttempts: 0, accountLockedUntil: null },
      });

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: lockoutEmail, password: 'WrongPassword!' });
      }

      // Check if account is locked
      const user = await prisma.user.findUnique({
        where: { id: lockoutUserId },
      });

      expect(user!.failedLoginAttempts).toBe(5);
      expect(user!.accountLockedUntil).not.toBeNull();
      expect(user!.accountLockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject login for locked account', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockoutEmail, password: testPassword });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error?.message).toContain('locked');
    });

    it('should log account lockout event', async () => {
      const log = await prisma.activityLog.findFirst({
        where: {
          userId: lockoutUserId,
          action: 'ACCOUNT_LOCKED',
        },
      });

      expect(log).toBeTruthy();
      expect(log!.action).toBe('ACCOUNT_LOCKED');
    });

    it('should reset failed attempts on successful login', async () => {
      // Unlock the account
      await prisma.user.update({
        where: { id: lockoutUserId },
        data: { failedLoginAttempts: 2, accountLockedUntil: null },
      });

      // Successful login
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: lockoutEmail, password: testPassword });

      // Check failed attempts were reset
      const user = await prisma.user.findUnique({
        where: { id: lockoutUserId },
      });

      expect(user!.failedLoginAttempts).toBe(0);
    });
  });

  describe('Phase 1: Email Verification', () => {
    it('should send verification email on registration', async () => {
      const newEmail = `verify-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: newEmail, password: testPassword });

      expect(response.status).toBe(201);
      const newUserId = response.body.data.user.id;

      // Verify email token was created
      const token = await prisma.emailToken.findFirst({
        where: {
          userId: newUserId,
          type: 'EMAIL_VERIFICATION',
        },
      });

      expect(token).toBeTruthy();
      expect(token!.type).toBe('EMAIL_VERIFICATION');
      expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: newUserId } });
      await prisma.session.deleteMany({ where: { userId: newUserId } });
      await prisma.activityLog.deleteMany({ where: { userId: newUserId } });
      await prisma.task.deleteMany({ where: { userId: newUserId } });
      await prisma.user.delete({ where: { id: newUserId } });
    });

    it('should set emailVerified to false on registration', async () => {
      const newEmail = `unverified-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: newEmail, password: testPassword });

      expect(response.status).toBe(201);
      const newUserId = response.body.data.user.id;

      // Verify user is not verified
      const user = await prisma.user.findUnique({
        where: { id: newUserId },
      });

      expect(user!.emailVerified).toBe(false);

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: newUserId } });
      await prisma.session.deleteMany({ where: { userId: newUserId } });
      await prisma.activityLog.deleteMany({ where: { userId: newUserId } });
      await prisma.task.deleteMany({ where: { userId: newUserId } });
      await prisma.user.delete({ where: { id: newUserId } });
    });
  });
});

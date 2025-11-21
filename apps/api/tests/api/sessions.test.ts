import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';
import { createTestUser, cleanupTestUser } from '../helpers/auth.helper';

describe('Session Management API', () => {
  const testEmail = `session-test-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let userId: string;
  let authToken: string;
  let sessionId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await createTestUser(app, testEmail, testPassword);
    userId = user.id;
    authToken = user.token;

    // Get the session ID that was created during login
    const session = await prisma.session.findFirst({
      where: { userId },
    });

    if (session) {
      sessionId = session.id;
    }
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.emailToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.activityLog.deleteMany({ where: { userId } });
    await cleanupTestUser(userId);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/sessions', () => {
    it('should list all user sessions', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
      expect(response.body.data.sessions.length).toBeGreaterThan(0);

      // Check session structure
      const session = response.body.data.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('ipAddress');
      expect(session).toHaveProperty('userAgent');
      expect(session).toHaveProperty('lastActivity');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('isCurrent');
    });

    it('should mark current session correctly', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // At least one session should be marked as current
      const currentSession = response.body.data.sessions.find(
        (s: { isCurrent: boolean }) => s.isCurrent === true
      );
      expect(currentSession).toBeTruthy();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/v1/sessions');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should show multiple sessions for user with multiple devices', async () => {
      // Create another session by logging in again (simulating another device)
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .set('User-Agent', 'Different-Device-Agent');

      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DELETE /api/v1/sessions/:sessionId', () => {
    let otherSessionId: string;

    beforeAll(async () => {
      // Create another session
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .set('User-Agent', 'Another-Device');

      const session = await prisma.session.findFirst({
        where: {
          userId,
          userAgent: 'Another-Device',
        },
      });

      otherSessionId = session!.id;
    });

    it('should terminate specific session', async () => {
      const response = await request(app)
        .delete(`/api/v1/sessions/${otherSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Session terminated');

      // Verify session is deleted
      const deletedSession = await prisma.session.findUnique({
        where: { id: otherSessionId },
      });
      expect(deletedSession).toBeNull();
    });

    it('should reject terminating another user\'s session', async () => {
      // Create another user
      const otherEmail = `other-user-${Date.now()}@example.com`;
      const otherUser = await createTestUser(app, otherEmail, testPassword);

      const otherUserSession = await prisma.session.findFirst({
        where: { userId: otherUser.id },
      });

      const response = await request(app)
        .delete(`/api/v1/sessions/${otherUserSession!.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: otherUser.id } });
      await prisma.session.deleteMany({ where: { userId: otherUser.id } });
      await prisma.activityLog.deleteMany({ where: { userId: otherUser.id } });
      await cleanupTestUser(otherUser.id);
    });

    it('should reject terminating non-existent session', async () => {
      const fakeSessionId = 'non-existent-session-id';
      const response = await request(app)
        .delete(`/api/v1/sessions/${fakeSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/sessions/${sessionId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should allow terminating own current session', async () => {
      // Create a new session to terminate
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const newToken = loginResponse.body.data.accessToken;
      const newSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const response = await request(app)
        .delete(`/api/v1/sessions/${newSession!.id}`)
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/sessions/terminate-others', () => {
    beforeAll(async () => {
      // Create multiple sessions
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .set('User-Agent', 'Device-1');

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .set('User-Agent', 'Device-2');

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .set('User-Agent', 'Device-3');
    });

    it('should terminate all other sessions except current', async () => {
      // Get initial session count
      const beforeSessions = await prisma.session.findMany({
        where: { userId },
      });

      const response = await request(app)
        .post('/api/v1/sessions/terminate-others')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('other sessions terminated');
      expect(response.body.data.terminatedCount).toBeGreaterThan(0);

      // Verify only current session remains
      const afterSessions = await prisma.session.findMany({
        where: { userId },
      });

      expect(afterSessions.length).toBe(1);
      expect(afterSessions[0].id).toBe(sessionId);
      expect(beforeSessions.length).toBeGreaterThan(afterSessions.length);
    });

    it('should handle case when no other sessions exist', async () => {
      // All other sessions were terminated in previous test
      const response = await request(app)
        .post('/api/v1/sessions/terminate-others')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.terminatedCount).toBe(0);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/terminate-others');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/terminate-others')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should keep current session usable after terminating others', async () => {
      // Create multiple sessions again
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      // Terminate others
      await request(app)
        .post('/api/v1/sessions/terminate-others')
        .set('Authorization', `Bearer ${authToken}`);

      // Verify current session still works
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Session Expiration', () => {
    it('should handle expired sessions', async () => {
      // Create a session that's already expired
      const expiredSession = await prisma.session.create({
        data: {
          userId,
          token: 'expired-token-test',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Expired session should not appear in active sessions
      const expiredInList = response.body.data.sessions.find(
        (s: { id: string }) => s.id === expiredSession.id
      );
      expect(expiredInList).toBeUndefined();
    });
  });
});

import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/config/database';
import { createTestUser, cleanupTestUser } from '../helpers/auth.helper';

describe('Activity Log API', () => {
  const testEmail = `activity-log-${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  let userId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create a test user
    const user = await createTestUser(app, testEmail, testPassword);
    userId = user.id;
    authToken = user.token;

    // Create some activity logs for testing
    await prisma.activityLog.createMany({
      data: [
        {
          userId,
          action: 'LOGIN',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { success: true },
        },
        {
          userId,
          action: 'LOGOUT',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        {
          userId,
          action: 'PASSWORD_CHANGE',
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/91.0',
        },
        {
          userId,
          action: 'LOGIN',
          ipAddress: '192.168.1.3',
          userAgent: 'Firefox/89.0',
          metadata: { reason: 'Invalid password' },
          description: 'Failed login attempt (1/5)',
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.emailToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.activityLog.deleteMany({ where: { userId } });
    await cleanupTestUser(userId);
    await prisma.$disconnect();
  });

  describe('GET /api/v1/activity-logs', () => {
    it('should return paginated activity logs', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should return logs with correct structure', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const log = response.body.data.logs[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('ipAddress');
      expect(log).toHaveProperty('userAgent');
      expect(log).toHaveProperty('timestamp');
    });

    it('should support pagination with page parameter', async () => {
      const page1 = await request(app)
        .get('/api/v1/activity-logs?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      const page2 = await request(app)
        .get('/api/v1/activity-logs?page=2&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.data.logs[0].id).not.toBe(page2.body.data.logs[0]?.id);
    });

    it('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs?limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeLessThanOrEqual(2);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs?limit=200')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(100);
    });

    it('should filter by action type', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs?action=LOGIN')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      response.body.data.logs.forEach((log: { action: string }) => {
        expect(log.action).toBe('LOGIN');
      });
    });

    it('should filter by multiple action types', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs?action=LOGIN&action=LOGOUT')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      response.body.data.logs.forEach((log: { action: string }) => {
        expect(['LOGIN', 'LOGOUT']).toContain(log.action);
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/v1/activity-logs?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs?startDate=invalid-date')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return logs in descending order by timestamp', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const logs = response.body.data.logs;
      
      if (logs.length > 1) {
        const firstTimestamp = new Date(logs[0].timestamp).getTime();
        const secondTimestamp = new Date(logs[1].timestamp).getTime();
        expect(firstTimestamp).toBeGreaterThanOrEqual(secondTimestamp);
      }
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/v1/activity-logs');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should only return logs for authenticated user', async () => {
      // Create another user
      const otherEmail = `other-${Date.now()}@example.com`;
      const otherUser = await createTestUser(app, otherEmail, testPassword);

      // Create logs for other user
      await prisma.activityLog.create({
        data: {
          userId: otherUser.id,
          action: 'LOGIN',
          ipAddress: '10.0.0.1',
          userAgent: 'Other Agent',
        },
      });

      const response = await request(app)
        .get('/api/v1/activity-logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // Verify no logs from other user appear
      const otherUserLogs = response.body.data.logs.filter(
        (log: { ipAddress: string }) => log.ipAddress === '10.0.0.1'
      );
      expect(otherUserLogs.length).toBe(0);

      // Cleanup
      await prisma.emailToken.deleteMany({ where: { userId: otherUser.id } });
      await prisma.session.deleteMany({ where: { userId: otherUser.id } });
      await prisma.activityLog.deleteMany({ where: { userId: otherUser.id } });
      await cleanupTestUser(otherUser.id);
    });
  });

  describe('GET /api/v1/activity-logs/summary', () => {
    it('should return activity summary', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.summary)).toBe(true);
    });

    it('should return summary with action counts', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      if (response.body.data.summary.length > 0) {
        const item = response.body.data.summary[0];
        expect(item).toHaveProperty('action');
        expect(item).toHaveProperty('count');
        expect(typeof item.count).toBe('number');
      }
    });

    it('should support days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/summary?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.days).toBe(7);
    });

    it('should default to 30 days if not specified', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.days).toBe(30);
    });

    it('should reject invalid days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/summary?days=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/v1/activity-logs/summary');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/activity-logs/security', () => {
    it('should return recent security events', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/security')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('should only return security-related actions', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/security')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const securityActions = [
        'LOGIN',
        'LOGOUT',
        'FAILED_LOGIN',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET_REQUEST',
        'PASSWORD_RESET_COMPLETE',
        'EMAIL_VERIFIED',
        'ACCOUNT_LOCKED',
      ];

      response.body.data.logs.forEach((log: { action: string }) => {
        expect(securityActions).toContain(log.action);
      });
    });

    it('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/security?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeLessThanOrEqual(5);
    });

    it('should default to 50 events if not specified', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/security')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeLessThanOrEqual(50);
    });

    it('should return events in descending order', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/security')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const logs = response.body.data.logs;

      if (logs.length > 1) {
        const firstTimestamp = new Date(logs[0].timestamp).getTime();
        const secondTimestamp = new Date(logs[1].timestamp).getTime();
        expect(firstTimestamp).toBeGreaterThanOrEqual(secondTimestamp);
      }
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/v1/activity-logs/security');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/activity-logs/security?limit=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

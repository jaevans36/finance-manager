import request from 'supertest';
import app from '../../src/server';
import { createTestUser, cleanupTestUser } from '../helpers/auth.helper';
import prisma from '../../src/config/database';

describe('Task API', () => {
  let testUser1: { id: string; email: string; token: string };
  let testUser2: { id: string; email: string; token: string };

  beforeAll(async () => {
    // Create two test users
    testUser1 = await createTestUser(app, `user1-${Date.now()}@example.com`);
    testUser2 = await createTestUser(app, `user2-${Date.now()}@example.com`);
  });

  afterAll(async () => {
    // Clean up test users
    await cleanupTestUser(testUser1.id);
    await cleanupTestUser(testUser2.id);
    await prisma.$disconnect();
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task with all fields', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'HIGH',
        dueDate: '2025-12-31',
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        completed: false,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.userId).toBe(testUser1.id);
    });

    it('should create a task with only required fields', async () => {
      const taskData = {
        title: 'Minimal Task',
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        title: taskData.title,
        description: null,
        priority: 'MEDIUM',
        dueDate: null,
        completed: false,
      });
    });

    it('should reject task creation without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'Unauthorized Task' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject task with empty title', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject task with title exceeding 200 characters', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'a'.repeat(201) });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject task with invalid priority', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Test', priority: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject task with past due date', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Test', dueDate: '2020-01-01' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeAll(async () => {
      // Create some test tasks for user1
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task 1', priority: 'HIGH' });

      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task 2', priority: 'MEDIUM' });

      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task 3', priority: 'LOW' });

      // Create a task for user2 (should not be visible to user1)
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser2.token}`)
        .send({ title: 'User 2 Task' });
    });

    it('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should only return tasks belonging to the authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      const tasks = response.body.data;
      tasks.forEach((task: { userId: string }) => {
        expect(task.userId).toBe(testUser1.id);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
      });
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/v1/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeAll(async () => {
      // Create a test task
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task for GET by ID' });

      taskId = response.body.data.id;
    });

    it('should get a specific task by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Task for GET by ID');
    });

    it('should reject access to another user\'s task', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser2.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get(`/api/v1/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a fresh test task for each update test
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task to Update', description: 'Original description' });

      taskId = response.body.data.id;
    });

    it('should update task title and description', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updates);
    });

    it('should update task priority and due date', async () => {
      const updates = {
        priority: 'HIGH',
        dueDate: '2025-12-25',
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe(updates.priority);
    });

    it('should reject update to another user\'s task', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser2.token}`)
        .send({ title: 'Hacked' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid field values', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ priority: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/tasks/:id/complete', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a fresh test task
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task to Complete' });

      taskId = response.body.data.id;
    });

    it('should mark task as completed', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(true);
      expect(response.body.data.completedAt).toBeDefined();
    });

    it('should toggle task completion', async () => {
      // Complete the task
      await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      // Uncomplete the task
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.completed).toBe(false);
      expect(response.body.data.completedAt).toBeNull();
    });

    it('should reject toggling another user\'s task', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${testUser2.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a fresh test task
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${testUser1.token}`)
        .send({ title: 'Task to Delete' });

      taskId = response.body.data.id;
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(getResponse.status).toBe(404);
    });

    it('should reject deleting another user\'s task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser2.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      // Verify task still exists for user1
      const getResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(getResponse.status).toBe(200);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/v1/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${testUser1.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).delete(`/api/v1/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

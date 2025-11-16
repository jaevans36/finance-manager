import request from 'supertest';
import type { Express } from 'express';
import prisma from '../../src/config/database';

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

/**
 * Create a test user and return their authentication token
 */
export async function createTestUser(
  app: Express,
  email: string = `test-${Date.now()}@example.com`,
  password: string = 'Test123!@#'
): Promise<TestUser> {
  // Register the user
  const registerResponse = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password });

  if (registerResponse.status !== 201) {
    throw new Error(`Failed to create test user: ${registerResponse.body.error?.message}`);
  }

  // Login to get token
  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to login test user: ${loginResponse.body.error?.message}`);
  }

  return {
    id: loginResponse.body.data.user.id,
    email: loginResponse.body.data.user.email,
    token: loginResponse.body.data.accessToken,
  };
}

/**
 * Clean up test user and their tasks
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  try {
    await prisma.task.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    // Ignore errors if user doesn't exist
    console.error(`Failed to cleanup user ${userId}:`, error);
  }
}

/**
 * Clean up all test users
 */
export async function cleanupAllTestUsers(): Promise<void> {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
}

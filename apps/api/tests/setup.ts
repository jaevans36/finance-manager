import prisma from '../src/config/database';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Clean up test database before all tests
beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
});

// Clean up after all tests
afterAll(async () => {
  // Disconnect from database (individual test files handle their own cleanup)
  await prisma.$disconnect();
});

export { prisma };

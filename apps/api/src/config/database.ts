import { PrismaClient } from '@prisma/client';
import './env'; // Ensure environment variables are loaded first

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;

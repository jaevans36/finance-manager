import prisma from '../config/database';
import { User } from '@prisma/client';

export class UserService {
  async createUser(email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const userService = new UserService();

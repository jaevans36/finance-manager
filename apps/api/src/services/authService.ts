import type { User } from '@prisma/client';
import { userService } from './userService';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logAuth } from '../utils/logger';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(email: string, password: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    // Validate password strength
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await userService.createUser(email, hashedPassword);

    logAuth('User registered', user.id, { email });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Update last login
    await userService.updateLastLogin(user.id);

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      logAuth('Failed login attempt', user.id, { email, reason: 'Invalid password' });
      throw new AppError('Invalid email or password', 401);
    }

    logAuth('User logged in', user.id, { email });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Update last login
    await userService.updateLastLogin(user.id);

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}

export const authService = new AuthService();

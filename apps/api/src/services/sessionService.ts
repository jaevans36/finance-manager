import prisma from '../config/database.js';
import crypto from 'crypto';
import type { Request } from 'express';

interface SessionData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  lastActiveAt: Date;
  createdAt: Date;
  isCurrent: boolean;
}

export class SessionService {
  /**
   * Generate a secure random session token
   */
  private generateToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  /**
   * Create a new session for a user
   */
  async createSession(data: SessionData): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await prisma.session.create({
      data: {
        userId: data.userId,
        token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Get session by token
   */
  async getSessionByToken(token: string): Promise<{ userId: string; sessionId: string } | null> {
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(), // Session has not expired
        },
      },
    });

    if (!session) {
      return null;
    }

    // Update last active time
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      userId: session.userId,
      sessionId: session.id,
    };
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string, currentToken?: string): Promise<SessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      location: session.location,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      isCurrent: session.token === currentToken,
    }));
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId, // Ensure user can only delete their own sessions
      },
    });

    return result.count > 0;
  }

  /**
   * Terminate all sessions except the current one
   */
  async terminateOtherSessions(userId: string, currentToken: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        userId,
        token: {
          not: currentToken,
        },
      },
    });

    return result.count;
  }

  /**
   * Terminate all sessions for a user (e.g., on password change)
   */
  async terminateAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Clean up expired sessions (can be run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Clean up inactive sessions (inactive for more than 7 days)
   */
  async cleanupInactiveSessions(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.session.deleteMany({
      where: {
        lastActiveAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    return result.count;
  }

  /**
   * Extract session data from Express request
   */
  extractSessionData(req: Request, userId: string): SessionData {
    return {
      userId,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      location: this.getLocationFromIp(this.getClientIp(req)),
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress;
  }

  /**
   * Get location from IP address (placeholder for future IP geolocation service)
   */
  private getLocationFromIp(ip?: string): string | undefined {
    // TODO: Integrate with IP geolocation service (e.g., MaxMind, ipapi.co)
    // For now, return undefined or a placeholder
    if (!ip) return undefined;
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
      return 'Local Network';
    }
    return undefined; // Will be replaced with actual geolocation
  }

  /**
   * Parse user agent to get device/browser info
   */
  parseUserAgent(userAgent?: string): { browser?: string; os?: string; device?: string } {
    if (!userAgent) return {};

    // Simple parsing - can be enhanced with a library like 'ua-parser-js'
    const result: { browser?: string; os?: string; device?: string } = {};

    // Browser detection
    if (userAgent.includes('Chrome')) result.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
    else if (userAgent.includes('Safari')) result.browser = 'Safari';
    else if (userAgent.includes('Edge')) result.browser = 'Edge';

    // OS detection
    if (userAgent.includes('Windows')) result.os = 'Windows';
    else if (userAgent.includes('Mac OS')) result.os = 'macOS';
    else if (userAgent.includes('Linux')) result.os = 'Linux';
    else if (userAgent.includes('Android')) result.os = 'Android';
    else if (userAgent.includes('iOS')) result.os = 'iOS';

    // Device detection
    if (userAgent.includes('Mobile')) result.device = 'Mobile';
    else if (userAgent.includes('Tablet')) result.device = 'Tablet';
    else result.device = 'Desktop';

    return result;
  }
}

export const sessionService = new SessionService();

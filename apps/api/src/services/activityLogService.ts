import prisma from '../config/database';
import type { Request } from 'express';

type ActivityType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_CHANGE'
  | 'EMAIL_VERIFIED'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'SESSION_TERMINATED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'DATA_EXPORT'
  | 'ACCOUNT_DELETION_REQUEST'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_COMPLETED';

interface ActivityData {
  userId: string;
  action: ActivityType;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface ActivityLogEntry {
  id: string;
  action: ActivityType;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: Date;
}

export class ActivityLogService {
  /**
   * Log an activity
   */
  async logActivity(data: ActivityData): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata || undefined,
      },
    });
  }

  /**
   * Log activity from Express request
   */
  async logActivityFromRequest(
    req: Request,
    userId: string,
    action: ActivityType,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      description,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      metadata,
    });
  }

  /**
   * Get activity log for a user with pagination
   */
  async getUserActivityLog(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      page?: number;
      actionType?: ActivityType;
      actionTypes?: string[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ logs: ActivityLogEntry[]; total: number }> {
    const {
      limit = 50,
      page = 1,
      actionType,
      actionTypes,
      startDate,
      endDate,
    } = options;
    
    const offset = options.offset !== undefined ? options.offset : (page - 1) * limit;

    const where: any = { userId };

    if (actionTypes && actionTypes.length > 0) {
      where.action = { in: actionTypes };
    } else if (actionType) {
      where.action = actionType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get recent activity summary for a user
   */
  async getRecentActivitySummary(
    userId: string,
    days: number = 30
  ): Promise<Record<ActivityType, number>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await prisma.activityLog.groupBy({
      by: ['action'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
    });

    const summary: Partial<Record<ActivityType, number>> = {};
    activities.forEach(activity => {
      summary[activity.action as ActivityType] = activity._count;
    });

    return summary as Record<ActivityType, number>;
  }

  /**
   * Get security-relevant activities (logins, password changes, etc.)
   */
  async getSecurityActivities(
    userId: string,
    limit: number = 20
  ): Promise<ActivityLogEntry[]> {
    const securityActions: ActivityType[] = [
      'LOGIN',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET_COMPLETE',
      'SESSION_TERMINATED',
      'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED',
    ];

    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        action: {
          in: securityActions,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs;
  }

  /**
   * Clean up old activity logs (optional retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Helper: Log user login
   */
  async logLogin(req: Request, userId: string, metadata?: Record<string, any>): Promise<void> {
    await this.logActivityFromRequest(req, userId, 'LOGIN', 'User logged in', metadata);
  }

  /**
   * Helper: Log user logout
   */
  async logLogout(req: Request, userId: string): Promise<void> {
    await this.logActivityFromRequest(req, userId, 'LOGOUT', 'User logged out');
  }

  /**
   * Helper: Log password change
   */
  async logPasswordChange(req: Request, userId: string): Promise<void> {
    await this.logActivityFromRequest(req, userId, 'PASSWORD_CHANGE', 'User changed password');
  }

  /**
   * Helper: Log password reset request
   */
  async logPasswordResetRequest(req: Request, userId: string): Promise<void> {
    await this.logActivityFromRequest(
      req,
      userId,
      'PASSWORD_RESET_REQUEST',
      'User requested password reset'
    );
  }

  /**
   * Helper: Log password reset completion
   */
  async logPasswordResetComplete(req: Request, userId: string): Promise<void> {
    await this.logActivityFromRequest(
      req,
      userId,
      'PASSWORD_RESET_COMPLETE',
      'User completed password reset'
    );
  }

  /**
   * Helper: Log email verification
   */
  async logEmailVerified(req: Request, userId: string): Promise<void> {
    await this.logActivityFromRequest(req, userId, 'EMAIL_VERIFIED', 'User verified email address');
  }

  /**
   * Helper: Log account lockout
   */
  async logAccountLocked(req: Request, userId: string, unlockTime: Date): Promise<void> {
    await this.logActivityFromRequest(
      req,
      userId,
      'ACCOUNT_LOCKED',
      'Account locked due to failed login attempts',
      { unlockTime: unlockTime.toISOString() }
    );
  }

  /**
   * Helper: Log session termination
   */
  async logSessionTerminated(req: Request, userId: string, sessionCount: number): Promise<void> {
    await this.logActivityFromRequest(
      req,
      userId,
      'SESSION_TERMINATED',
      `Terminated ${sessionCount} session(s)`,
      { sessionCount }
    );
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress;
  }
}

export const activityLogService = new ActivityLogService();

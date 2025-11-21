import { Router, Response } from 'express';
import { z } from 'zod';
import { ActivityLogService, type ActivityType } from '../services/activityLogService';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const activityLogService = new ActivityLogService();

// Get activity logs (requires authentication)
const getLogsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
  action: z.union([z.string(), z.array(z.string())]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const filters = getLogsSchema.parse(req.query);
    
    // Cap limit at 100
    const limit = Math.min(filters.limit || 20, 100);
    
    // Convert action to array if it's a string and cast to ActivityType[]
    const actionTypes = filters.action 
      ? (Array.isArray(filters.action) ? filters.action : [filters.action]) as ActivityType[]
      : undefined;

    const result = await activityLogService.getUserActivityLog(userId, {
      ...filters,
      limit,
      actionTypes,
    });
    
    // Map createdAt to timestamp for API response
    const logsWithTimestamp = result.logs.map(log => ({
      ...log,
      timestamp: log.createdAt,
    }));

    res.json({
      success: true,
      data: {
        logs: logsWithTimestamp,
        pagination: {
          page: filters.page,
          limit: limit, // Use the capped limit, not the original
          total: result.total,
          totalPages: Math.ceil(result.total / limit), // Use capped limit for calculation
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
    }

    logger.error('Failed to get activity logs', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve activity logs' },
    });
  }
});

// Get activity summary (requires authentication)
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        error: { message: 'Days parameter must be between 1 and 365' },
      });
    }

    const summary = await activityLogService.getRecentActivitySummary(userId, days);
    
    // Convert summary to array format
    const summaryArray = Object.entries(summary).map(([action, count]) => ({
      action,
      count,
    }));

    res.json({
      success: true,
      data: {
        summary: summaryArray,
        days,
      },
    });
  } catch (error) {
    logger.error('Failed to get activity summary', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve activity summary' },
    });
  }
});

// Get recent security events (requires authentication)
router.get('/security', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: { message: 'Limit parameter must be between 1 and 50' },
      });
    }

    // Get more logs to ensure we have enough security events
    const result = await activityLogService.getUserActivityLog(userId, { limit: limit * 2 });
    const securityActions = ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'EMAIL_VERIFIED', 'SESSION_TERMINATED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED'];
    const events = result.logs.filter(log => securityActions.includes(log.action)).slice(0, limit);
    
    // Map createdAt to timestamp
    const eventsWithTimestamp = events.map(log => ({
      ...log,
      timestamp: log.createdAt,
    }));

    res.json({
      success: true,
      data: {
        logs: eventsWithTimestamp,
      },
    });
  } catch (error) {
    logger.error('Failed to get security events', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve security events' },
    });
  }
});

export default router;

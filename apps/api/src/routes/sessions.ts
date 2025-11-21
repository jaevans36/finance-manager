import { Router, Response } from 'express';
import { SessionService } from '../services/sessionService';
import { ActivityLogService } from '../services/activityLogService';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const sessionService = new SessionService();
const activityLogService = new ActivityLogService();

// Get all user sessions (requires authentication)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const sessions = await sessionService.getUserSessions(userId);
    
    // Mark the most recently active session as current
    // (This is a simple heuristic since JWT doesn't directly map to session token)
    const sessionsWithActivity = sessions.map((session, index) => ({
      ...session,
      lastActivity: session.lastActiveAt,
      isCurrent: index === 0, // First session (most recent) is current
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsWithActivity,
        count: sessions.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get user sessions', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve sessions' },
    });
  }
});

// Terminate a specific session (requires authentication)
router.delete('/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { sessionId } = req.params;

    // Verify session belongs to user and terminate it
    const success = await sessionService.terminateSession(sessionId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found or already terminated' },
      });
    }

    // Log activity
    await activityLogService.logSessionTerminated(req, userId, 1);

    logger.info('Session terminated', { userId, sessionId });

    res.json({
      success: true,
      data: {
        message: 'Session terminated successfully',
      },
    });
  } catch (error) {
    logger.error('Failed to terminate session', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to terminate session' },
    });
  }
});

// Terminate all other sessions (keep current one)
router.post('/terminate-others', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all active sessions for this user
    const allSessions = await sessionService.getUserSessions(userId);
    
    if (allSessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No active sessions found' },
      });
    }
    
    // Keep the oldest session (first created), which is likely the one that issued the JWT
    // Sessions are ordered by lastActiveAt desc, so we need to find the oldest by createdAt
    const sortedByCreation = [...allSessions].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    const sessionToKeep = sortedByCreation[0]; // Oldest session

    // Terminate all other sessions
    let count = 0;
    for (const session of allSessions) {
      if (session.id !== sessionToKeep.id) {
        await sessionService.terminateSession(session.id, userId);
        count++;
      }
    }

    // Log activity
    await activityLogService.logActivity({
      userId,
      action: 'SESSION_TERMINATED',
      description: `Terminated ${count} other sessions`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { terminatedCount: count },
    });

    logger.info('All other sessions terminated', { userId, count });

    res.json({
      success: true,
      data: {
        message: `${count} other sessions terminated`,
        terminatedCount: count,
      },
    });
  } catch (error) {
    logger.error('Failed to terminate other sessions', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to terminate sessions' },
    });
  }
});

export default router;

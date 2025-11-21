import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '@finance-manager/schema';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { SessionService } from '../services/sessionService';
import { ActivityLogService } from '../services/activityLogService';
import { TokenService } from '../services/tokenService';
import { emailService } from '../services/emailService';

const router = Router();
const sessionService = new SessionService();
const activityLogService = new ActivityLogService();
const tokenService = new TokenService();

// Rate limiter for auth endpoints (disabled in test environment)
const authLimiter = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true'
  ? (_req: Request, _res: Response, next: NextFunction) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Increased for E2E testing - Limit each IP to 100 requests per windowMs
      message: 'Too many authentication attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });

// POST /api/v1/auth/register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);

      // Create email verification token and send email
      const verificationToken = await tokenService.createEmailVerificationToken(result.user.id);
      await emailService.sendEmailVerificationEmail(email, verificationToken);

      // Log registration activity
      await activityLogService.logActivity({
        userId: result.user.id,
        action: 'LOGIN',
        description: 'User registered and logged in',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Create session
      const sessionToken = await sessionService.createSession({
        userId: result.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        data: {
          ...result,
          sessionToken,
          emailVerificationSent: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      // Check for account lockout before attempting login
      const prisma = (await import('../config/database')).default;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

      if (user?.accountLockedUntil && new Date() < user.accountLockedUntil) {
        const minutesRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / (1000 * 60));
        throw new AppError(
          `Account is locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes.`,
          423
        );
      }

      try {
        const result = await authService.login(email, password);

        // Reset failed login attempts on successful login
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastLoginAt: new Date(),
            },
          });
        }

        // Log successful login
        await activityLogService.logLogin(req, result.user.id);

        // Create session
        const sessionToken = await sessionService.createSession({
          userId: result.user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });

        // Send login notification if enabled
        if (user && !user.emailVerified) {
          // Optionally send login notification for unverified accounts
        }

        res.status(200).json({
          success: true,
          data: {
            ...result,
            sessionToken,
            emailVerified: user?.emailVerified || false,
          },
        });
      } catch (loginError) {
        // Increment failed login attempts
        if (user) {
          const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
          const shouldLock = newFailedAttempts >= 5;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedAttempts,
              accountLockedUntil: shouldLock
                ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
                : null,
            },
          });

          // Log failed login attempt
          await activityLogService.logActivity({
            userId: user.id,
            action: 'LOGIN',
            description: `Failed login attempt (${newFailedAttempts}/5)`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          });

          if (shouldLock) {
            const unlockTime = new Date(Date.now() + 30 * 60 * 1000);
            // Send account locked email
            await emailService.sendAccountLockoutEmail(user.email, unlockTime);
            
            // Log account lockout
            await activityLogService.logAccountLocked(req, user.id, unlockTime);
          }
        }

        throw loginError;
      }
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    // Terminate current session
    if (sessionToken) {
      const session = await sessionService.getSessionByToken(sessionToken);
      if (session) {
        await sessionService.terminateSession(session.sessionId, userId);
      }
    }

    // Log logout activity
    await activityLogService.logLogout(req, userId);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    // Even if session cleanup fails, allow logout
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }
});

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      // Verify refresh token
      const payload = verifyToken(refreshToken);

      // Generate new tokens (simplified - in production, verify token is not blacklisted)
      const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt');
      const accessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      next(new AppError('Invalid or expired refresh token', 401));
    }
  }
);

// GET /api/v1/auth/me
router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { userService } = await import('../services/userService');
      const user = await userService.findById(req.user.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

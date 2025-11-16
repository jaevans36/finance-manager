import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '@finance-manager/schema';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
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

      res.status(201).json({
        success: true,
        data: result,
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
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future enhancements (e.g., token blacklist)
  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
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

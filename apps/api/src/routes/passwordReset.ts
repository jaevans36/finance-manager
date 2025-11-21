import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { TokenService } from '../services/tokenService';
import { emailService } from '../services/emailService';
import { ActivityLogService } from '../services/activityLogService';
import { validatePasswordStrength } from '../utils/passwordStrength';
import logger from '../utils/logger';

const router = Router();
const tokenService = new TokenService();
const activityLogService = new ActivityLogService();

// Request password reset
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

router.post('/request', async (req: Request, res: Response) => {
  try {
    const { email } = requestResetSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      return res.json({
        success: true,
        data: {
          message: 'If your email is registered, you will receive a password reset link shortly.',
        },
      });
    }

    // Create reset token
    const token = await tokenService.createPasswordResetToken(user.id);

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, token);

    // Log activity
    await activityLogService.logPasswordResetRequest(req, user.id);

    logger.info('Password reset email sent', { userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        message: 'If your email is registered, you will receive a password reset link shortly.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request',
          details: error.errors,
        },
      });
    }

    logger.error('Password reset request failed', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process password reset request' },
    });
  }
});

// Reset password with token
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Validate password strength BEFORE schema validation to avoid 'Invalid request' message
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token and new password are required' },
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid || passwordValidation.score < 3) {
      return res.status(400).json({
        success: false,
        error: {
          message: passwordValidation.feedback.length > 0
            ? passwordValidation.feedback.join('. ')
            : 'Password is too weak',
          feedback: passwordValidation.feedback,
          score: passwordValidation.score,
        },
      });
    }
    
    // Now validate with schema
    resetPasswordSchema.parse(req.body);

    // Verify token
    const emailToken = await tokenService.verifyToken(token, 'PASSWORD_RESET');
    if (!emailToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired reset token' },
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: emailToken.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear account lockout
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    // Invalidate all user tokens
    await tokenService.invalidateUserTokens(user.id, 'PASSWORD_RESET');

    // Log activity
    await activityLogService.logPasswordResetComplete(req, user.id);

    logger.info('Password reset successful', { userId: user.id });

    res.json({
      success: true,
      data: {
        message: 'Password has been successfully reset',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request',
          details: error.errors,
        },
      });
    }

    logger.error('Password reset failed', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reset password' },
    });
  }
});

// Verify reset token (for frontend validation)
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const emailToken = await tokenService.verifyTokenWithoutUsing(token, 'PASSWORD_RESET');

    if (!emailToken) {
      return res.status(400).json({
        success: false,
        data: {
          valid: false,
        },
        error: { message: 'Invalid or expired reset token' },
      });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: emailToken.userId },
      select: { email: true },
    });

    res.json({
      success: true,
      data: {
        valid: true,
        email: user?.email,
        expiresAt: emailToken.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Token verification failed', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to verify token' },
    });
  }
});

export default router;

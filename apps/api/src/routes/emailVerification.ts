import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { TokenService } from '../services/tokenService';
import { emailService } from '../services/emailService';
import { ActivityLogService } from '../services/activityLogService';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const tokenService = new TokenService();
const activityLogService = new ActivityLogService();

// Verify email with token
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Verify token
    const emailToken = await tokenService.verifyToken(token, 'EMAIL_VERIFICATION');
    if (!emailToken) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: emailToken.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.json({
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Invalidate all verification tokens for this user
    await tokenService.invalidateUserTokens(user.id, 'EMAIL_VERIFICATION');

    // Log activity
    await activityLogService.logEmailVerified(req, user.id);

    logger.info('Email verified successfully', { userId: user.id });

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification failed', { error });
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email (requires authentication)
router.post('/resend', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email is already verified',
      });
    }

    // Invalidate old tokens
    await tokenService.invalidateUserTokens(user.id, 'EMAIL_VERIFICATION');

    // Create new verification token
    const token = await tokenService.createEmailVerificationToken(user.id);

    // Send verification email
    await emailService.sendEmailVerificationEmail(user.email, token);

    logger.info('Verification email resent', { userId: user.id });

    res.json({
      message: 'Verification email has been sent',
    });
  } catch (error) {
    logger.error('Failed to resend verification email', { error });
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Get verification status (requires authentication)
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      verified: user.emailVerified,
      email: user.email,
    });
  } catch (error) {
    logger.error('Failed to get verification status', { error });
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

export default router;

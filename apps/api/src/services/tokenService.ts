import prisma from '../config/database';
import crypto from 'crypto';

type TokenType = 'PASSWORD_RESET' | 'EMAIL_VERIFICATION';

export class TokenService {
  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a password reset token
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.emailToken.create({
      data: {
        userId,
        token,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Create an email verification token
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await prisma.emailToken.create({
      data: {
        userId,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify a token and return the email token object
   */
  async verifyToken(token: string, type: TokenType) {
    const emailToken = await prisma.emailToken.findFirst({
      where: {
        token,
        type,
        usedAt: null,
        expiresAt: {
          gt: new Date(), // Token has not expired
        },
      },
    });

    if (!emailToken) {
      return null;
    }

    // Mark token as used
    await prisma.emailToken.update({
      where: { id: emailToken.id },
      data: { usedAt: new Date() },
    });

    return emailToken;
  }

  /**
   * Verify a token without marking it as used (for validation only)
   */
  async verifyTokenWithoutUsing(token: string, type: TokenType) {
    const emailToken = await prisma.emailToken.findFirst({
      where: {
        token,
        type,
        usedAt: null,
        expiresAt: {
          gt: new Date(), // Token has not expired
        },
      },
    });

    return emailToken;
  }

  /**
   * Invalidate all tokens of a specific type for a user
   */
  async invalidateUserTokens(userId: string, type: TokenType): Promise<void> {
    await prisma.emailToken.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  /**
   * Clean up expired tokens (can be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.emailToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Check if a token exists and is valid (without marking as used)
   */
  async isTokenValid(token: string, type: TokenType): Promise<boolean> {
    const emailToken = await prisma.emailToken.findFirst({
      where: {
        token,
        type,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return !!emailToken;
  }
}

export const tokenService = new TokenService();

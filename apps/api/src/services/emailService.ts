import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import logger from '../utils/logger.js';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@financemanager.com';
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Check if email is disabled (e.g., in development)
    if (process.env.DISABLE_EMAIL === 'true') {
      logger.info('Email service is disabled');
      return;
    }

    try {
      const config: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
      };

      // Only create transporter if credentials are provided
      if (config.auth.user && config.auth.pass) {
        this.transporter = nodemailer.createTransport(config);
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email credentials not provided. Email service is disabled.');
      }
    } catch (error) {
      logger.error('Failed to initialize email service', error);
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.appUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You recently requested to reset your password for your Finance Manager account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `;

    return this.sendEmail(to, 'Reset Your Password', html);
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string): Promise<boolean> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Finance Manager!</h2>
        <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This verification link will expire in 24 hours.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `;

    return this.sendEmail(to, 'Verify Your Email Address', html);
  }

  async sendLoginNotificationEmail(
    to: string,
    ipAddress?: string,
    location?: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Login Detected</h2>
        <p>We detected a new login to your Finance Manager account.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${ipAddress ? `<p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
          ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">
          If this was you, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you don't recognize this activity, please secure your account immediately by:
        </p>
        <ul style="color: #666; font-size: 14px;">
          <li>Changing your password</li>
          <li>Reviewing active sessions in your account settings</li>
          <li>Terminating any suspicious sessions</li>
        </ul>
      </div>
    `;

    return this.sendEmail(to, 'New Login to Your Account', html);
  }

  async sendAccountLockoutEmail(to: string, unlockTime: Date): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Account Temporarily Locked</h2>
        <p>Your Finance Manager account has been temporarily locked due to multiple failed login attempts.</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 5px 0;">
            Your account will automatically unlock at: <strong>${unlockTime.toLocaleString()}</strong>
          </p>
        </div>
        <p>If this wasn't you, we recommend:</p>
        <ul>
          <li>Changing your password once your account is unlocked</li>
          <li>Enabling two-factor authentication (coming soon)</li>
          <li>Reviewing your account security settings</li>
        </ul>
        <p style="color: #666; font-size: 14px;">
          You can also reset your password immediately to unlock your account.
        </p>
      </div>
    `;

    return this.sendEmail(to, 'Account Temporarily Locked', html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn(`Email not sent (service disabled): ${subject} to ${to}`);
      // In development without email, log the email content
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email content:', { to, subject, html });
      }
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });

      logger.info(`Email sent successfully: ${subject} to ${to}`, { messageId: info.messageId });
      return true;
    } catch (error) {
      logger.error(`Failed to send email: ${subject} to ${to}`, error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', error);
      return false;
    }
  }
}

export const emailService = new EmailService();

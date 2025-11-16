import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log all errors with context
  const errorContext = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as Request & { user?: { id: string } }).user?.id,
  };

  if (err instanceof AppError) {
    // Log operational errors at warning level
    logError(`Operational Error: ${err.message}`, err, {
      ...errorContext,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode.toString(),
      },
    });
  }

  // Log unexpected errors at error level
  logError('Unexpected Error', err, errorContext);

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: '500',
    },
  });
};

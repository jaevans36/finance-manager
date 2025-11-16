import { Request, Response, NextFunction } from 'express';
import { logHttp } from '../utils/logger';

/**
 * HTTP Request/Response logging middleware using Winston
 * Logs method, URL, status code, response time, and user info
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log after response is sent
  res.end = function (chunk?: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void): Response {
    const responseTime = Date.now() - startTime;

    // Log the HTTP request
    logHttp(
      req.method,
      req.url,
      res.statusCode,
      responseTime,
      req.get('user-agent'),
      req.ip || req.socket?.remoteAddress,
      (req as Request & { user?: { id: string } }).user?.id
    );

    // Call the original end function with proper type handling
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }
    return originalEnd.call(this, chunk as never, encoding as BufferEncoding, callback) as Response;
  };

  next();
};

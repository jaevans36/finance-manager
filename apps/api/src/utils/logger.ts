import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston to use these colors
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (pretty print)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...metadata } = info;
      let msg = `${timestamp} [${level}]: ${message}`;
      
      // Add metadata if present (excluding stack traces for console)
      if (Object.keys(metadata).length > 0) {
        const { stack, ...otherMeta } = metadata;
        if (Object.keys(otherMeta).length > 0) {
          msg += ` ${JSON.stringify(otherMeta)}`;
        }
        if (stack && level.includes('error')) {
          msg += `\n${stack}`;
        }
      }
      
      return msg;
    }
  )
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define transports
const transports: winston.transport[] = [
  // Console transport for all logs
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Daily rotating file for all logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat,
  }),

  // Separate file for errors only
  new DailyRotateFile({
    level: 'error',
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    format: logFormat,
  }),

  // HTTP logs (for request/response logging)
  new DailyRotateFile({
    level: 'http',
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d', // Keep HTTP logs for 7 days
    format: logFormat,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Export logger and helper functions
export default logger;

// Type for additional metadata
type LogMetadata = Record<string, unknown>;

// Helper functions for structured logging
export const logError = (message: string, error: Error, metadata?: LogMetadata) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...metadata,
  });
};

export const logHttp = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  userAgent?: string,
  ip?: string,
  userId?: string
) => {
  logger.http('HTTP Request', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: userAgent || 'unknown',
    ip: ip || 'unknown',
    userId: userId || 'anonymous',
  });
};

export const logAuth = (action: string, userId?: string, metadata?: LogMetadata) => {
  logger.info('Auth Event', {
    action,
    userId,
    ...metadata,
  });
};

export const logDatabase = (operation: string, duration: number, metadata?: LogMetadata) => {
  logger.debug('Database Operation', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

export const logApiCall = (service: string, endpoint: string, statusCode: number, metadata?: LogMetadata) => {
  logger.info('External API Call', {
    service,
    endpoint,
    statusCode,
    ...metadata,
  });
};

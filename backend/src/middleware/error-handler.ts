import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).id || 'unknown';

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    logger.warn('Schema validation error', { requestId, issues: err.issues });
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      })),
      requestId
    });
    return;
  }

  // Handle explicit AppError
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, { requestId, statusCode: err.statusCode });
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      requestId
    });
    return;
  }

  // Generic/Internal error
  logger.error('Unhandled internal server error', err, { requestId });
  const isDev = env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message || 'Internal server error' : 'Internal server error occurred while processing disaster telemetry',
    requestId
  });
}

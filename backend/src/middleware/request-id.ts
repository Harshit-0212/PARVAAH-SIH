import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.header('x-request-id');
  const requestId = existingId || crypto.randomUUID();
  
  // Attach to request and response header
  (req as any).id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

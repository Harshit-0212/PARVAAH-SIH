import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req as any).id || 'unknown';
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint '${req.method} ${req.originalUrl}' was not found.`,
      hint: 'See GET /api/v1 for a full list of available endpoints.',
      requestId
    }
  });
}

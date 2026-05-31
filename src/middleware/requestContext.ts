import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.headers['x-correlation-id'];
  const traceId = typeof headerId === 'string' && headerId.trim().length > 0 ? headerId : randomUUID();

  req.traceId = traceId;
  res.setHeader('x-correlation-id', traceId);
  next();
}

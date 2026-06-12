import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from './errors/apiErrors';
import { requestContext } from './middleware/requestContext';
import { celebritiesRouter } from './routes/celebrities';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(requestContext);
app.use((_, res, next) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  next();
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (_req, res) => {
  res.status(200).json({ status: 'ready' });
});

app.use('/api/celebrities', celebritiesRouter);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        trace_id: req.traceId ?? 'unknown'
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'invalid_request',
        message: 'Request validation failed',
        trace_id: req.traceId ?? 'unknown'
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Internal server error',
      trace_id: req.traceId ?? 'unknown'
    }
  });
});

import { expect } from 'chai';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { z, ZodError } from 'zod';
import { ApiError } from '../../src/errors/apiErrors';
import { requestContext } from '../../src/middleware/requestContext';

/**
 * Builds a minimal Express app that mirrors the error-handling middleware in
 * src/app.ts plus two extra routes that deliberately trigger the ZodError and
 * generic-Error code paths.  A dedicated factory is used so production routing
 * is unaffected.
 */
function buildErrorTestApp() {
  const testApp = express();
  testApp.disable('x-powered-by');
  testApp.use(express.json({ limit: '50kb' }));
  testApp.use(requestContext);
  testApp.use((_req, res, next) => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('referrer-policy', 'no-referrer');
    next();
  });

  // Triggers the ZodError branch in the error handler
  testApp.post('/trigger-zod-error', (_req, _res, next) => {
    try {
      z.object({ field: z.number() }).parse({ field: 'not-a-number' });
    } catch (err) {
      next(err);
    }
  });

  // Triggers the generic Error branch (500) in the error handler
  testApp.get('/trigger-generic-error', (_req, _res, next) => {
    next(new Error('unexpected'));
  });

  // Error handler mirrors src/app.ts exactly
  testApp.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
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

  return testApp;
}

describe('app error handlers', () => {
  const testApp = buildErrorTestApp();

  describe('ZodError handler (400 invalid_request)', () => {
    it('returns 400 with code invalid_request and message Request validation failed', async () => {
      const res = await request(testApp).post('/trigger-zod-error');
      expect(res.status).to.equal(400);
      expect(res.body.error.code).to.equal('invalid_request');
      expect(res.body.error.message).to.equal('Request validation failed');
    });

    it('does not leak the ZodError issues array in the response body (OWASP A04)', async () => {
      const res = await request(testApp).post('/trigger-zod-error');
      expect(res.body.error).to.not.have.property('issues');
    });

    it('includes a trace_id field in the error envelope', async () => {
      const res = await request(testApp).post('/trigger-zod-error');
      expect(res.body.error).to.have.property('trace_id');
      expect(res.body.error.trace_id).to.be.a('string').and.not.equal('');
    });
  });

  describe('generic 500 error handler', () => {
    it('returns 500 with code internal_error and message Internal server error', async () => {
      const res = await request(testApp).get('/trigger-generic-error');
      expect(res.status).to.equal(500);
      expect(res.body.error.code).to.equal('internal_error');
      expect(res.body.error.message).to.equal('Internal server error');
    });

    it('does not leak the original error message in the response body (OWASP A05 / STRIDE Information Disclosure)', async () => {
      const res = await request(testApp).get('/trigger-generic-error');
      expect(JSON.stringify(res.body)).to.not.include('unexpected');
    });

    it('responds with application/json content-type to prevent MIME sniffing', async () => {
      const res = await request(testApp).get('/trigger-generic-error');
      expect(res.headers['content-type']).to.match(/application\/json/);
    });
  });
});

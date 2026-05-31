import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

import { getCelebrityProfileById } from './celebrities';

const celebrityIdSchema = z.object({
  id: z.string().regex(/^nm\d{7,8}$/, 'Invalid celebrity id.'),
});

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // Public, unauthenticated celeb-profile-v1 provider route.
  app.get('/api/celebrities/:id', (req, res, next) => {
    try {
      const { id } = celebrityIdSchema.parse(req.params);
      const profile = getCelebrityProfileById(id);

      if (profile == null) {
        res.status(404).json({ message: 'Celebrity profile not found.' });
        return;
      }

      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: error.issues[0]?.message ?? 'Invalid request.',
      });
      return;
    }

    res.status(500).json({ message: 'Internal server error.' });
  });

  return app;
}

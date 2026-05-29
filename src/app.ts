import express, { Request, Response } from 'express';
import { z } from 'zod';

import { getCelebrityRecord, toCelebrityProfile } from './celebrities';

const celebrityIdSchema = z.string().regex(/^nm\d{7,8}$/, 'Invalid celebrity id.');

export const app = express();

app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const allowedOrigin = process.env.CORS_ORIGIN;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

app.get('/api/celebrities/:id', (req: Request, res: Response) => {
  const parsedId = celebrityIdSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ message: 'Invalid celebrity id.' });
  }

  const record = getCelebrityRecord(parsedId.data);
  if (record == null) {
    return res.status(404).json({ message: 'Celebrity not found.' });
  }

  const profile = toCelebrityProfile(record);
  if (profile == null) {
    return res.status(404).json({ message: 'Celebrity not found.' });
  }

  return res.status(200).json(profile);
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found.' });
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT ?? '8080', 10);
  app.listen(port, () => {
    process.stdout.write(`celeb-api listening on ${port}\n`);
  });
}

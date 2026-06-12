import rateLimit from 'express-rate-limit';

function getPositiveInt(rawValue: string | undefined, fallback: number): number {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const getCelebrityRateLimit = rateLimit({
  windowMs: 60_000,
  max: getPositiveInt(process.env.CELEB_GET_RATE_LIMIT_MAX, 120),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => req.ip ?? 'unknown',
  validate: false
});

export const resolveRateLimit = rateLimit({
  windowMs: 60_000,
  max: getPositiveInt(process.env.CELEB_RESOLVE_RATE_LIMIT_MAX, 30),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req): string => req.headers.authorization ?? req.ip ?? 'unknown',
  validate: false
});

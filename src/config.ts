type ServiceConfig = {
  allowedOrigins: string[];
  imageCdnBaseUrl: string;
  port: number;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
};

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];
const DEFAULT_IMAGE_CDN_BASE_URL = 'https://images.imdb-lite.example';

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeOrigin(origin: string): string | null {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const candidates = value == null || value.trim() === ''
    ? DEFAULT_ALLOWED_ORIGINS
    : value.split(',');

  return Array.from(
    new Set(
      candidates
        .map((origin) => normalizeOrigin(origin.trim()))
        .filter((origin): origin is string => origin != null)
    )
  );
}

function parseImageCdnBaseUrl(value: string | undefined): string {
  const normalized = normalizeOrigin(value ?? '');
  return normalized ?? DEFAULT_IMAGE_CDN_BASE_URL;
}

function readConfig(env: NodeJS.ProcessEnv = process.env): ServiceConfig {
  return {
    allowedOrigins: parseAllowedOrigins(env['ALLOWED_ORIGINS']),
    imageCdnBaseUrl: parseImageCdnBaseUrl(env['IMAGE_CDN_BASE_URL']),
    port: parsePositiveInteger(env['PORT'], 8080),
    rateLimitMaxRequests: parsePositiveInteger(env['RATE_LIMIT_MAX_REQUESTS'], 60),
    rateLimitWindowMs: parsePositiveInteger(env['RATE_LIMIT_WINDOW_MS'], 60_000),
  };
}

export { readConfig };
export type { ServiceConfig };

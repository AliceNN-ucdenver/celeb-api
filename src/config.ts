import { z } from 'zod';

const configSchema = z.object({
  CELEB_API_PORT: z.coerce.number().default(8081),
  CELEB_JWT_SECRET: z.string().min(1).default('dev-secret'),
  CELEB_DB_URL: z.string().url().optional(),
  CELEB_JWT_JWKS_URL: z.string().url().optional(),
  CELEB_LICENSE_POLICY_SOURCE_URL: z.string().url().optional(),
  CELEB_LICENSE_CACHE_MAX_STALE_SECONDS: z.coerce.number().default(86400),
  CELEB_PROFILE_CACHE_TTL_SECONDS: z.coerce.number().default(900),
  CELEB_CONFIDENCE_REVIEW_THRESHOLD: z.coerce.number().min(0).max(1).default(0.72),
  TELEMETRY_BACKEND: z.enum(['prometheus', 'datadog', 'cloudwatch']).default('prometheus'),
  METRIC_CELEB_PROFILE_P95_MS: z.string().default('celeb_profile_latency_ms'),
  METRIC_CELEB_FALSE_MERGE_RATE: z.string().default('celeb_false_merge_rate'),
  METRIC_CELEB_CONFIDENCE_DISTRIBUTION: z.string().default('celeb_confidence_distribution'),
  METRIC_CELEB_LICENSE_DENIED_FIELDS: z.string().default('celeb_license_denied_fields_total')
});

export type Config = z.infer<typeof configSchema>;

export function getConfig(): Config {
  return configSchema.parse(process.env);
}

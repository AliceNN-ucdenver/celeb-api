import { z } from 'zod';

export const identityStatusSchema = z.enum(['resolved', 'ambiguous', 'manual_review_required']);

export const sourceProvenanceSchema = z.object({
  source: z.enum(['wikidata', 'tmdb', 'internal']),
  source_id: z.string().min(1),
  retrieved_at: z.date(),
  license_tag: z.string().min(1)
});

export const licensePolicySchema = z.object({
  policy_version: z.string().min(1),
  allowlist: z.array(z.string().min(1)),
  denylist: z.array(z.string().min(1)),
  decision_cached_until: z.date()
});

export const filmographyEntrySchema = z.object({
  title: z.string().min(1),
  year: z.number().int().min(1870).max(2200),
  role: z.string().min(1)
});

export const celebrityProfileDocumentSchema = z.object({
  canonical_id: z.string().min(1),
  display_name: z.string().min(1),
  aliases: z.array(z.string()),
  confidence_score: z.number().min(0).max(1),
  identity_status: identityStatusSchema,
  source_provenance: z.array(sourceProvenanceSchema),
  license_policy: licensePolicySchema,
  biography: z.string().optional(),
  filmography: z.array(filmographyEntrySchema).optional(),
  updated_at: z.date()
});

export type IdentityStatus = z.infer<typeof identityStatusSchema>;
export type SourceProvenance = z.infer<typeof sourceProvenanceSchema>;
export type LicensePolicyDocument = z.infer<typeof licensePolicySchema>;
export type FilmographyEntry = z.infer<typeof filmographyEntrySchema>;
export type CelebrityProfileDocument = z.infer<typeof celebrityProfileDocumentSchema>;

export interface CelebrityProfileResponse {
  canonical_id: string;
  display_name: string;
  confidence_score: number;
  identity_status: IdentityStatus;
  source_provenance: Array<{
    source: 'wikidata' | 'tmdb' | 'internal';
    source_id: string;
    retrieved_at: string;
    license_tag: string;
  }>;
  license_policy: {
    policy_version: string;
    allowed_fields: string[];
    denied_fields: string[];
  };
  biography?: string;
  filmography?: FilmographyEntry[];
}

export const getCelebrityByIdRequestSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  query: z.object({
    disambiguation_id: z.string().trim().min(1).optional()
  })
});

export const resolveCelebrityRequestSchema = z.object({
  external_candidates: z.array(
    z.object({
      source: z.string().trim().min(1),
      source_id: z.string().trim().min(1),
      display_name: z.string().trim().min(1)
    })
  ).min(1),
  canonical_hint: z.string().trim().min(1).optional()
});

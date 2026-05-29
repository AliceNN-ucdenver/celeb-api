import { z } from 'zod';

const CELEB_PROFILE_VERSION = 'celeb-profile-v1';

const celebIdSchema = z
  .string()
  .regex(/^celeb-[a-z0-9-]{3,32}$/, 'Celebrity ids must use the celeb-<slug> format.');

const knownForCreditSchema = z.object({
  titleId: z.string().regex(/^tt[0-9]{7,10}$/),
  title: z.string().min(1).max(120),
  year: z.number().int().gte(1888).lte(2100),
  role: z.string().min(1).max(80),
});

const heroImageSchema = z.object({
  url: z.url({ protocol: /^https$/ }),
  altText: z.string().min(1).max(160),
});

const celebProfileSchema = z.object({
  version: z.literal(CELEB_PROFILE_VERSION),
  id: celebIdSchema,
  displayName: z.string().min(1).max(120),
  shortBiography: z.string().min(1).max(600),
  knownFor: z.array(knownForCreditSchema).min(1).max(6),
  heroImage: heroImageSchema,
  editorialHighlights: z.array(z.string().min(1).max(80)).min(1).max(6),
  profileLastUpdated: z.iso.date(),
});

type KnownForCredit = z.output<typeof knownForCreditSchema>;
type HeroImage = z.output<typeof heroImageSchema>;
type CelebProfile = z.output<typeof celebProfileSchema>;

export {
  CELEB_PROFILE_VERSION,
  celebIdSchema,
  knownForCreditSchema,
  heroImageSchema,
  celebProfileSchema,
};

export type { KnownForCredit, HeroImage, CelebProfile };

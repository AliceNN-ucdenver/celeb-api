import { celebProfileSchema, type CelebProfile, type KnownForCredit } from '../contracts/celebProfile';
import type { ServiceConfig } from '../config';
import type { StoredCelebProfile } from '../data/celebProfiles';

function buildImageUrl(imageCdnBaseUrl: string, imagePath: string): string {
  const url = new URL(imagePath.replace(/^\/+/, ''), `${imageCdnBaseUrl}/`);
  return url.toString();
}

function sanitizeHighlights(highlights: string[]): string[] {
  return highlights.slice(0, 6).map((highlight) => highlight.trim()).filter(Boolean);
}

function sanitizeKnownFor(knownFor: StoredCelebProfile['knownFor']): KnownForCredit[] {
  return knownFor.slice(0, 6).map((credit) => ({
    titleId: credit.titleId,
    title: credit.title.trim(),
    year: credit.year,
    role: credit.role.trim(),
  }));
}

function toPublicCelebProfile(
  celebId: string,
  profile: StoredCelebProfile,
  config: ServiceConfig
): CelebProfile {
  return celebProfileSchema.parse({
    version: 'celeb-profile-v1',
    id: celebId,
    displayName: profile.displayName.trim(),
    shortBiography: profile.shortBiography.trim(),
    knownFor: sanitizeKnownFor(profile.knownFor),
    heroImage: {
      url: buildImageUrl(config.imageCdnBaseUrl, profile.heroImagePath),
      altText: `Publicity headshot of ${profile.displayName.trim()}`,
    },
    editorialHighlights: sanitizeHighlights(profile.editorialHighlights),
    profileLastUpdated: profile.profileLastUpdated,
  });
}

export { toPublicCelebProfile };

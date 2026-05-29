import { celebIdSchema, type CelebProfile } from '../contracts/celebProfile';
import type { ServiceConfig } from '../config';
import { celebProfiles } from '../data/celebProfiles';
import { toPublicCelebProfile } from '../policy/celebProfilePolicy';

function getCelebProfile(celebId: string, config: ServiceConfig): CelebProfile | null {
  const validatedId = celebIdSchema.parse(celebId);
  const profile = celebProfiles.get(validatedId);

  if (profile == null) {
    return null;
  }

  return toPublicCelebProfile(validatedId, profile, config);
}

export { getCelebProfile };

import { LicenseBlockedError } from '../errors/apiErrors';
import type { CelebrityProfileDocument, CelebrityProfileResponse } from '../models/celebrityProfile';

const ALL_OPTIONAL_FIELDS = ['biography', 'filmography'] as const;

type OptionalField = (typeof ALL_OPTIONAL_FIELDS)[number];

function isOptionalField(value: string): value is OptionalField {
  return (ALL_OPTIONAL_FIELDS as readonly string[]).includes(value);
}

export function serializeProfileByLicense(profile: CelebrityProfileDocument): CelebrityProfileResponse {
  const allowed = profile.license_policy.allowlist.filter(isOptionalField);
  const denied = profile.license_policy.denylist.filter(isOptionalField);

  if (denied.length > 0 && allowed.length === 0) {
    throw new LicenseBlockedError();
  }

  const response: CelebrityProfileResponse = {
    canonical_id: profile.canonical_id,
    display_name: profile.display_name,
    confidence_score: profile.confidence_score,
    identity_status: profile.identity_status,
    source_provenance: profile.source_provenance.map((item) => ({
      source: item.source,
      source_id: item.source_id,
      retrieved_at: item.retrieved_at.toISOString(),
      license_tag: item.license_tag
    })),
    license_policy: {
      policy_version: profile.license_policy.policy_version,
      allowed_fields: allowed,
      denied_fields: denied
    }
  };

  if (allowed.includes('biography') && profile.biography) {
    response.biography = profile.biography;
  }

  if (allowed.includes('filmography') && profile.filmography) {
    response.filmography = profile.filmography;
  }

  return response;
}

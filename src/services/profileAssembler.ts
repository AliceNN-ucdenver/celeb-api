import { CelebrityNotFoundError } from '../errors/apiErrors';
import {
  celebrityProfileDocumentSchema,
  type CelebrityProfileDocument,
  type CelebrityProfileResponse
} from '../models/celebrityProfile';
import { serializeProfileByLicense } from './licensePolicyService';
import { resolveIdentityStatus, scoreIdentityConfidence } from './disambiguationService';

const seedProfiles: Record<string, CelebrityProfileDocument> = {
  nm0000138: {
    canonical_id: 'nm0000138',
    display_name: 'Leonardo DiCaprio',
    aliases: ['Leo DiCaprio'],
    confidence_score: 0.97,
    identity_status: 'resolved',
    source_provenance: [
      {
        source: 'wikidata',
        source_id: 'Q38111',
        license_tag: 'CC-BY-SA-3.0',
        retrieved_at: new Date('2026-05-20T00:00:00Z')
      }
    ],
    license_policy: {
      policy_version: 'v1.0.0',
      allowlist: ['biography', 'filmography'],
      denylist: [],
      decision_cached_until: new Date('2026-06-20T00:00:00Z')
    },
    biography: 'Leonardo DiCaprio is an American actor and producer.',
    filmography: [
      { title: 'Inception', year: 2010, role: 'Cobb' },
      { title: 'The Revenant', year: 2015, role: 'Hugh Glass' }
    ],
    updated_at: new Date('2026-05-20T00:00:00Z')
  },
  blocked001: {
    canonical_id: 'blocked001',
    display_name: 'Rights Restricted Celebrity',
    aliases: ['Restricted Person'],
    confidence_score: 0.92,
    identity_status: 'resolved',
    source_provenance: [
      {
        source: 'internal',
        source_id: 'restricted-asset',
        license_tag: 'RESTRICTED',
        retrieved_at: new Date('2026-05-18T00:00:00Z')
      }
    ],
    license_policy: {
      policy_version: 'v1.0.0',
      allowlist: [],
      denylist: ['biography', 'filmography'],
      decision_cached_until: new Date('2026-06-20T00:00:00Z')
    },
    biography: 'This text should not be released',
    filmography: [{ title: 'Hidden Project', year: 2024, role: 'Lead' }],
    updated_at: new Date('2026-05-18T00:00:00Z')
  }
};

export function getCelebrityProfileById(id: string): CelebrityProfileResponse {
  const profile = seedProfiles[id];
  if (!profile) {
    throw new CelebrityNotFoundError(id);
  }

  const parsed = celebrityProfileDocumentSchema.parse(profile);
  return serializeProfileByLicense(parsed);
}

export function resolveCelebrityIdentity(input: {
  external_candidates: Array<{ source: string; source_id: string; display_name: string }>;
  canonical_hint?: string;
}): { identity_status: 'manual_review_required' | 'resolved' } {
  const candidateCount = input.external_candidates.length;
  const topCandidate = input.external_candidates[0];
  const hasNameMatch = Boolean(input.canonical_hint && topCandidate?.display_name.includes(input.canonical_hint));
  const confidence = scoreIdentityConfidence(input.canonical_hint, candidateCount, hasNameMatch);
  const status = resolveIdentityStatus(confidence);

  if (status === 'manual_review_required' || status === 'ambiguous') {
    return { identity_status: 'manual_review_required' };
  }

  return { identity_status: 'resolved' };
}

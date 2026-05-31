import { expect } from 'chai';
import { LicenseBlockedError } from '../../src/errors/apiErrors';
import { serializeProfileByLicense } from '../../src/services/licensePolicyService';
import type { CelebrityProfileDocument } from '../../src/models/celebrityProfile';

describe('licensePolicyService', () => {
  const baseProfile: CelebrityProfileDocument = {
    canonical_id: 'nm1',
    display_name: 'Sample',
    aliases: [],
    confidence_score: 0.95,
    identity_status: 'resolved',
    source_provenance: [
      {
        source: 'internal',
        source_id: 'x1',
        retrieved_at: new Date('2026-01-01T00:00:00Z'),
        license_tag: 'CC0'
      }
    ],
    license_policy: {
      policy_version: 'v1',
      allowlist: ['biography'],
      denylist: ['filmography'],
      decision_cached_until: new Date('2026-01-02T00:00:00Z')
    },
    biography: 'Allowed bio',
    filmography: [{ title: 'Blocked', year: 2020, role: 'Role' }],
    updated_at: new Date('2026-01-01T00:00:00Z')
  };

  it('serializes only allowed fields', () => {
    const serialized = serializeProfileByLicense(baseProfile);
    expect(serialized.biography).to.equal('Allowed bio');
    expect(serialized.filmography).to.equal(undefined);
    expect(serialized.license_policy.allowed_fields).to.deep.equal(['biography']);
    expect(serialized.license_policy.denied_fields).to.deep.equal(['filmography']);
  });

  it('throws when all optional fields are blocked', () => {
    const blockedProfile: CelebrityProfileDocument = {
      ...baseProfile,
      license_policy: {
        ...baseProfile.license_policy,
        allowlist: [],
        denylist: ['biography', 'filmography']
      }
    };

    expect(() => serializeProfileByLicense(blockedProfile)).to.throw(LicenseBlockedError);
  });
});

import assert from 'node:assert/strict';

import { CELEB_PROFILE_VERSION, celebProfileSchema, getCelebProfile, readConfig } from '../src';

describe('celeb-profile-v1 contract', () => {
  it('returns a policy-filtered celebrity profile for a known id', () => {
    const profile = getCelebProfile(
      'celeb-tom-hanks',
      readConfig({ IMAGE_CDN_BASE_URL: 'https://cdn.example.test' })
    );

    assert.ok(profile);
    assert.equal(profile.version, CELEB_PROFILE_VERSION);
    assert.equal(profile.id, 'celeb-tom-hanks');
    assert.equal(profile.heroImage.url, 'https://cdn.example.test/celebs/celeb-tom-hanks.webp');
    assert.doesNotThrow(() => celebProfileSchema.parse(profile));
  });

  it('returns null for a missing celebrity profile', () => {
    const profile = getCelebProfile(
      'celeb-missing-profile',
      readConfig({ IMAGE_CDN_BASE_URL: 'https://cdn.example.test' })
    );

    assert.equal(profile, null);
  });
});

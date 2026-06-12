import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.CELEB_GET_RATE_LIMIT_MAX = '120';
process.env.CELEB_RESOLVE_RATE_LIMIT_MAX = '30';
import { app } from '../../src/app';

describe('celebrities routes', () => {
  beforeEach(() => {
    process.env.CELEB_JWT_SECRET = 'test-secret';
    process.env.CELEB_CONFIDENCE_REVIEW_THRESHOLD = '0.72';
  });

  it('returns celebrity profile by id', async () => {
    const response = await request(app).get('/api/celebrities/nm0000138');

    expect(response.status).to.equal(200);
    expect(response.body).to.include({
      canonical_id: 'nm0000138',
      display_name: 'Leonardo DiCaprio'
    });
    expect(response.body.license_policy.allowed_fields).to.deep.equal(['biography', 'filmography']);
  });

  it('returns 404 for unknown id', async () => {
    const response = await request(app).get('/api/celebrities/missing-id');

    expect(response.status).to.equal(404);
    expect(response.body.error.code).to.equal('celebrity_not_found');
  });

  it('returns 451 for license blocked profile', async () => {
    const response = await request(app).get('/api/celebrities/blocked001');

    expect(response.status).to.equal(451);
    expect(response.body.error.code).to.equal('license_blocked');
  });

  it('blocks resolve endpoint without reviewer/admin role', async () => {
    const response = await request(app)
      .post('/api/celebrities/resolve')
      .send({
        external_candidates: [{ source: 'tmdb', source_id: '1', display_name: 'Name' }]
      });

    expect(response.status).to.equal(403);
    expect(response.body.error.code).to.equal('forbidden');
  });

  it('accepts resolve endpoint for reviewer role', async () => {
    const token = jwt.sign({ sub: 'user-1', role: 'reviewer' }, process.env.CELEB_JWT_SECRET as string, {
      algorithm: 'HS256',
      expiresIn: '5m'
    });

    const response = await request(app)
      .post('/api/celebrities/resolve')
      .set('Authorization', token)
      .send({
        external_candidates: [{ source: 'tmdb', source_id: '1', display_name: 'Name' }],
        canonical_hint: 'Name'
      });

    expect([200, 202]).to.include(response.status);
    expect(['resolved', 'manual_review_required']).to.include(response.body.identity_status);
  });

});

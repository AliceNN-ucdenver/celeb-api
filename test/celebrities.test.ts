import { expect } from 'chai';
import request from 'supertest';

import { createApp } from '../src/app';

describe('celeb-profile-v1', () => {
  it('returns a policy-enforced celebrity profile payload', async () => {
    const response = await request(createApp()).get('/api/celebrities/nm0000138');

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      id: 'nm0000138',
      display_name: 'Leonardo DiCaprio',
      summary: 'American actor and producer known for dramatic film performances.',
      birth_year: 1974,
      death_year: null,
      known_for: [
        { title: 'Titanic', year: 1997, category: 'film', role: 'Jack Dawson' },
        { title: 'Inception', year: 2010, category: 'film', role: 'Cobb' },
      ],
      primary_image_url: null,
    });
    expect(response.body).to.not.have.property('internalNotes');
    expect(response.headers['content-security-policy']).to.equal(
      "default-src 'none'; frame-ancestors 'none'"
    );
    expect(response.headers['x-content-type-options']).to.equal('nosniff');
  });

  it('rejects malformed celebrity ids', async () => {
    const response = await request(createApp()).get('/api/celebrities/not-valid');

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({ message: 'Invalid celebrity id.' });
  });

  it('does not expose ambiguous internal records', async () => {
    const response = await request(createApp()).get('/api/celebrities/nm9999999');

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({ message: 'Celebrity profile not found.' });
  });
});

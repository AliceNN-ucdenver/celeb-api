const assert = require('node:assert/strict');
const request = require('supertest');

const { app } = require('../dist/app');

describe('GET /api/celebrities/:id', () => {
  it('returns the canonical celebrity profile contract', async () => {
    const response = await request(app).get('/api/celebrities/nm0000138');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      id: 'nm0000138',
      display_name: 'Leonardo DiCaprio',
      summary: 'Academy Award-winning actor and producer known for dramatic lead performances.',
      known_for: ['Titanic', 'Inception', 'The Revenant'],
      profile_image_url: null,
    });
  });

  it('rejects malformed celebrity ids', async () => {
    const response = await request(app).get('/api/celebrities/not-a-real-id');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { message: 'Invalid celebrity id.' });
  });

  it('returns a generic not found response for unknown ids', async () => {
    const response = await request(app).get('/api/celebrities/nm1234567');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { message: 'Celebrity not found.' });
  });
});

process.env.CELEB_GET_RATE_LIMIT_MAX = '120';
process.env.CELEB_RESOLVE_RATE_LIMIT_MAX = '30';

import { expect } from 'chai';
import request from 'supertest';
import { app } from '../../src/app';

describe('app security headers and health probes', () => {
  describe('GET /healthz', () => {
    it('returns 200 with body { status: "ok" }', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ status: 'ok' });
    });

    it('sets x-content-type-options: nosniff (OWASP A05)', async () => {
      const res = await request(app).get('/healthz');
      expect(res.headers['x-content-type-options']).to.equal('nosniff');
    });

    it('sets x-frame-options: DENY (OWASP A05)', async () => {
      const res = await request(app).get('/healthz');
      expect(res.headers['x-frame-options']).to.equal('DENY');
    });

    it('sets referrer-policy: no-referrer (OWASP A05)', async () => {
      const res = await request(app).get('/healthz');
      expect(res.headers['referrer-policy']).to.equal('no-referrer');
    });

    it('does not expose an x-powered-by header (fingerprinting suppression)', async () => {
      const res = await request(app).get('/healthz');
      expect(res.headers).to.not.have.property('x-powered-by');
    });
  });

  describe('GET /readyz', () => {
    it('returns 200 with body { status: "ready" }', async () => {
      const res = await request(app).get('/readyz');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ status: 'ready' });
    });

    it('sets x-content-type-options: nosniff (OWASP A05)', async () => {
      const res = await request(app).get('/readyz');
      expect(res.headers['x-content-type-options']).to.equal('nosniff');
    });

    it('sets x-frame-options: DENY (OWASP A05)', async () => {
      const res = await request(app).get('/readyz');
      expect(res.headers['x-frame-options']).to.equal('DENY');
    });

    it('sets referrer-policy: no-referrer (OWASP A05)', async () => {
      const res = await request(app).get('/readyz');
      expect(res.headers['referrer-policy']).to.equal('no-referrer');
    });

    it('does not expose an x-powered-by header (fingerprinting suppression)', async () => {
      const res = await request(app).get('/readyz');
      expect(res.headers).to.not.have.property('x-powered-by');
    });
  });

  describe('50 kb body-size guard (STRIDE Denial of Service)', () => {
    it('rejects payloads larger than 50 kb with a non-200 response', async () => {
      const largeBody = { data: 'x'.repeat(60_000) };
      const res = await request(app)
        .post('/api/celebrities/resolve')
        .send(largeBody);
      expect(res.status).to.not.equal(200);
    });
  });
});

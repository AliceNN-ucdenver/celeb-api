process.env.CELEB_JWT_SECRET = 'test-secret';

import { expect } from 'chai';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import * as configModule from '../../src/config';
import { requireRoles } from '../../src/middleware/authz';

const TEST_SECRET = 'test-secret';

function buildAuthzTestApp() {
  const testApp = express();
  testApp.get('/protected', requireRoles('reviewer'), (req, res) => {
    res.json({ user: req.user });
  });
  testApp.get('/admin-only', requireRoles('admin'), (req, res) => {
    res.json({ user: req.user });
  });
  return testApp;
}

describe('authz middleware', () => {
  const testApp = buildAuthzTestApp();

  beforeEach(() => {
    process.env.CELEB_JWT_SECRET = TEST_SECRET;
  });

  describe('verifyJwt — missing / malformed Authorization header (OWASP A07)', () => {
    it('returns 403 when Authorization header is absent', async () => {
      const res = await request(testApp).get('/protected');
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 403 when Authorization header does not start with Bearer', async () => {
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Basic abc123');
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 403 when Authorization uses ****** whitespace-only token', async () => {
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer   ');
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });
  });

  describe('verifyJwt — JWT signature, expiry, and role validation (OWASP A07)', () => {
    it('returns 403 for a JWT signed with a different secret', async () => {
      const tok = jwt.sign({ sub: 'user-1', role: 'reviewer' }, 'wrong-secret', { algorithm: 'HS256' });
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 403 for an expired JWT', async () => {
      const tok = jwt.sign(
        { sub: 'user-1', role: 'reviewer', exp: Math.floor(Date.now() / 1000) - 10 },
        TEST_SECRET,
        { algorithm: 'HS256' }
      );
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 403 for a JWT with an unrecognized role', async () => {
      const tok = jwt.sign({ sub: 'user-1', role: 'editor' }, TEST_SECRET, { algorithm: 'HS256' });
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 403 for a JWT with no role claim', async () => {
      const tok = jwt.sign({ sub: 'user-1' }, TEST_SECRET, { algorithm: 'HS256' });
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 403 for a JWT with an empty sub claim', async () => {
      const tok = jwt.sign({ sub: '', role: 'reviewer' }, TEST_SECRET, { algorithm: 'HS256' });
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });

    it('returns 200 and populates req.user for a valid admin token', async () => {
      const tok = jwt.sign({ sub: 'admin-1', role: 'admin' }, TEST_SECRET, { algorithm: 'HS256', expiresIn: '5m' });
      const res = await request(testApp)
        .get('/admin-only')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(200);
      expect(res.body.user).to.include({ sub: 'admin-1', role: 'admin' });
    });
  });

  describe('verifyJwt — missing JWT secret configuration (OWASP A02)', () => {
    let originalGetConfig: typeof configModule.getConfig;

    beforeEach(() => {
      originalGetConfig = configModule.getConfig;
      (configModule as any).getConfig = () => ({ CELEB_JWT_SECRET: undefined });
    });

    afterEach(() => {
      (configModule as any).getConfig = originalGetConfig;
    });

    it('returns 403 (not 500) when CELEB_JWT_SECRET is not configured', async () => {
      const tok = jwt.sign({ sub: 'user-1', role: 'reviewer' }, TEST_SECRET, { algorithm: 'HS256', expiresIn: '5m' });
      const res = await request(testApp)
        .get('/protected')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });
  });

  describe('requireRoles — role mismatch (OWASP A01)', () => {
    it('returns 403 when a reviewer token is used on an admin-only route', async () => {
      const tok = jwt.sign({ sub: 'user-1', role: 'reviewer' }, TEST_SECRET, { algorithm: 'HS256', expiresIn: '5m' });
      const res = await request(testApp)
        .get('/admin-only')
        .set('Authorization', 'Bearer ' + tok);
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: { code: 'forbidden' } });
    });
  });
});

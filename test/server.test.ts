import assert from 'node:assert/strict';

import { createServer, readConfig } from '../src';

async function withServer(
  fn: (baseUrl: string) => Promise<void>,
  env: NodeJS.ProcessEnv = {}
): Promise<void> {
  const server = createServer(
    readConfig({
      ALLOWED_ORIGINS: 'http://localhost:5173',
      IMAGE_CDN_BASE_URL: 'https://cdn.example.test',
      RATE_LIMIT_MAX_REQUESTS: '2',
      RATE_LIMIT_WINDOW_MS: '60000',
      ...env,
    })
  );

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();

  if (address == null || typeof address === 'string') {
    throw new Error('Expected an ephemeral TCP port.');
  }

  try {
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error?: Error) => {
      if (error != null) {
        reject(error);
        return;
      }

      resolve();
    }));
  }
}

describe('celeb API server', () => {
  it('serves a public celeb profile response with security headers', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/celebs/celeb-sigourney-weaver`, {
        headers: {
          Origin: 'http://localhost:5173',
          'X-Correlation-ID': 'test-correlation-id',
        },
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
      assert.equal(response.headers.get('x-correlation-id'), 'test-correlation-id');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');

      const payload = (await response.json()) as { id: string; displayName: string };
      assert.equal(payload.id, 'celeb-sigourney-weaver');
      assert.equal(payload.displayName, 'Sigourney Weaver');
    });
  });

  it('rejects invalid celebrity ids with a generic 400 response', async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/v1/celebs/not-a-valid-id`);
      assert.equal(response.status, 400);

      const payload = (await response.json()) as { message: string };
      assert.equal(payload.message, 'Invalid celebrity id.');
    });
  });

  it('rate limits repeated requests', async () => {
    await withServer(async (baseUrl) => {
      await fetch(`${baseUrl}/v1/celebs/celeb-tom-hanks`);
      await fetch(`${baseUrl}/v1/celebs/celeb-tom-hanks`);
      const response = await fetch(`${baseUrl}/v1/celebs/celeb-tom-hanks`);

      assert.equal(response.status, 429);
      const payload = (await response.json()) as { message: string };
      assert.equal(payload.message, 'Too many requests. Please retry later.');
    });
  });
});

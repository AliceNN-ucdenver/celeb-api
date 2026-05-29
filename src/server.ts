import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';

import { ZodError } from 'zod';

import { readConfig, type ServiceConfig } from './config';
import { getCelebProfile } from './service/celebProfileService';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_BUCKETS = new Map<string, RateLimitEntry>();

function setCommonHeaders(response: ServerResponse, correlationId: string): void {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Correlation-ID', correlationId);
}

function setCorsHeaders(
  request: IncomingMessage,
  response: ServerResponse,
  config: ServiceConfig
): boolean {
  const origin = request.headers.origin;

  if (origin == null) {
    return true;
  }

  if (!config.allowedOrigins.includes(origin)) {
    return false;
  }

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Correlation-ID');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Vary', 'Origin');
  return true;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
  correlationId: string
): void {
  response.statusCode = statusCode;
  setCommonHeaders(response, correlationId);
  response.end(JSON.stringify(body));
}

function getClientKey(request: IncomingMessage): string {
  return request.socket.remoteAddress ?? 'unknown';
}

function isRateLimited(request: IncomingMessage, config: ServiceConfig): boolean {
  const key = getClientKey(request);
  const now = Date.now();
  const current = RATE_LIMIT_BUCKETS.get(key);

  if (current == null || current.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(key, {
      count: 1,
      resetAt: now + config.rateLimitWindowMs,
    });
    return false;
  }

  if (current.count >= config.rateLimitMaxRequests) {
    return true;
  }

  current.count += 1;
  return false;
}

function getCorrelationId(request: IncomingMessage): string {
  const header = request.headers['x-correlation-id'];
  if (typeof header === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(header)) {
    return header;
  }

  return randomUUID();
}

function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ServiceConfig
): void {
  const correlationId = getCorrelationId(request);

  if (!setCorsHeaders(request, response, config)) {
    sendJson(response, 403, { message: 'Origin not allowed.' }, correlationId);
    return;
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    setCommonHeaders(response, correlationId);
    response.end();
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { message: 'Method not allowed.' }, correlationId);
    return;
  }

  if (isRateLimited(request, config)) {
    sendJson(response, 429, { message: 'Too many requests. Please retry later.' }, correlationId);
    return;
  }

  const url = new URL(request.url ?? '/', 'http://localhost');

  if (url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' }, correlationId);
    return;
  }

  // Public, read-only endpoint by design for celeb-profile-v1 consumers.
  const match = /^\/v1\/celebs\/([^/]+)$/.exec(url.pathname);
  if (match == null) {
    sendJson(response, 404, { message: 'Resource not found.' }, correlationId);
    return;
  }

  try {
    const celebProfile = getCelebProfile(decodeURIComponent(match[1]), config);

    if (celebProfile == null) {
      sendJson(response, 404, { message: 'Celebrity profile not found.' }, correlationId);
      return;
    }

    sendJson(response, 200, celebProfile, correlationId);
  } catch (error) {
    if (error instanceof ZodError) {
      sendJson(response, 400, { message: 'Invalid celebrity id.' }, correlationId);
      return;
    }

    sendJson(response, 500, { message: 'Something went wrong.' }, correlationId);
  }
}

function createServer(config: ServiceConfig = readConfig()) {
  return createHttpServer((request, response) => {
    handleRequest(request, response, config);
  });
}

if (require.main === module) {
  const config = readConfig();
  const server = createServer(config);
  server.listen(config.port, () => {
    process.stdout.write(`celeb-api listening on port ${config.port}\n`);
  });
}

export { createServer, handleRequest };

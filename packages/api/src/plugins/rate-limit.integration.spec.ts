import { describe, expect, test } from 'bun:test';
import { ErrorCode } from '@errors/app-error';
import { setupTestServer } from '@utils/test-setup';

const RATE_LIMIT_ERROR_MESSAGE =
  'Muitas requisições. Por favor, aguarde um momento antes de tentar novamente.';

describe('Rate Limit Global — GET /health (limite: 100 req/min)', () => {
  test('101ª requisição deve retornar 429 TOO_MANY_REQUESTS', async () => {
    const server = await setupTestServer();

    try {
      for (let i = 0; i < 100; i++) {
        const res = await server.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).not.toBe(429);
      }

      const blocked = await server.inject({ method: 'GET', url: '/health' });

      expect(blocked.statusCode).toBe(429);
      const body = blocked.json();
      expect(body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
      expect(body.message).toBe(RATE_LIMIT_ERROR_MESSAGE);
    } finally {
      await server.close();
    }
  });
});

describe('Rate Limit Sensível — POST /auth/login (limite: 5 req/min)', () => {
  test('6ª requisição deve retornar 429 TOO_MANY_REQUESTS', async () => {
    const server = await setupTestServer();

    try {
      for (let i = 0; i < 5; i++) {
        const res = await server.inject({
          method: 'POST',
          url: '/auth/login',
          headers: { 'content-type': 'application/json' },
          payload: { email: 'test@example.com', password: 'any' },
        });
        expect(res.statusCode).not.toBe(429);
      }

      const blocked = await server.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { email: 'test@example.com', password: 'any' },
      });

      expect(blocked.statusCode).toBe(429);
      const body = blocked.json();
      expect(body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
      expect(body.message).toBe(RATE_LIMIT_ERROR_MESSAGE);
    } finally {
      await server.close();
    }
  });
});

describe('Rate Limit Sensível — POST /users (limite: 5 req/min)', () => {
  test('6ª requisição deve retornar 429 TOO_MANY_REQUESTS', async () => {
    const server = await setupTestServer();

    try {
      for (let i = 0; i < 5; i++) {
        const res = await server.inject({
          method: 'POST',
          url: '/users',
          headers: { 'content-type': 'application/json' },
          payload: { name: 'Test', email: 'test@example.com', password: 'any' },
        });
        expect(res.statusCode).not.toBe(429);
      }

      const blocked = await server.inject({
        method: 'POST',
        url: '/users',
        headers: { 'content-type': 'application/json' },
        payload: { name: 'Test', email: 'test@example.com', password: 'any' },
      });

      expect(blocked.statusCode).toBe(429);
      const body = blocked.json();
      expect(body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
      expect(body.message).toBe(RATE_LIMIT_ERROR_MESSAGE);
    } finally {
      await server.close();
    }
  });
});

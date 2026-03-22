import { test } from 'bun:test';
import { setupTestServer } from '@utils/test-setup';
import { healthCheckResponseSchema } from './schemas';

// Helper para parsear o schema Zod
function parseHealthResponse(data: unknown) {
  return healthCheckResponseSchema.safeParse(data);
}

test('GET /health - db up e status ok', async () => {
  const app = await setupTestServer();
  const response = await app.inject({
    method: 'GET',
    url: '/health',
  });

  // Status HTTP
  if (response.statusCode !== 200) {
    throw new Error(`Esperado status 200, recebido ${response.statusCode}`);
  }

  // Corpo da resposta
  const json = response.json();
  const parsed = parseHealthResponse(json);
  if (!parsed.success) {
    throw new Error(
      'Resposta não corresponde ao schema HealthCheckResponse: ' +
        JSON.stringify(parsed.error),
    );
  }
});

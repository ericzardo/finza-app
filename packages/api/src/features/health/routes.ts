import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { checkHealthController } from './controllers/check-health.controller';
import { healthCheckResponseSchema } from './schemas';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        description: 'Health check da API e do banco',
        response: {
          200: healthCheckResponseSchema,
        },
      },
    },
    (request, reply) => checkHealthController(request, reply, fastify),
  );
}

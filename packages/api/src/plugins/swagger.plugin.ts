import swagger from '@fastify/swagger';
import apiReference from '@scalar/fastify-api-reference';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Finza API',
        description:
          'Documentação da API da Finza — gerenciamento financeiro pessoal e colaborativo.',
        version: '1.0.0',
      },
      tags: [],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'finza_token',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  fastify.get('/docs/json', async () => {
    return fastify.swagger();
  });

  await fastify.register(apiReference, {
    routePrefix: '/docs',
    configuration: {
      title: 'Finza API Reference',
      theme: 'purple',
      metaData: {
        title: 'Finza API Reference',
        description:
          'Documentação interativa da API da Finza, gerenciamento financeiro pessoal e colaborativo.',
        ogTitle: 'Finza API Reference',
      },
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
      url: '/docs/json',
    },
  });
};

export default fp(swaggerPlugin, { name: 'swagger' });

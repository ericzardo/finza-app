import { appErrorSchema } from '@errors/app-error-schemas';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createBucketController } from './controllers/create-bucket.controller';
import { deleteBucketController } from './controllers/delete-bucket.controller';
import { distributeInboxBalanceController } from './controllers/distribute-inbox-balance.controller';
import { listBucketsController } from './controllers/list-buckets.controller';
import { updateBucketController } from './controllers/update-bucket.controller';
import {
  createBucketBodySchema,
  createBucketResponseSchema,
  deleteBucketParamsSchema,
  distributeInboxBalanceBodySchema,
  distributeInboxBalanceResponseSchema,
  inboxDistributionParamsSchema,
  listBucketsQuerySchema,
  listBucketsResponseSchema,
  updateBucketBodySchema,
  updateBucketParamsSchema,
  updateBucketResponseSchema,
} from './schemas';

export async function bucketsRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/workspaces/:workspaceId/buckets/inbox/distribute',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['buckets'],
        summary: 'Distribuir saldo livre do INBOX',
        description:
          'Distribui o saldo livre atual do Caixa de Entrada (INBOX) para caixas de propósito, criando apenas partidas dobradas na tabela de transações.',
        params: inboxDistributionParamsSchema,
        body: distributeInboxBalanceBodySchema,
        response: {
          201: distributeInboxBalanceResponseSchema,
          400: appErrorSchema.describe(
            'Erro de validação, saldo insuficiente no INBOX ou workspaceId divergente do header',
          ),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe(
            'Caixa de Entrada (INBOX) ou caixa de propósito não encontrado',
          ),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) =>
      distributeInboxBalanceController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/buckets',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['buckets'],
        summary: 'Criar caixa',
        description: 'Cria um novo caixa no workspace.',
        body: createBucketBodySchema,
        response: {
          201: createBucketResponseSchema,
          400: appErrorSchema.describe('Erro de validação ou header ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => createBucketController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/buckets',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['buckets'],
        summary: 'Listar caixas',
        description:
          'Lista todos os caixas do workspace com agregações financeiras do período.',
        querystring: listBucketsQuerySchema,
        response: {
          200: listBucketsResponseSchema,
          400: appErrorSchema.describe('Header x-workspace-id ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => listBucketsController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().patch(
    '/buckets/:bucketId',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['buckets'],
        summary: 'Atualizar caixa',
        description:
          'Atualiza nome, tipo ou percentual de alocação do caixa. O caixa INBOX não pode ser editado.',
        params: updateBucketParamsSchema,
        body: updateBucketBodySchema,
        response: {
          200: updateBucketResponseSchema,
          400: appErrorSchema.describe('Erro de validação ou header ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe(
            'Sem permissão ou tentativa de editar INBOX',
          ),
          404: appErrorSchema.describe('Caixa não encontrado'),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => updateBucketController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().delete(
    '/buckets/:bucketId',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['buckets'],
        summary: 'Deletar caixa',
        description:
          'Remove um caixa do workspace. O caixa INBOX não pode ser deletado.',
        params: deleteBucketParamsSchema,
        response: {
          400: appErrorSchema.describe('Header x-workspace-id ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe(
            'Sem permissão ou tentativa de deletar INBOX',
          ),
          404: appErrorSchema.describe('Caixa não encontrado'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => deleteBucketController(request, reply, fastify),
  );
}

import { appErrorSchema } from '@errors/app-error-schemas';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { confirmImportController } from './controllers/confirm-import.controller';
import { createDistributionController } from './controllers/create-distribution.controller';
import { createTransactionController } from './controllers/create-transaction.controller';
import { deleteDistributionController } from './controllers/delete-distribution.controller';
import { deleteTransactionController } from './controllers/delete-transaction.controller';
import { getTransactionDistributionsController } from './controllers/get-transaction-distributions.controller';
import { listInternalTransactionsController } from './controllers/list-internal-transactions.controller';
import { listTransactionsController } from './controllers/list-transactions.controller';
import { previewImportController } from './controllers/preview-import.controller';
import { updateTransactionController } from './controllers/update-transaction.controller';
import {
  createDistributionBodySchema,
  createDistributionResponseSchema,
  createTransactionBodySchema,
  createTransactionResponseSchema,
  deleteDistributionParamsSchema,
  deleteTransactionParamsSchema,
  distributionParamsSchema,
  getDistributionsResponseSchema,
  importConfirmBodySchema,
  importConfirmResponseSchema,
  importPreviewResponseSchema,
  listInternalTransactionsQuerySchema,
  listInternalTransactionsResponseSchema,
  listTransactionsQuerySchema,
  listTransactionsResponseSchema,
  updateTransactionBodySchema,
  updateTransactionParamsSchema,
  updateTransactionResponseSchema,
} from './schemas';

export async function transactionsRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/transactions',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Criar transação',
        description:
          'Cria uma nova transação no workspace. Se bucket_id não for informado, a transação é automaticamente atribuída ao Caixa de Entrada (INBOX).',
        body: createTransactionBodySchema,
        response: {
          201: createTransactionResponseSchema,
          400: appErrorSchema.describe('Erro de validação ou header ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe(
            'Caixa, conta bancária, cartão ou categoria não encontrados',
          ),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => createTransactionController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/transactions',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Listar transações',
        description:
          'Retorna a lista paginada de transações do workspace. Suporta filtros por período, caixa, status de pagamento e tipo.',
        querystring: listTransactionsQuerySchema,
        response: {
          200: listTransactionsResponseSchema,
          400: appErrorSchema.describe('Header x-workspace-id ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => listTransactionsController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/transactions/internal',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Listar transferências internas',
        description:
          'Retorna a lista paginada de pares de transferências internas (Cascata) do workspace. Cada par representa uma movimentação automática entre caixas de propósito.',
        querystring: listInternalTransactionsQuerySchema,
        response: {
          200: listInternalTransactionsResponseSchema,
          400: appErrorSchema.describe('Header x-workspace-id ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) =>
      listInternalTransactionsController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().delete(
    '/transactions/:transactionId',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Deletar transação',
        description:
          'Remove uma transação do workspace. As alocações (allocations) associadas são deletadas automaticamente em cascata. O saldo dos caixas é recalculado dinamicamente.',
        params: deleteTransactionParamsSchema,
        response: {
          204: z.null().describe('Transação deletada com sucesso'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe('Transação não encontrada'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => deleteTransactionController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().patch(
    '/transactions/:transactionId',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Atualizar transação',
        description:
          'Atualiza uma transação existente no workspace. Pelo menos um campo deve ser fornecido. O saldo dos caixas é recalculado dinamicamente.',
        params: updateTransactionParamsSchema,
        body: updateTransactionBodySchema,
        response: {
          200: updateTransactionResponseSchema,
          400: appErrorSchema.describe(
            'Erro de validação ou nenhum campo fornecido',
          ),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe('Transação ou caixa não encontrados'),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => updateTransactionController(request, reply, fastify),
  );

  // --- Import ---

  // --- Distribution ---

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/transactions/:transactionId/distributions',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Listar distribuições de uma transação',
        description:
          'Retorna o total, valor já distribuído, saldo disponível e lista de alocações de uma transação INCOME.',
        params: distributionParamsSchema,
        response: {
          200: getDistributionsResponseSchema,
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe('Transação não encontrada'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) =>
      getTransactionDistributionsController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/transactions/:transactionId/distribute',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Distribuir transação para caixas',
        description:
          'Distribui uma transação INCOME do Caixa de Entrada (INBOX) para caixas de propósito. Cria alocações e pares de transações internas.',
        params: distributionParamsSchema,
        body: createDistributionBodySchema,
        response: {
          201: createDistributionResponseSchema,
          400: appErrorSchema.describe(
            'Transação não é INCOME, não está no INBOX ou saldo insuficiente',
          ),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe(
            'Transação ou caixa de propósito não encontrado',
          ),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => createDistributionController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().delete(
    '/transactions/:transactionId/distributions/:allocationId',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Deletar distribuição',
        description:
          'Remove uma alocação e suas transações internas vinculadas. O saldo do caixa é recalculado dinamicamente.',
        params: deleteDistributionParamsSchema,
        response: {
          204: z.null().describe('Distribuição deletada com sucesso'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe('Alocação não encontrada'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => deleteDistributionController(request, reply, fastify),
  );

  // --- Import ---

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/transactions/import/preview',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Preview de importação de extrato',
        description:
          'Recebe um arquivo bancário (OFX, CSV Nubank ou CSV Inter) e retorna as transações parseadas para revisão. Não salva nada no banco.',
        consumes: ['multipart/form-data'],
        response: {
          200: importPreviewResponseSchema,
          400: appErrorSchema.describe(
            'Formato não reconhecido, arquivo vazio ou erro de parsing',
          ),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
        },
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => previewImportController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/transactions/import/confirm',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['transactions'],
        summary: 'Confirmar importação de transações',
        description:
          'Recebe as transações aprovadas pelo usuário e as salva no Caixa de Entrada (INBOX) do workspace. Transações duplicadas (mesma data, valor e descrição) são automaticamente ignoradas.',
        body: importConfirmBodySchema,
        response: {
          200: importConfirmResponseSchema,
          400: appErrorSchema.describe('Erro de validação'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe(
            'Caixa de Entrada (INBOX) não encontrado no workspace',
          ),
        },
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => confirmImportController(request, reply, fastify),
  );
}

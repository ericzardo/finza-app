import { appErrorSchema } from '@errors/app-error-schemas';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createWorkspaceController } from './controllers/create-workspace.controller';
import { getWorkspaceSummaryController } from './controllers/get-workspace-summary.controller';
import { getWorkspaceController } from './controllers/get-workspace.controller';
import { listWorkspacesController } from './controllers/list-workspaces.controller';
import {
  createWorkspaceBodySchema,
  createWorkspaceResponseSchema,
  getWorkspaceParamsSchema,
  getWorkspaceResponseSchema,
  getWorkspaceSummaryParamsSchema,
  getWorkspaceSummaryQuerySchema,
  getWorkspaceSummaryResponseSchema,
  listWorkspacesResponseSchema,
} from './schemas';

export async function workspacesRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/workspaces',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['workspaces'],
        description: 'Lista todos os workspaces do usuário autenticado.',
        response: {
          200: listWorkspacesResponseSchema,
          401: appErrorSchema.describe('Token inválido ou ausente'),
        },
        summary: 'Listar workspaces do usuário',
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => listWorkspacesController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/workspaces',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['workspaces'],
        description:
          'Cria um novo workspace e adiciona o usuário autenticado como OWNER. Também cria 7 categorias padrão.',
        body: createWorkspaceBodySchema,
        response: {
          201: createWorkspaceResponseSchema,
          400: appErrorSchema.describe('Erro de validação'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
        },
        summary: 'Criar workspace',
        consumes: ['application/json'],
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => createWorkspaceController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/workspaces/:workspaceId',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['workspaces'],
        description: 'Retorna os metadados do workspace.',
        params: getWorkspaceParamsSchema,
        response: {
          200: getWorkspaceResponseSchema,
          400: appErrorSchema.describe('Header x-workspace-id ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
          404: appErrorSchema.describe('Workspace não encontrado'),
        },
        summary: 'Obter workspace',
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => getWorkspaceController(request, reply, fastify),
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/workspaces/:workspaceId/summary',
    {
      preHandler: [fastify.authenticate, fastify.validateWorkspace],
      schema: {
        tags: ['workspaces'],
        description:
          'Retorna o consolidado financeiro do workspace. Todos os dados são filtráveis por startDate e endDate opcionais.',
        params: getWorkspaceSummaryParamsSchema,
        querystring: getWorkspaceSummaryQuerySchema,
        response: {
          200: getWorkspaceSummaryResponseSchema,
          400: appErrorSchema.describe('Header x-workspace-id ausente'),
          401: appErrorSchema.describe('Token inválido ou ausente'),
          403: appErrorSchema.describe('Sem permissão no workspace'),
        },
        summary: 'Resumo financeiro do workspace',
        produces: ['application/json'],
        security: [{ cookieAuth: [] }],
      },
    },
    (request, reply) => getWorkspaceSummaryController(request, reply, fastify),
  );
}

import { describe, expect, test, setDefaultTimeout } from 'bun:test';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';
import env from '@env';
import { ErrorCode } from '@errors/app-error';
import { setupTestServer } from '@utils/test-setup';
import { TransactionType } from '@prisma/client';
import {
  createWorkspaceResponseSchema,
  getWorkspaceResponseSchema,
  getWorkspaceSummaryResponseSchema,
  listWorkspacesResponseSchema,
} from './schemas';

const COOKIE_NAME = 'finza_token';

setDefaultTimeout(15000);

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.com`;
}

function buildAuthCookie(user: { id: string; email: string }) {
  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return { [COOKIE_NAME]: token };
}

async function ensureBetaPlan(server: FastifyInstance) {
  return server.prisma.plan.upsert({
    where: { slug: 'beta' },
    update: {},
    create: {
      slug: 'beta',
      name: 'Versao BETA',
      price: 0,
      features: { max_workspaces: 3 },
    },
  });
}

async function createTestUser(server: FastifyInstance) {
  const plan = await ensureBetaPlan(server);
  return server.prisma.user.create({
    data: {
      name: 'Test User',
      email: uniqueEmail('ws-test'),
      password: 'hashed-password',
      plan_id: plan.id,
    },
  });
}

async function createTestWorkspace(
  server: FastifyInstance,
  userId: string,
  name = 'Test Workspace',
) {
  const workspace = await server.prisma.workspace.create({
    data: { name, currency: 'BRL' },
  });

  await server.prisma.workspaceMember.create({
    data: {
      workspace_id: workspace.id,
      user_id: userId,
      role: 'OWNER',
      accepted_at: new Date(),
    },
  });

  return workspace;
}

describe('GET /workspaces', () => {
  test('retorna lista de workspaces do usuário', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);

      const workspace = await server.prisma.workspace.create({
        data: { name: 'Test Workspace', currency: 'BRL' },
      });

      await server.prisma.workspaceMember.create({
        data: {
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'OWNER',
          accepted_at: new Date(),
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/workspaces',
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      const parsed = listWorkspacesResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error(
          'Resposta não corresponde ao schema: ' + JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data).toHaveLength(1);
      expect(parsed.data[0].name).toBe('Test Workspace');
      expect(parsed.data[0].role).toBe('OWNER');
      expect(parsed.data[0].currency).toBe('BRL');
    } finally {
      await server.close();
    }
  });

  test('retorna lista vazia quando usuário não tem workspaces', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);

      const response = await server.inject({
        method: 'GET',
        url: '/workspaces',
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body).toEqual([]);
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie não for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/workspaces',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });
});

describe('POST /workspaces', () => {
  test('cria workspace com member OWNER e 7 categorias', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);

      const response = await server.inject({
        method: 'POST',
        url: '/workspaces',
        cookies: buildAuthCookie(user),
        payload: { name: 'Novo Workspace' },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();
      const parsed = createWorkspaceResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error(
          'Resposta não corresponde ao schema: ' + JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.name).toBe('Novo Workspace');
      expect(parsed.data.currency).toBe('BRL');
      expect(parsed.data.role).toBe('OWNER');

      const member = await server.prisma.workspaceMember.findFirst({
        where: { workspace_id: parsed.data.id, user_id: user.id },
      });
      expect(member).not.toBeNull();
      expect(member!.role).toBe('OWNER');

      const categories = await server.prisma.category.findMany({
        where: { workspace_id: parsed.data.id },
      });
      expect(categories).toHaveLength(7);
    } finally {
      await server.close();
    }
  });

  test('cria workspace com moeda customizada', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);

      const response = await server.inject({
        method: 'POST',
        url: '/workspaces',
        cookies: buildAuthCookie(user),
        payload: { name: 'USD Workspace', currency: 'USD' },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();
      expect(body.currency).toBe('USD');
    } finally {
      await server.close();
    }
  });

  test('retorna 400 com body inválido', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);

      const response = await server.inject({
        method: 'POST',
        url: '/workspaces',
        cookies: buildAuthCookie(user),
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie não for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'POST',
        url: '/workspaces',
        payload: { name: 'Workspace' },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });
});

describe('GET /workspaces/:workspaceId', () => {
  test('retorna dados do workspace para membro autenticado', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}`,
        cookies: buildAuthCookie(user),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      const parsed = getWorkspaceResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error(
          'Resposta não corresponde ao schema: ' + JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.id).toBe(workspace.id);
      expect(parsed.data.name).toBe('Test Workspace');
      expect(parsed.data.currency).toBe('BRL');
      expect(parsed.data.role).toBe('OWNER');
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie não for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/workspaces/some-id',
        headers: { 'x-workspace-id': 'some-id' },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });

  test('retorna 400 quando header x-workspace-id estiver ausente', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}`,
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe(ErrorCode.BAD_REQUEST);
    } finally {
      await server.close();
    }
  });

  test('retorna 403 quando usuário não é membro do workspace', async () => {
    const server = await setupTestServer();

    try {
      const owner = await createTestUser(server);
      const stranger = await createTestUser(server);
      const workspace = await createTestWorkspace(server, owner.id);

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}`,
        cookies: buildAuthCookie(stranger),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
    } finally {
      await server.close();
    }
  });

  test('retorna 404 quando workspaceId da URL não existe no banco', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      const nonExistentId = 'nonexistent-workspace-id';

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${nonExistentId}`,
        cookies: buildAuthCookie(user),
        // x-workspace-id aponta para um workspace válido do usuário (passa o guard)
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe(ErrorCode.NOT_FOUND);
    } finally {
      await server.close();
    }
  });
});

describe('GET /workspaces/:workspaceId/summary', () => {
  test('retorna summary zerado quando não há transações', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary`,
        cookies: buildAuthCookie(user),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      const parsed = getWorkspaceSummaryResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error(
          'Resposta não corresponde ao schema: ' + JSON.stringify(parsed.error),
        );
      }

      expect(parsed.data.currentBalance).toBe(0);
      expect(parsed.data.maxBalance).toBe(0);
      expect(parsed.data.totalInvested).toBe(0);
      expect(parsed.data.distribution).toEqual([]);
    } finally {
      await server.close();
    }
  });

  test('retorna currentBalance e totalInvested corretos', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      await server.prisma.transaction.createMany({
        data: [
          {
            workspace_id: workspace.id,
            type: TransactionType.INCOME,
            amount: 2000,
            description: 'Salário',
            date: new Date('2024-01-10'),
            is_paid: true,
          },
          {
            workspace_id: workspace.id,
            type: TransactionType.EXPENSE,
            amount: 500,
            description: 'Aluguel',
            date: new Date('2024-01-15'),
            is_paid: true,
          },
          {
            workspace_id: workspace.id,
            type: TransactionType.INCOME,
            amount: 999,
            description: 'Bônus não pago',
            date: new Date('2024-01-20'),
            is_paid: false,
          },
        ],
      });

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary`,
        cookies: buildAuthCookie(user),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.currentBalance).toBe(1500); // 2000 - 500
      expect(body.totalInvested).toBe(2000);
    } finally {
      await server.close();
    }
  });

  test('retorna maxBalance como pico histórico do saldo', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      await server.prisma.transaction.createMany({
        data: [
          {
            workspace_id: workspace.id,
            type: TransactionType.INCOME,
            amount: 3000,
            description: 'Aporte inicial',
            date: new Date('2024-01-01'),
            is_paid: true,
          },
          {
            workspace_id: workspace.id,
            type: TransactionType.EXPENSE,
            amount: 2500,
            description: 'Gasto grande',
            date: new Date('2024-01-05'),
            is_paid: true,
          },
          {
            workspace_id: workspace.id,
            type: TransactionType.INCOME,
            amount: 500,
            description: 'Entrada pequena',
            date: new Date('2024-01-10'),
            is_paid: true,
          },
        ],
      });

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary`,
        cookies: buildAuthCookie(user),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.maxBalance).toBe(3000); // pico após o primeiro INCOME
      expect(body.currentBalance).toBe(1000); // 3000 - 2500 + 500
    } finally {
      await server.close();
    }
  });

  test('retorna distribution correta por buckets', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      const bucket = await server.prisma.bucket.create({
        data: {
          workspace_id: workspace.id,
          name: 'Lazer',
          type: 'SPENDING',
          allocation_percentage: 20,
        },
      });

      await server.prisma.transaction.create({
        data: {
          workspace_id: workspace.id,
          type: TransactionType.EXPENSE,
          amount: 500,
          description: 'Show',
          date: new Date('2024-01-10'),
          is_paid: true,
          bucket_id: bucket.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary`,
        cookies: buildAuthCookie(user),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();

      expect(body.distribution).toHaveLength(1);
      expect(body.distribution[0].bucketId).toBe(bucket.id);
      expect(body.distribution[0].bucketName).toBe('Lazer');
      expect(body.distribution[0].amount).toBe(500);
      expect(body.distribution[0].percentage).toBe(100);
    } finally {
      await server.close();
    }
  });

  test('filtra transações por startDate e endDate', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      await server.prisma.transaction.createMany({
        data: [
          {
            workspace_id: workspace.id,
            type: TransactionType.INCOME,
            amount: 1000,
            description: 'Dentro do período',
            date: new Date('2024-03-15'),
            is_paid: true,
          },
          {
            workspace_id: workspace.id,
            type: TransactionType.INCOME,
            amount: 9999,
            description: 'Fora do período',
            date: new Date('2024-06-01'),
            is_paid: true,
          },
        ],
      });

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary?startDate=2024-03-01T00:00:00.000Z&endDate=2024-03-31T23:59:59.999Z`,
        cookies: buildAuthCookie(user),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.currentBalance).toBe(1000); // apenas a transação dentro do período
      expect(body.totalInvested).toBe(1000);
    } finally {
      await server.close();
    }
  });

  test('retorna 401 quando cookie não for enviado', async () => {
    const server = await setupTestServer();

    try {
      const response = await server.inject({
        method: 'GET',
        url: '/workspaces/some-id/summary',
        headers: { 'x-workspace-id': 'some-id' },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe(ErrorCode.UNAUTHORIZED);
    } finally {
      await server.close();
    }
  });

  test('retorna 400 quando header x-workspace-id estiver ausente', async () => {
    const server = await setupTestServer();

    try {
      const user = await createTestUser(server);
      const workspace = await createTestWorkspace(server, user.id);

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary`,
        cookies: buildAuthCookie(user),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe(ErrorCode.BAD_REQUEST);
    } finally {
      await server.close();
    }
  });

  test('retorna 403 quando usuário não é membro do workspace', async () => {
    const server = await setupTestServer();

    try {
      const owner = await createTestUser(server);
      const stranger = await createTestUser(server);
      const workspace = await createTestWorkspace(server, owner.id);

      const response = await server.inject({
        method: 'GET',
        url: `/workspaces/${workspace.id}/summary`,
        cookies: buildAuthCookie(stranger),
        headers: { 'x-workspace-id': workspace.id },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
    } finally {
      await server.close();
    }
  });
});

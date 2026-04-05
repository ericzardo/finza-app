import { describe, expect, test } from 'bun:test';
import bcrypt from 'bcrypt';
import { AppError, ErrorCode } from '@errors/app-error';
import { createUser } from './create-user';
import { PrismaClient } from '@prisma/client';

type FindUserArgs = { where: { email: string } };
type FindPlanArgs = { where: { slug: string } };
type CreateUserArgs = {
  data: { name: string; email: string; password: string; plan_id: string };
};

type BuildDbOptions = {
  existingUser?: boolean;
  planExists?: boolean;
};

function buildDb(options: BuildDbOptions = {}) {
  const findUserCalls: FindUserArgs[] = [];
  const findPlanCalls: FindPlanArgs[] = [];
  const createCalls: CreateUserArgs[] = [];
  const workspaceCreateCalls: unknown[] = [];
  const memberCreateCalls: unknown[] = [];
  const categoryCreateManyCalls: unknown[] = [];

  const now = new Date();

  const txMock = {
    workspace: {
      create: async (args: unknown) => {
        workspaceCreateCalls.push(args);
        return {
          id: 'ws-id',
          name: 'Meu Workspace',
          currency: 'BRL',
          created_at: now,
          updated_at: now,
        };
      },
    },
    workspaceMember: {
      create: async (args: unknown) => {
        memberCreateCalls.push(args);
        return { id: 'member-id' };
      },
    },
    category: {
      createMany: async (args: unknown) => {
        categoryCreateManyCalls.push(args);
        return { count: 7 };
      },
    },
    bucket: {
      create: async (_args: unknown) => ({
        id: 'bucket-id',
        name: 'Caixa de Entrada',
        type: 'INBOX',
      }),
    },
  };

  const db = {
    user: {
      findUnique: async (args: FindUserArgs) => {
        findUserCalls.push(args);
        return options.existingUser ? { id: 'existing-user' } : null;
      },
      create: async (args: CreateUserArgs) => {
        createCalls.push(args);
        return {
          id: 'user-id',
          avatar_url: '/avatars/1.webp',
          ...args.data,
        };
      },
    },
    plan: {
      findUnique: async (args: FindPlanArgs) => {
        findPlanCalls.push(args);
        return options.planExists === false
          ? null
          : { id: 'plan-id', slug: 'beta' };
      },
    },
    $transaction: async (fn: (tx: typeof txMock) => Promise<unknown>) => {
      return fn(txMock);
    },
  } as unknown as PrismaClient;

  return {
    db,
    findUserCalls,
    findPlanCalls,
    createCalls,
    workspaceCreateCalls,
    memberCreateCalls,
    categoryCreateManyCalls,
  };
}

describe('createUser', () => {
  test('cria usuario com sucesso e workspace padrão', async () => {
    const {
      db,
      findUserCalls,
      findPlanCalls,
      createCalls,
      workspaceCreateCalls,
      memberCreateCalls,
      categoryCreateManyCalls,
    } = buildDb();

    const result = await createUser(db, {
      name: 'Ana',
      email: 'ana@email.com',
      password: 'senha123',
    });

    expect(findUserCalls).toEqual([{ where: { email: 'ana@email.com' } }]);
    expect(findPlanCalls).toEqual([{ where: { slug: 'beta' } }]);
    expect(createCalls).toHaveLength(1);

    const [createCall] = createCalls;
    expect(createCall.data.name).toBe('Ana');
    expect(createCall.data.email).toBe('ana@email.com');
    expect(createCall.data.plan_id).toBe('plan-id');

    const passwordMatches = await bcrypt.compare(
      'senha123',
      createCall.data.password,
    );
    expect(passwordMatches).toBe(true);

    expect(result).toMatchObject({
      id: 'user-id',
      name: createCall.data.name,
      email: createCall.data.email,
      plan_id: 'plan-id',
    });

    // Verifica que workspace padrão foi criado
    expect(workspaceCreateCalls).toHaveLength(1);
    expect(memberCreateCalls).toHaveLength(1);
    expect(categoryCreateManyCalls).toHaveLength(1);
  });

  test('lanca erro se email ja existe', async () => {
    const { db } = buildDb({ existingUser: true });

    try {
      await createUser(db, {
        name: 'Ana',
        email: 'ana@email.com',
        password: 'senha123',
      });
      expect(true).toBe(false);
    } catch (error) {
      if (!(error instanceof AppError)) {
        throw error;
      }
      expect(error.code).toBe(ErrorCode.CONFLICT);
      expect(error.statusCode).toBe(409);
    }
  });

  test('lanca erro se plano inicial nao for encontrado', async () => {
    const { db } = buildDb({ planExists: false });

    try {
      await createUser(db, {
        name: 'Ana',
        email: 'ana@email.com',
        password: 'senha123',
      });
      expect(true).toBe(false);
    } catch (error) {
      if (!(error instanceof AppError)) {
        throw error;
      }
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    }
  });
});

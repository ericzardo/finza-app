import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { createWorkspace } from './create-workspace';
import { DEFAULT_CATEGORIES } from '@features/workspaces/domain/workspace.types';

type CreateWorkspaceArgs = { data: { name: string; currency: string } };
type CreateMemberArgs = {
  data: {
    workspace_id: string;
    user_id: string;
    role: string;
    accepted_at: Date;
  };
};
type CreateManyCategoryArgs = {
  data: Array<{
    workspace_id: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>;
};

function buildDb() {
  const workspaceCreateCalls: CreateWorkspaceArgs[] = [];
  const memberCreateCalls: CreateMemberArgs[] = [];
  const categoryCreateManyCalls: CreateManyCategoryArgs[] = [];

  const now = new Date();

  const txMock = {
    workspace: {
      create: async (args: CreateWorkspaceArgs) => {
        workspaceCreateCalls.push(args);
        return {
          id: 'ws-id',
          name: args.data.name,
          currency: args.data.currency,
          created_at: now,
          updated_at: now,
        };
      },
    },
    workspaceMember: {
      create: async (args: CreateMemberArgs) => {
        memberCreateCalls.push(args);
        return {
          id: 'member-id',
          ...args.data,
        };
      },
    },
    category: {
      createMany: async (args: CreateManyCategoryArgs) => {
        categoryCreateManyCalls.push(args);
        return { count: args.data.length };
      },
    },
  };

  const db = {
    $transaction: async (fn: (tx: typeof txMock) => Promise<unknown>) => {
      return fn(txMock);
    },
  } as unknown as PrismaClient;

  return {
    db,
    workspaceCreateCalls,
    memberCreateCalls,
    categoryCreateManyCalls,
    now,
  };
}

describe('createWorkspace', () => {
  test('cria workspace com member OWNER e 7 categorias padrão', async () => {
    const {
      db,
      workspaceCreateCalls,
      memberCreateCalls,
      categoryCreateManyCalls,
      now,
    } = buildDb();

    const result = await createWorkspace(db, {
      name: 'Meu Workspace',
      currency: 'BRL',
      userId: 'user-id',
    });

    expect(workspaceCreateCalls).toEqual([
      { data: { name: 'Meu Workspace', currency: 'BRL' } },
    ]);

    expect(memberCreateCalls).toEqual([
      {
        data: {
          workspace_id: 'ws-id',
          user_id: 'user-id',
          role: 'OWNER',
          accepted_at: expect.any(Date),
        },
      },
    ]);

    expect(categoryCreateManyCalls).toHaveLength(1);
    const [categoryCall] = categoryCreateManyCalls;
    expect(categoryCall.data).toHaveLength(7);

    for (const defaultCat of DEFAULT_CATEGORIES) {
      expect(categoryCall.data).toContainEqual({
        workspace_id: 'ws-id',
        name: defaultCat.name,
        icon: defaultCat.icon,
        color: defaultCat.color,
      });
    }

    expect(result).toEqual({
      id: 'ws-id',
      name: 'Meu Workspace',
      currency: 'BRL',
      role: 'OWNER',
      totalBalance: 0,
      created_at: now.toISOString(),
    });
  });

  test('cria workspace com moeda customizada', async () => {
    const { db, workspaceCreateCalls } = buildDb();

    const result = await createWorkspace(db, {
      name: 'USD Workspace',
      currency: 'USD',
      userId: 'user-id',
    });

    expect(workspaceCreateCalls).toEqual([
      { data: { name: 'USD Workspace', currency: 'USD' } },
    ]);

    expect(result.currency).toBe('USD');
    expect(result.role).toBe('OWNER');
  });
});

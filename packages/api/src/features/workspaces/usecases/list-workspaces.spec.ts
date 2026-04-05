import { describe, expect, test } from 'bun:test';
import { type PrismaClient } from '@prisma/client';
import { listWorkspaces } from './list-workspaces';

type FindManyArgs = {
  where: { user_id: string };
  include: { workspace: boolean };
};

type GroupByArgs = {
  by: string[];
  where: {
    workspace_id: { in: string[] };
    is_paid: boolean;
  };
  _sum: { amount: boolean };
};

type BuildDbOptions = {
  members?: Array<{
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    workspace: {
      id: string;
      name: string;
      currency: string;
      created_at: string; // Changed to string to match usage
    };
  }>;
  transactions?: Array<{
    workspace_id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    is_paid: boolean;
  }>;
};

function buildDb(options: BuildDbOptions = {}) {
  const findManyCalls: FindManyArgs[] = [];
  const groupByCalls: GroupByArgs[] = [];

  const db = {
    workspaceMember: {
      findMany: async (args: FindManyArgs) => {
        findManyCalls.push(args);
        return (options.members ?? []).map((m) => ({
          workspace_id: m.workspace.id,
          user_id: 'user-id',
          role: m.role,
          workspace: {
            ...m.workspace,
            created_at: new Date(m.workspace.created_at),
          },
        }));
      },
    },
    transaction: {
      groupBy: async (args: GroupByArgs) => {
        groupByCalls.push(args);
        const { where } = args;
        const transactions = options.transactions ?? [];

        // Filter
        const filtered = transactions.filter(
          (t) =>
            where.workspace_id.in.includes(t.workspace_id) &&
            t.is_paid === where.is_paid,
        );

        // Group and sum
        const groups: Record<string, any> = {};
        for (const t of filtered) {
          const key = `${t.workspace_id}-${t.type}`;
          if (!groups[key]) {
            groups[key] = {
              workspace_id: t.workspace_id,
              type: t.type,
              _sum: { amount: 0 },
            };
          }
          groups[key]._sum.amount += t.amount;
        }

        return Object.values(groups);
      },
    },
  } as unknown as PrismaClient;

  return { db, findManyCalls, groupByCalls };
}

describe('listWorkspaces', () => {
  test('retorna workspaces do usuário com roles e saldos', async () => {
    const now = new Date();
    const { db, findManyCalls } = buildDb({
      members: [
        {
          role: 'OWNER',
          workspace: {
            id: 'ws-1',
            name: 'Workspace 1',
            currency: 'BRL',
            created_at: now.toISOString(),
          },
        },
        {
          role: 'EDITOR',
          workspace: {
            id: 'ws-2',
            name: 'Workspace 2',
            currency: 'USD',
            created_at: now.toISOString(),
          },
        },
      ],
      transactions: [
        {
          workspace_id: 'ws-1',
          type: 'INCOME',
          amount: 1000,
          is_paid: true,
        },
        {
          workspace_id: 'ws-1',
          type: 'EXPENSE',
          amount: 200,
          is_paid: true,
        },
        {
          workspace_id: 'ws-1',
          type: 'INCOME',
          amount: 500,
          is_paid: false, // Should be ignored
        },
        {
          workspace_id: 'ws-2',
          type: 'EXPENSE',
          amount: 50,
          is_paid: true,
        },
      ],
    });

    const result = await listWorkspaces(db, 'user-id');

    expect(findManyCalls).toEqual([
      { where: { user_id: 'user-id' }, include: { workspace: true } },
    ]);

    expect(result).toEqual([
      {
        id: 'ws-1',
        name: 'Workspace 1',
        currency: 'BRL',
        role: 'OWNER',
        created_at: now.toISOString(),
        totalBalance: 800, // 1000 - 200
      },
      {
        id: 'ws-2',
        name: 'Workspace 2',
        currency: 'USD',
        role: 'EDITOR',
        created_at: now.toISOString(),
        totalBalance: -50, // 0 - 50
      },
    ]);
  });

  test('retorna lista vazia quando usuário não tem workspaces', async () => {
    const { db } = buildDb({ members: [] });

    const result = await listWorkspaces(db, 'user-id');

    expect(result).toEqual([]);
  });
});

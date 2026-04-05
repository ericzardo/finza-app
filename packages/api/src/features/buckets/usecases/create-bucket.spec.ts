import { describe, expect, test } from 'bun:test';
import type { BucketType, PrismaClient } from '@prisma/client';
import { createBucket } from './create-bucket';

type CreateBucketArgs = {
  data: {
    workspace_id: string;
    name: string;
    type: BucketType;
    allocation_percentage: number;
  };
};

function buildDb() {
  const createCalls: CreateBucketArgs[] = [];
  const now = new Date();

  const db = {
    bucket: {
      create: async (args: CreateBucketArgs) => {
        createCalls.push(args);
        return {
          id: 'bucket-id',
          workspace_id: args.data.workspace_id,
          name: args.data.name,
          type: args.data.type,
          allocation_percentage: args.data.allocation_percentage,
          is_default: false,
          created_at: now,
          updated_at: now,
        };
      },
    },
  } as unknown as PrismaClient;

  return { db, createCalls, now };
}

describe('createBucket', () => {
  test('cria bucket com sucesso', async () => {
    const { db, createCalls } = buildDb();

    const result = await createBucket(db, {
      workspaceId: 'ws-id',
      name: 'Lazer',
      type: 'SPENDING',
      allocation_percentage: 20,
    });

    expect(createCalls).toHaveLength(1);
    expect(createCalls[0].data).toEqual({
      workspace_id: 'ws-id',
      name: 'Lazer',
      type: 'SPENDING',
      allocation_percentage: 20,
    });

    expect(result.id).toBe('bucket-id');
    expect(result.workspace_id).toBe('ws-id');
    expect(result.name).toBe('Lazer');
    expect(result.type).toBe('SPENDING');
    expect(result.allocation_percentage).toBe(20);
    expect(result.is_default).toBe(false);
  });

  test('persiste todos os campos corretamente', async () => {
    const { db, now } = buildDb();

    const result = await createBucket(db, {
      workspaceId: 'ws-id',
      name: 'Investimentos',
      type: 'INVESTMENT',
      allocation_percentage: 50,
    });

    expect(result.type).toBe('INVESTMENT');
    expect(result.allocation_percentage).toBe(50);
    expect(result.created_at).toBe(now.toISOString());
  });
});

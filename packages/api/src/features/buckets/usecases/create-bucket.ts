import type { BucketType, PrismaClient } from '@prisma/client';

interface CreateBucketInput {
  workspaceId: string;
  name: string;
  type: 'SPENDING' | 'INVESTMENT';
  allocation_percentage: number;
}

export interface BucketItem {
  id: string;
  workspace_id: string;
  name: string;
  type: BucketType;
  allocation_percentage: number;
  is_default: boolean;
  created_at: string;
}

export interface InboxBucketItem extends BucketItem {
  type: 'INBOX';
  current_amount: number;
  period_income: number;
  period_spent: number;
}

export interface SpendingBucketItem extends BucketItem {
  type: 'SPENDING';
  current_amount: number;
  period_allocated: number;
  period_spent: number;
}

export interface InvestmentBucketItem extends BucketItem {
  type: 'INVESTMENT';
  current_invested: number;
  period_target: number;
  period_invested: number;
}

export type BucketWithAggregates =
  | InboxBucketItem
  | SpendingBucketItem
  | InvestmentBucketItem;

export function serializeBucket(bucket: {
  id: string;
  workspace_id: string;
  name: string;
  type: BucketType;
  allocation_percentage: { toNumber(): number } | number;
  is_default: boolean;
  created_at: Date;
}): BucketItem {
  return {
    id: bucket.id,
    workspace_id: bucket.workspace_id,
    name: bucket.name,
    type: bucket.type,
    allocation_percentage:
      typeof bucket.allocation_percentage === 'number'
        ? bucket.allocation_percentage
        : bucket.allocation_percentage.toNumber(),
    is_default: bucket.is_default,
    created_at: bucket.created_at.toISOString(),
  };
}

export async function createBucket(
  db: PrismaClient,
  { workspaceId, name, type, allocation_percentage }: CreateBucketInput,
): Promise<BucketItem> {
  const bucket = await db.bucket.create({
    data: {
      workspace_id: workspaceId,
      name,
      type,
      allocation_percentage,
    },
  });

  return serializeBucket(bucket);
}

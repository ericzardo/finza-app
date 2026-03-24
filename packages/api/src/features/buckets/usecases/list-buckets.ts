import type { PrismaClient } from '@prisma/client';
import { type BucketItem, serializeBucket } from './create-bucket';

export async function listBuckets(
  db: PrismaClient,
  { workspaceId }: { workspaceId: string },
): Promise<BucketItem[]> {
  const buckets = await db.bucket.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { created_at: 'asc' },
  });

  return buckets.map(serializeBucket);
}

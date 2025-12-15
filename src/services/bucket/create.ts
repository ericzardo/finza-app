import { prisma } from "@/lib/prisma";
import { CreateBucketData } from "@/schemas/bucket";

export async function createBucket(data: CreateBucketData) {
  return prisma.bucket.create({
    data: {
      workspace_id: data.workspaceId,
      name: data.name,
      allocation_percentage: data.percentage,
      is_default: data.isDefault || false,
      current_balance: 0,
    }
  });
}
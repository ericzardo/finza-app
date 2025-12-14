import { prisma } from "@/lib/prisma";

interface CreateBucketDTO {
  workspaceId: string;
  name: string;
  percentage: number;
  isDefault?: boolean;
}

export async function createBucket(data: CreateBucketDTO) {
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
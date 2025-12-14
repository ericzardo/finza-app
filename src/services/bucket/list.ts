import { prisma } from "@/lib/prisma";

export async function listBuckets(workspaceId: string) {
  return prisma.bucket.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { allocation_percentage: 'desc' }
  });
}
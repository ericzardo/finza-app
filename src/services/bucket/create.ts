import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { CreateBucketData } from "@/schemas/bucket";

interface CreateServiceProps extends CreateBucketData {
  userId: string;
}

export async function createBucket({ workspaceId, userId, name, allocationPercentage, isDefault }: CreateServiceProps) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, user_id: userId }
  });

  if (!workspace) throw new AppError("Acesso negado ao workspace", 403);

  const bucket = await prisma.bucket.create({
    data: {
      workspace_id: workspaceId,
      name,
      allocation_percentage: allocationPercentage,
      current_balance: 0,
      is_default: isDefault || false,
    }
  });

  return {
    ...bucket,
    allocation_percentage: Number(bucket.allocation_percentage),
    current_balance: Number(bucket.current_balance),
    created_at: bucket.created_at.toISOString(),
  };
}
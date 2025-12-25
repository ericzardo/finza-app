import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UpdateBucketData } from "@/schemas/bucket";

interface UpdateServiceProps extends UpdateBucketData {
  bucketId: string;
  userId: string;
}

export async function updateBucket({ bucketId, userId, name, allocationPercentage, isDefault }: UpdateServiceProps) {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketId },
    include: { workspace: true }
  });

  if (!bucket || bucket.workspace.user_id !== userId) {
    throw new AppError("Bucket não encontrado ou não autorizado", 404);
  }

  const updated = await prisma.bucket.update({
    where: { id: bucketId },
    data: {
      name,
      allocation_percentage: allocationPercentage,
      is_default: isDefault
    }
  });

  return {
    ...updated,
    allocation_percentage: Number(updated.allocation_percentage),
    current_balance: Number(updated.current_balance),
    created_at: updated.created_at.toISOString(),
  };
}
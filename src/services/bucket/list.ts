import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function listBuckets(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, user_id: userId },
    select: { total_balance: true }
  });

  if (!workspace) throw new AppError("Workspace não encontrado", 404);

  const totalWorkspaceBalance = Number(workspace.total_balance || 0);

  const buckets = await prisma.bucket.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { created_at: 'asc' }
  });

  return buckets.map(bucket => {
    const bucketBalance = Number(bucket.current_balance);
    const allocPct = Number(bucket.allocation_percentage);

    const realPercentage = totalWorkspaceBalance > 0 
      ? (bucketBalance / totalWorkspaceBalance) * 100 
      : 0;

    return {
      ...bucket,
      allocation_percentage: allocPct,
      current_balance: bucketBalance,
      real_allocation_percentage: Number(realPercentage.toFixed(2)),
      created_at: bucket.created_at.toISOString(),
      updated_at: bucket.updated_at.toISOString(),
    };
  });
}
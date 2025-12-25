import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getWorkspaceById(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      buckets: {
        select: {
          current_balance: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new AppError("Workspace not found", 404);
  }

  if (workspace.user_id !== userId) {
    throw new AppError("Unauthorized access to this workspace", 403);
  }

  const totalBalance = workspace.buckets.reduce((acc: number, bucket) => {
    return acc + (bucket.current_balance ? Number(bucket.current_balance) : 0);
  }, 0);

  const { buckets, ...rest } = workspace;

  return {
    ...rest,
    total_balance: totalBalance,
    created_at: new Date(workspace.created_at).toISOString(), 
    updated_at: new Date(workspace.updated_at).toISOString(), 
  };
}
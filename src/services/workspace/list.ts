import { prisma } from "@/lib/prisma";
import { WorkspaceWithBuckets } from "@/types";

export async function listUserWorkspaces(userId: string) {
  const workspaces = await prisma.workspace.findMany({
    where: {
      user_id: userId,
    },
    include: {
      buckets: {
        select: {
          current_balance: true, 
        },
      },
    },
    orderBy: {
      created_at: 'asc', 
    },
  });

  return workspaces.map((ws: WorkspaceWithBuckets) => {
    
    const totalBalance = ws.buckets.reduce((acc, bucket) => {
      const balance = bucket.current_balance ? Number(bucket.current_balance) : 0;
      return acc + balance;
    }, 0);

    const { buckets, ...workspaceData } = ws;

    return {
      ...workspaceData,
      total_balance: totalBalance,
      created_at: new Date(ws.created_at).toISOString(),
      updated_at: new Date(ws.updated_at).toISOString()
    };
  });
}
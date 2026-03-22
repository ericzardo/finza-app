import { TransactionType, type PrismaClient } from '@prisma/client';
import type { WorkspaceWithRole } from '@features/workspaces/domain/workspace.types';

export async function listWorkspaces(
  db: PrismaClient,
  userId: string,
): Promise<WorkspaceWithRole[]> {
  const members = await db.workspaceMember.findMany({
    where: { user_id: userId },
    include: { workspace: true },
  });

  const workspaceIds = members.map((m) => m.workspace_id);

  const aggregations = await db.transaction.groupBy({
    by: ['workspace_id', 'type'],
    where: {
      workspace_id: { in: workspaceIds },
      is_paid: true,
    },
    _sum: {
      amount: true,
    },
  });

  const balanceMap = new Map<string, number>();

  for (const agg of aggregations) {
    const current = balanceMap.get(agg.workspace_id) || 0;
    const amount = Number(agg._sum.amount || 0);

    if (agg.type === TransactionType.INCOME) {
      balanceMap.set(agg.workspace_id, current + amount);
    } else if (agg.type === TransactionType.EXPENSE) {
      balanceMap.set(agg.workspace_id, current - amount);
    }
  }

  return members.map((member) => ({
    id: member.workspace.id,
    name: member.workspace.name,
    currency: member.workspace.currency,
    role: member.role,
    totalBalance: balanceMap.get(member.workspace.id) || 0,
    created_at: member.workspace.created_at.toISOString(),
  }));
}

import { prisma } from "@/lib/prisma";

export async function listTransactions(workspaceId: string) {
  return prisma.transaction.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { date: 'desc' },
  });
}
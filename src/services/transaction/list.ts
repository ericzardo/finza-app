import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

interface RawTransaction {
  amount: unknown;
  date: Date | string;
  created_at: Date | string;
  [key: string]: unknown;
}

export async function listTransactions(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { 
      id: workspaceId,
      user_id: userId 
    },
  });

  if (!workspace) {
    throw new AppError("Workspace não encontrado ou acesso negado", 404);
  }

  const transactions = await prisma.transaction.findMany({
    where: { 
      workspace_id: workspace.id
    },
    orderBy: { date: 'desc' },
    include: {
      bucket: { select: { name: true } }
    }
  });

  return transactions.map((t: RawTransaction) => ({
    ...t,
    amount: Number(t.amount),
    date: new Date(t.date).toISOString(),
    created_at: new Date(t.created_at).toISOString(),
  }));
}
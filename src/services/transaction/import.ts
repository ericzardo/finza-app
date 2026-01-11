import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { TransactionType } from "@/schemas/transaction";

interface ImportTransactionData {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
}

interface ImportServiceProps {
  userId: string;
  workspaceId: string;
  transactions: ImportTransactionData[];
}

export async function importTransactions({ userId, workspaceId, transactions }: ImportServiceProps) {
  // 1. Validações Iniciais
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace || workspace.user_id !== userId) {
    throw new AppError("Workspace não encontrado", 404);
  }

  if (!transactions || transactions.length === 0) {
    throw new AppError("Nenhuma transação fornecida para importação", 400);
  }

  const inboxBucket = await prisma.bucket.findFirst({
    where: {
      workspace_id: workspaceId,
      is_default: true,
    }
  });

  if (!inboxBucket) {
    throw new AppError("Caixa de Entrada não encontrada neste Workspace.", 500);
  }

  // 2. Processar em uma única transação do banco
  const result = await prisma.$transaction(async (tx) => {
    const importedTransactions = [];
    let totalImported = 0;

    for (const txData of transactions) {
      const amount = new Prisma.Decimal(Math.abs(txData.amount));

      const transaction = await tx.transaction.create({
        data: {
          workspace_id: workspaceId,
          bucket_id: inboxBucket.id,
          amount: amount,
          type: txData.type,
          description: txData.description,
          date: txData.date,
          is_allocated: false,
        }
      });

      // Lógica Blindada de Atualização
      if (txData.type === 'INCOME') {
        await tx.bucket.update({
          where: { id: inboxBucket.id },
          data: { 
            current_balance: { increment: amount }, 
            total_allocated: { increment: amount }
          }
        });

        await tx.workspace.update({
          where: { id: workspaceId },
          data: { total_balance: { increment: amount } }
        });

      } else {
        // EXPENSE
        await tx.bucket.update({
          where: { id: inboxBucket.id },
          data: { 
            current_balance: { decrement: amount },
            total_spent: { increment: amount } 
          }
        });

        await tx.workspace.update({
          where: { id: workspaceId },
          data: { total_balance: { decrement: amount } }
        });
      }

      importedTransactions.push(transaction);
      totalImported++;
    }

    return { count: totalImported, transactions: importedTransactions };
  });

  return result;
}
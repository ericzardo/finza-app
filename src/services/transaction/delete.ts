import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function deleteTransaction(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { workspace: true }
  });

  if (!transaction) throw new AppError("Transaction not found", 404);

  if (transaction.workspace.user_id !== userId) throw new AppError("Unauthorized", 403);

  const deletedTransaction = await prisma.$transaction(async (tx) => {
    const amount = Number(transaction.amount);

    if (transaction.type === 'INCOME') {
      await tx.workspace.update({
        where: { id: transaction.workspace_id },
        data: { total_balance: { decrement: amount } }
      });
    } else {
      await tx.workspace.update({
        where: { id: transaction.workspace_id },
        data: { total_balance: { increment: amount } }
      });
    }

    if (transaction.bucket_id) {
      if (transaction.type === 'INCOME') {
        await tx.bucket.update({
          where: { id: transaction.bucket_id },
          data: { current_balance: { decrement: amount } }
        });
      } else {
        await tx.bucket.update({
          where: { id: transaction.bucket_id },
          data: { current_balance: { increment: amount } }
        });
      }
    }

    return tx.transaction.delete({ where: { id: transactionId } });
  });

  return deletedTransaction;
}
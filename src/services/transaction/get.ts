import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getTransactionById(id: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { workspace: true }
  });

  if (!transaction) throw new AppError("Transaction not found", 404);

  if (transaction.workspace.user_id !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  return transaction;
}
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

interface CreateTransactionDTO {
  workspaceId: string;
  userId: string;
  bucketId?: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  date?: string;
}

export async function createTransaction(data: CreateTransactionDTO) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: data.workspaceId }
  });

  if (!workspace || workspace.user_id !== data.userId) {
    throw new AppError("Workspace not found", 404);
  }

  if (data.bucketId) {
    const bucket = await prisma.bucket.findUnique({
      where: { id: data.bucketId }
    });
    if (!bucket || bucket.workspace_id !== data.workspaceId) {
      throw new AppError("Bucket not found in this workspace", 404);
    }
  }

  return prisma.$transaction(async (tx) => {
    
    const transaction = await tx.transaction.create({
      data: {
        workspace_id: data.workspaceId,
        bucket_id: data.bucketId,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      }
    });

    const amount = new Prisma.Decimal(data.amount);

    if (data.type === 'INCOME') {
      await tx.workspace.update({
        where: { id: data.workspaceId },
        data: { total_balance: { increment: amount } }
      });
    } else {
      await tx.workspace.update({
        where: { id: data.workspaceId },
        data: { total_balance: { decrement: amount } }
      });
    }

    if (data.bucketId) {
      if (data.type === 'INCOME') {
        await tx.bucket.update({
          where: { id: data.bucketId },
          data: { current_balance: { increment: amount } }
        });
      } else {
        await tx.bucket.update({
          where: { id: data.bucketId },
          data: { current_balance: { decrement: amount } }
        });
      }
    }

    return transaction;
  });
}
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { CreateTransactionData } from "@/schemas/transactions";

interface CreateServiceProps extends CreateTransactionData {
  userId: string;
}

export async function createTransaction({ userId, ...data }: CreateServiceProps) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: data.workspaceId }
  });

  if (!workspace || workspace.user_id !== userId) {
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

    const amount = new Prisma.Decimal(data.amount);
    
    const transaction = await tx.transaction.create({
      data: {
        workspace_id: data.workspaceId,
        bucket_id: data.bucketId,
        amount,
        type: data.type,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      }
    });

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
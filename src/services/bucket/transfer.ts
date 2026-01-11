import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { TransferBucketData } from "@/schemas/bucket";

interface TransferServiceProps extends TransferBucketData {
  userId: string;
}

export async function transferBalance({
  sourceBucketId,
  destinationBucketId,
  amount,
  userId,
}: TransferServiceProps) {
  // Verificar se os buckets existem e pertencem ao usuário
  const [sourceBucket, destinationBucket] = await Promise.all([
    prisma.bucket.findUnique({
      where: { id: sourceBucketId },
      include: { workspace: true },
    }),
    prisma.bucket.findUnique({
      where: { id: destinationBucketId },
      include: { workspace: true },
    }),
  ]);

  if (!sourceBucket || sourceBucket.workspace.user_id !== userId) {
    throw new AppError("Bucket de origem não encontrado ou não autorizado", 404);
  }

  if (!destinationBucket || destinationBucket.workspace.user_id !== userId) {
    throw new AppError("Bucket de destino não encontrado ou não autorizado", 404);
  }

  // Verificar se os buckets estão no mesmo workspace
  if (sourceBucket.workspace_id !== destinationBucket.workspace_id) {
    throw new AppError("Os buckets devem estar no mesmo workspace", 400);
  }

  // Verificar se o bucket de origem tem saldo suficiente
  const sourceBalance = Number(sourceBucket.current_balance);
  if (sourceBalance < amount) {
    throw new AppError("Saldo insuficiente no bucket de origem", 400);
  }

  // Validar que não é transferência para o mesmo bucket
  if (sourceBucketId === destinationBucketId) {
    throw new AppError("Não é possível transferir para o mesmo bucket", 400);
  }

  // Realizar a transferência em uma transação
  return await prisma.$transaction(async (tx) => {
    // Atualizar bucket de origem: subtrair do saldo e decrementar total_allocated
    const updatedSource = await tx.bucket.update({
      where: { id: sourceBucketId },
      data: {
        current_balance: sourceBalance - amount,
        total_allocated: {
          decrement: amount,
        },
      },
    });

    // Atualizar bucket de destino: adicionar ao saldo e incrementar total_allocated
    const updatedDestination = await tx.bucket.update({
      where: { id: destinationBucketId },
      data: {
        current_balance: {
          increment: amount,
        },
        total_allocated: {
          increment: amount,
        },
      },
    });

    // Criar registro de transação para auditoria
    await tx.transaction.create({
      data: {
        workspace_id: sourceBucket.workspace_id,
        bucket_id: sourceBucketId,
        amount: -amount, // Negativo para saída
        type: "EXPENSE",
        description: `Transferência para ${destinationBucket.name}`,
        is_allocated: true,
      },
    });

    await tx.transaction.create({
      data: {
        workspace_id: destinationBucket.workspace_id,
        bucket_id: destinationBucketId,
        amount: amount, // Positivo para entrada
        type: "INCOME",
        description: `Transferência de ${sourceBucket.name}`,
        is_allocated: true,
      },
    });

    return {
      source: {
        ...updatedSource,
        current_balance: Number(updatedSource.current_balance),
        total_allocated: Number(updatedSource.total_allocated),
        total_spent: Number(updatedSource.total_spent),
      },
      destination: {
        ...updatedDestination,
        current_balance: Number(updatedDestination.current_balance),
        total_allocated: Number(updatedDestination.total_allocated),
        total_spent: Number(updatedDestination.total_spent),
      },
    };
  });
}

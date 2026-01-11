import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UpdateBucketData } from "@/schemas/bucket";

interface UpdateServiceProps extends UpdateBucketData {
  bucketId: string;
  userId: string;
}

export async function updateBucket({ bucketId, userId, name, allocationPercentage, isDefault, type }: UpdateServiceProps) {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketId },
    include: { workspace: true }
  });

  if (!bucket || bucket.workspace.user_id !== userId) {
    throw new AppError("Bucket não encontrado ou não autorizado", 404);
  }

  // Verificar se é o bucket Inbox do sistema (type INBOX ou is_default true)
  const isInboxBucket = bucket.type === "INBOX" || bucket.is_default === true;

  if (isInboxBucket) {
    // 1. Proibir alteração de is_default para false
    if (isDefault !== undefined && isDefault === false) {
      throw new AppError("Não é permitido remover a flag de caixa padrão do Inbox do sistema.", 400);
    }

    // 2. Proibir alteração de allocation_percentage (deve ser sempre 0)
    if (allocationPercentage !== undefined && allocationPercentage !== 0) {
      throw new AppError("O bucket Inbox deve ter alocação porcentual igual a 0.", 400);
    }

    // 3. Proibir alteração de type (não pode mudar de INBOX para outro tipo)
    if (type !== undefined && type !== "INBOX") {
      throw new AppError("Não é permitido alterar o tipo do bucket Inbox.", 400);
    }

    // Garantir que allocation_percentage seja 0
    allocationPercentage = 0;
    // Garantir que is_default seja true
    isDefault = true;
  }

  const updated = await prisma.bucket.update({
    where: { id: bucketId },
    data: {
      name,
      allocation_percentage: allocationPercentage,
      is_default: isDefault,
      type: type, 
    }
  });

  return {
    ...updated,
    allocation_percentage: Number(updated.allocation_percentage),
    current_balance: Number(updated.current_balance),
    total_allocated: Number(updated.total_allocated),
    total_spent: Number(updated.total_spent), 
    created_at: updated.created_at.toISOString(),
  };
}

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { CreateBucketData } from "@/schemas/bucket";

interface CreateServiceProps extends CreateBucketData {
  userId: string;
}

export async function createBucket({ workspaceId, userId, name, allocationPercentage, isDefault, type }: CreateServiceProps) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, user_id: userId }
  });

  if (!workspace) throw new AppError("Acesso negado ao workspace", 403);

  // Bloqueio de criação de bucket com is_default: true
  if (isDefault) {
    throw new AppError("Não é permitido criar um bucket como padrão. Apenas o Inbox do sistema pode ser padrão.", 400);
  }

  // Para buckets do tipo INBOX, forçar allocation_percentage = 0
  const finalAllocationPercentage = type === "INBOX" ? 0 : allocationPercentage;

  const bucket = await prisma.bucket.create({
    data: {
      workspace_id: workspaceId,
      name,
      allocation_percentage: finalAllocationPercentage,
      current_balance: 0,
      is_default: false, // Forçar false, nunca permitir criação de bucket default pelo usuário
      type,
    }
  });

  return {
    ...bucket,
    allocation_percentage: Number(bucket.allocation_percentage),
    current_balance: Number(bucket.current_balance),
    created_at: bucket.created_at.toISOString(),
  };
}

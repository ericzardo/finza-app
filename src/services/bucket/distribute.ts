import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { DistributeBucketData } from "@/schemas/bucket";
import { calculateDistribution, DistributionTarget } from "@/lib/distribution";

interface DistributeServiceProps extends DistributeBucketData {
  userId: string;
}

export async function distributeBalance({
  userId,
  sourceBucketId,
  workspaceId,
  amount,
  targets,
}: DistributeServiceProps) {
  // 1. Validações Iniciais
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace || workspace.user_id !== userId) {
    throw new AppError("Workspace não encontrado", 404);
  }

  const sourceBucket = await prisma.bucket.findUnique({
    where: { id: sourceBucketId },
    include: { workspace: true },
  });

  if (!sourceBucket || sourceBucket.workspace.user_id !== userId) {
    throw new AppError("Bucket de origem não encontrado ou não autorizado", 404);
  }

  if (sourceBucket.workspace_id !== workspaceId) {
    throw new AppError("Bucket não pertence a este workspace", 400);
  }

  // 2. Verificar saldo suficiente
  const sourceBalance = Number(sourceBucket.current_balance);
  // Nota: Verificamos se o bucket tem o valor que o usuário diz querer distribuir,
  // mas o débito real será apenas do que for alocado nos targets.
  if (sourceBalance < amount) {
    throw new AppError("Saldo insuficiente no bucket de origem", 400);
  }

  return await prisma.$transaction(async (tx) => {
    const totalAmount = new Prisma.Decimal(amount);
    let distributionTargets: DistributionTarget[] = [];

    // 3. Determinar alvos da distribuição
    if (!targets || targets.length === 0) {
      // MODO AUTOMÁTICO: Usa as configurações de % do banco
      const buckets = await tx.bucket.findMany({
        where: { 
          workspace_id: workspaceId,
          id: { not: sourceBucketId }, // Exclui o bucket de origem
        }
      });

      // Cria targets baseados nas porcentagens configuradas
      for (const bucket of buckets) {
        // Pula o Inbox na distribuição automática
        if (bucket.is_default) continue;

        const percentage = Number(bucket.allocation_percentage);
        
        if (percentage > 0) {
          distributionTargets.push({
            bucketId: bucket.id,
            value: percentage,
            isPercentage: true,
          });
        }
      }
    } else {
      // MODO MANUAL DINÂMICO
      distributionTargets = targets;

      for (const target of distributionTargets) {
        const targetBucket = await tx.bucket.findUnique({
          where: { id: target.bucketId }
        });

        if (!targetBucket || targetBucket.workspace_id !== workspaceId) {
          throw new AppError(`Bucket de destino ${target.bucketId} não encontrado`, 404);
        }

        if (target.bucketId === sourceBucketId) {
          throw new AppError("Não é possível distribuir para o bucket de origem", 400);
        }
      }
    }

    // 4. Calcular distribuição
    // A função calculateDistribution usa o totalAmount como base para calcular as porcentagens
    const distributions = calculateDistribution(totalAmount, distributionTargets);

    // 5. Validar total distribuído
    let totalDistributed = new Prisma.Decimal(0);
    for (const dist of distributions) {
      totalDistributed = totalDistributed.add(dist.amount);
    }

    // Validação de segurança: não podemos distribuir mais do que existe no bucket
    if (totalDistributed.gt(new Prisma.Decimal(sourceBalance))) {
       throw new AppError("O valor total distribuído excede o saldo atual do bucket", 400);
    }

    // CORREÇÃO: Removemos a lógica de Remainder. 
    // Se o usuário distribuiu 100 de 600, a sobra (500) simplesmente já está no bucket.

    // 6. Atualizar bucket de origem (Debita APENAS o que saiu)
    if (totalDistributed.gt(0)) {
      await tx.bucket.update({
        where: { id: sourceBucketId },
        data: {
          current_balance: { decrement: totalDistributed },
          // Opcional: Se quiser reduzir o total_allocated da origem ao transferir, descomente abaixo.
          // Geralmente em transferências entre envelopes, você move o alocado também.
          total_allocated: { decrement: totalDistributed },
        },
      });

      // Criar transação de saída
      await tx.transaction.create({
        data: {
          workspace_id: workspaceId,
          bucket_id: sourceBucketId,
          amount: totalDistributed,
          type: "EXPENSE",
          description: "Distribuição de saldo para outros buckets",
          is_allocated: true,
        },
      });
    }

    // 7. Distribuir valores para os buckets de destino
    const results = [];
    for (const dist of distributions) {
      if (dist.amount.equals(0)) continue;

      const updatedBucket = await tx.bucket.update({
        where: { id: dist.bucketId },
        data: {
          current_balance: { increment: dist.amount },
          total_allocated: { increment: dist.amount },
        },
      });

      // Criar transação de entrada
      await tx.transaction.create({
        data: {
          workspace_id: workspaceId,
          bucket_id: dist.bucketId,
          amount: dist.amount,
          type: "INCOME",
          description: `Recebido via distribuição de ${sourceBucket.name}`,
          is_allocated: true,
        },
      });

      results.push({
        bucketId: dist.bucketId,
        name: updatedBucket.name,
        amount: Number(dist.amount),
        current_balance: Number(updatedBucket.current_balance),
      });
    }

    return {
      sourceBucket: {
        id: sourceBucket.id,
        name: sourceBucket.name,
        previousBalance: sourceBalance,
        newBalance: sourceBalance - Number(totalDistributed),
      },
      distributions: results,
      totalDistributed: Number(totalDistributed),
      remainder: Number(totalAmount.minus(totalDistributed)),
    };
  });
}
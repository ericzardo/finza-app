import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { CreateTransactionData } from "@/schemas/transaction";

interface CreateServiceProps extends CreateTransactionData {
  userId: string;
}

export async function createTransaction({ userId, ...data }: CreateServiceProps) {
  // 1. Validações Iniciais
  const workspace = await prisma.workspace.findUnique({
    where: { id: data.workspaceId }
  });

  if (!workspace || workspace.user_id !== userId) {
    throw new AppError("Workspace not found", 404);
  }

  // Valida bucket se for passado (Se não for, cairá no Inbox)
  if (data.bucketId) {
    const bucket = await prisma.bucket.findUnique({
      where: { id: data.bucketId }
    });
    if (!bucket || bucket.workspace_id !== data.workspaceId) {
      throw new AppError("Caixa não encontrada neste workspace", 404);
    }
  }

  // Busca o Inbox (Necessário para fallback)
  const inboxBucket = await prisma.bucket.findFirst({
    where: {
      workspace_id: workspace.id,
      is_default: true,
    }
  });

  if (!inboxBucket) {
    throw new AppError("Erro Crítico: Caixa de Entrada não encontrada.", 500);
  }

  return prisma.$transaction(async (tx) => {
    const amount = new Prisma.Decimal(Math.abs(data.amount));
    
    // O PULO DO GATO: Definimos o alvo aqui.
    // Se tem bucketId, usa ele. Se não, vai pro Inbox.
    const targetBucketId = data.bucketId || inboxBucket.id;

    // 2. Cria a Transação
    const transaction = await tx.transaction.create({
      data: {
        workspace_id: data.workspaceId,
        bucket_id: targetBucketId, // Usa o alvo definido acima
        amount,
        type: data.type,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        is_allocated: data.isAllocated || false,
      }
    });

    // 3. Atualiza Saldo GERAL do Workspace
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

    // 4. Lógica de DESPESA (Unificada)
    if (data.type === 'EXPENSE') {
      // Agora atualizamos o targetBucketId (seja ele Inbox ou um bucket específico)
      await tx.bucket.update({
        where: { id: targetBucketId },
        data: { 
          total_spent: { increment: amount }, 
          current_balance: { decrement: amount } 
        }
      });
    }

    // 5. Lógica de RECEITA
    if (data.type === 'INCOME') {
      
      // CENÁRIO A: Distribuição Automática (Allocated = true)
      if (data.isAllocated) {
        const buckets = await tx.bucket.findMany({
          where: { workspace_id: data.workspaceId }
        });

        let totalDistributed = new Prisma.Decimal(0);

        for (const bucket of buckets) {
          // Pula o Inbox na distribuição de porcentagem
          if (bucket.is_default) continue;

          const percentage = Number(bucket.allocation_percentage) / 100;
          
          if (percentage > 0) {
            const shareAmount = Number(amount) * percentage;
            const shareDecimal = new Prisma.Decimal(shareAmount);
            
            totalDistributed = totalDistributed.add(shareDecimal);

            await tx.bucket.update({
              where: { id: bucket.id },
              data: {
                total_allocated: { increment: shareDecimal },
                current_balance: { increment: shareDecimal }
              }
            });
          }
        }

        // A sobra (Remainder) vai para o Inbox (inboxBucket já buscado lá em cima)
        const remainder = amount.minus(totalDistributed);

        if (remainder.gt(0)) {
           await tx.bucket.update({
             where: { id: inboxBucket.id },
             data: {
               total_allocated: { increment: remainder },
               current_balance: { increment: remainder }
             }
           });
        }
      } 
      
      // CENÁRIO B: Receita Direta (Sem distribuição)
      else {
        await tx.bucket.update({
          where: { id: targetBucketId },
          data: {
            total_allocated: { increment: amount },
            current_balance: { increment: amount }
          }
        });
      }
    }

    return transaction;
  });
}
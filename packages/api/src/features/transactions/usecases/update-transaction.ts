import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient, TransactionType } from '@prisma/client';
import type { TransactionResult } from './create-transaction';
import { getBucketBalance } from './get-bucket-balance';

interface UpdateTransactionInput {
  workspaceId: string;
  transactionId: string;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: Date;
  is_paid?: boolean;
  bucket_id?: string;
}

export async function updateTransaction(
  db: PrismaClient,
  {
    workspaceId,
    transactionId,
    type,
    amount,
    description,
    date,
    is_paid,
    bucket_id,
  }: UpdateTransactionInput,
): Promise<TransactionResult> {
  const existing = await db.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existing || existing.workspace_id !== workspaceId) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Transação não encontrada');
  }

  if (bucket_id) {
    const bucket = await db.bucket.findFirst({
      where: { id: bucket_id, workspace_id: workspaceId },
    });
    if (!bucket) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        404,
        'Caixa de propósito não encontrado',
      );
    }
  }

  // Valores efetivos após o update
  const effectiveType = type ?? existing.type;
  const effectiveAmount = amount ?? Number(existing.amount);
  const effectiveIsPaid = is_paid ?? existing.is_paid;
  const effectiveBucketId = bucket_id ?? existing.bucket_id;

  const transaction = await db.$transaction(async (tx) => {
    // Deletar cascade internals anteriores (onDelete: Cascade faria isso,
    // mas aqui fazemos explicitamente para garantir dentro da mesma $transaction)
    await tx.transaction.deleteMany({
      where: { source_transaction_id: transactionId },
    });

    // Atualizar a transação principal
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { type, amount, description, date, is_paid, bucket_id },
    });

    // Cascata: só avalia se o resultado é EXPENSE pago em bucket não-INBOX
    const shouldEvaluateCascade =
      effectiveType === 'EXPENSE' &&
      effectiveIsPaid === true &&
      effectiveBucketId !== null;

    if (shouldEvaluateCascade && effectiveBucketId) {
      // Verificar se o bucket é INBOX
      const bucket = await tx.bucket.findUnique({
        where: { id: effectiveBucketId },
        select: { type: true },
      });

      if (bucket && bucket.type !== 'INBOX') {
        // Saldo do bucket excluindo a transação principal (já atualizada)
        const balance = await getBucketBalance(tx, effectiveBucketId, {
          excludeTransactionId: transactionId,
        });

        if (balance < effectiveAmount) {
          const deficit = effectiveAmount - balance;

          const inboxBucket = await tx.bucket.findFirst({
            where: { workspace_id: workspaceId, type: 'INBOX' },
          });
          if (!inboxBucket) {
            throw new AppError(
              ErrorCode.NOT_FOUND,
              404,
              'Caixa de Entrada (INBOX) não encontrado no workspace',
            );
          }

          const pairId = crypto.randomUUID();
          const effectiveDate = date ?? existing.date;
          const effectiveDescription = description ?? existing.description;

          await tx.transaction.createMany({
            data: [
              {
                workspace_id: workspaceId,
                type: 'EXPENSE',
                amount: deficit,
                description: `Cascata: cobertura de déficit para "${effectiveDescription}"`,
                date: effectiveDate,
                is_paid: true,
                is_internal: true,
                transfer_pair_id: pairId,
                source_transaction_id: transactionId,
                bucket_id: inboxBucket.id,
              },
              {
                workspace_id: workspaceId,
                type: 'INCOME',
                amount: deficit,
                description: `Cascata: cobertura de déficit para "${effectiveDescription}"`,
                date: effectiveDate,
                is_paid: true,
                is_internal: true,
                transfer_pair_id: pairId,
                source_transaction_id: transactionId,
                bucket_id: effectiveBucketId,
              },
            ],
          });
        }
      }
    }

    return updated;
  });

  return {
    id: transaction.id,
    workspace_id: transaction.workspace_id,
    type: transaction.type,
    amount: Number(transaction.amount),
    description: transaction.description,
    date: transaction.date.toISOString(),
    is_paid: transaction.is_paid,
    is_internal: transaction.is_internal,
    transfer_pair_id: transaction.transfer_pair_id,
    bucket_id: transaction.bucket_id,
    bank_account_id: transaction.bank_account_id,
    credit_card_id: transaction.credit_card_id,
    category_id: transaction.category_id,
    created_at: transaction.created_at.toISOString(),
  };
}

import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient, TransactionType } from '@prisma/client';
import { getBucketBalance } from './get-bucket-balance';

interface CreateTransactionInput {
  workspaceId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  is_paid: boolean;
  bucket_id?: string;
  bank_account_id?: string;
  credit_card_id?: string;
  category_id?: string;
}

export interface TransactionResult {
  id: string;
  workspace_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  is_paid: boolean;
  is_internal: boolean;
  transfer_pair_id: string | null;
  bucket_id: string | null;
  bank_account_id: string | null;
  credit_card_id: string | null;
  category_id: string | null;
  created_at: string;
}

export async function createTransaction(
  db: PrismaClient,
  input: CreateTransactionInput,
): Promise<TransactionResult> {
  const {
    workspaceId,
    type,
    amount,
    description,
    date,
    is_paid,
    bucket_id,
    bank_account_id,
    credit_card_id,
    category_id,
  } = input;

  // Passo 1 — Resolver bucket_id (Trava do Inbox)
  let resolvedBucketId: string;
  let resolvedBucketType: string;

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
    resolvedBucketId = bucket.id;
    resolvedBucketType = bucket.type;
  } else {
    const inboxBucket = await db.bucket.findFirst({
      where: { workspace_id: workspaceId, type: 'INBOX' },
    });
    if (!inboxBucket) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        404,
        'Caixa de Entrada (INBOX) não encontrado no workspace',
      );
    }
    resolvedBucketId = inboxBucket.id;
    resolvedBucketType = 'INBOX';
  }

  // Passo 2 — Validar instrumentos financeiros (ownership)
  if (bank_account_id) {
    const bankAccount = await db.bankAccount.findFirst({
      where: { id: bank_account_id, workspace_id: workspaceId },
    });
    if (!bankAccount) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        404,
        'Conta bancária não encontrada',
      );
    }
  }

  if (credit_card_id) {
    const creditCard = await db.creditCard.findFirst({
      where: { id: credit_card_id, workspace_id: workspaceId },
    });
    if (!creditCard) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        404,
        'Cartão de crédito não encontrado',
      );
    }
  }

  if (category_id) {
    const category = await db.category.findFirst({
      where: { id: category_id, workspace_id: workspaceId },
    });
    if (!category) {
      throw new AppError(ErrorCode.NOT_FOUND, 404, 'Categoria não encontrada');
    }
  }

  // Passo 3 — Criar transação dentro de $transaction atômica
  const transaction = await db.$transaction(async (tx) => {
    const mainTransaction = await tx.transaction.create({
      data: {
        workspace_id: workspaceId,
        type,
        amount,
        description,
        date,
        is_paid,
        bucket_id: resolvedBucketId,
        bank_account_id: bank_account_id ?? null,
        credit_card_id: credit_card_id ?? null,
        category_id: category_id ?? null,
      },
    });

    // Cascata: só dispara para EXPENSE pago em bucket não-INBOX com déficit
    if (type === 'EXPENSE' && resolvedBucketType !== 'INBOX' && is_paid) {
      // Calcula saldo excluindo a transação principal recém-criada
      const balance = await getBucketBalance(tx, resolvedBucketId, {
        excludeTransactionId: mainTransaction.id,
      });

      if (balance < amount) {
        const deficit = amount - balance;

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

        await tx.transaction.createMany({
          data: [
            {
              workspace_id: workspaceId,
              type: 'EXPENSE',
              amount: deficit,
              description: `Cascata: cobertura de déficit para "${description}"`,
              date,
              is_paid: true,
              is_internal: true,
              transfer_pair_id: pairId,
              source_transaction_id: mainTransaction.id,
              bucket_id: inboxBucket.id,
            },
            {
              workspace_id: workspaceId,
              type: 'INCOME',
              amount: deficit,
              description: `Cascata: cobertura de déficit para "${description}"`,
              date,
              is_paid: true,
              is_internal: true,
              transfer_pair_id: pairId,
              source_transaction_id: mainTransaction.id,
              bucket_id: resolvedBucketId,
            },
          ],
        });
      }
    }

    return mainTransaction;
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

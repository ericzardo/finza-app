import type { PrismaClient } from '@prisma/client';
import { AppError, ErrorCode } from '@errors/app-error';

interface ConfirmImportItem {
  date: Date;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
}

interface ConfirmImportInput {
  workspaceId: string;
  transactions: ConfirmImportItem[];
  balanceAdjustment?: number;
}

interface ConfirmImportResult {
  imported: number;
  duplicates: number;
  total: number;
}

function normalizeDescription(description: string): string {
  return description.trim().toLowerCase();
}

function toDateOnlyISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function confirmImport(
  db: PrismaClient,
  input: ConfirmImportInput,
): Promise<ConfirmImportResult> {
  const { workspaceId, transactions, balanceAdjustment } = input;

  // Passo 1 — Encontrar o INBOX do workspace
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

  // Passo 2 — Buscar transações existentes para dedup
  // Extraímos o intervalo de datas para limitar a query
  const dates = transactions.map((t) => t.date);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Margem de 1 dia para cobrir edge cases de timezone
  minDate.setDate(minDate.getDate() - 1);
  maxDate.setDate(maxDate.getDate() + 1);

  const existingTransactions = await db.transaction.findMany({
    where: {
      workspace_id: workspaceId,
      date: { gte: minDate, lte: maxDate },
    },
    select: {
      date: true,
      amount: true,
      description: true,
    },
  });

  // Passo 3 — Montar set de chaves existentes
  const existingKeys = new Set(
    existingTransactions.map((t) => {
      const dateKey = toDateOnlyISO(t.date);
      const amountKey = Math.abs(Number(t.amount)).toFixed(2);
      const descKey = normalizeDescription(t.description);
      return `${dateKey}|${amountKey}|${descKey}`;
    }),
  );

  // Passo 4 — Filtrar duplicatas do lote
  const newTransactions: ConfirmImportItem[] = [];
  let duplicates = 0;

  for (const trn of transactions) {
    const dateKey = toDateOnlyISO(trn.date);
    const amountKey = Math.abs(trn.amount).toFixed(2);
    const descKey = normalizeDescription(trn.description);
    const key = `${dateKey}|${amountKey}|${descKey}`;

    if (existingKeys.has(key)) {
      duplicates++;
    } else {
      newTransactions.push(trn);
      // Adiciona ao set para evitar duplicatas internas do lote
      existingKeys.add(key);
    }
  }

  // Passo 5 — Inserir no banco via $transaction atômico
  if (newTransactions.length > 0) {
    await db.$transaction(async (tx) => {
      await tx.transaction.createMany({
        data: newTransactions.map((trn) => ({
          workspace_id: workspaceId,
          bucket_id: inboxBucket.id,
          type: trn.type,
          amount: trn.amount,
          description: trn.description,
          date: trn.date,
          is_paid: true,
        })),
      });

      // Passo 6 — Criar transação de ajuste de saldo se necessário
      if (balanceAdjustment !== undefined) {
        const net = newTransactions.reduce((acc, trn) => {
          return trn.type === 'INCOME' ? acc + trn.amount : acc - trn.amount;
        }, 0);

        const adjustmentAmount = balanceAdjustment - net;

        if (Math.abs(adjustmentAmount) >= 0.01) {
          const latestDate = newTransactions.reduce((latest, trn) => {
            return trn.date > latest ? trn.date : latest;
          }, newTransactions[0].date);

          await tx.transaction.create({
            data: {
              workspace_id: workspaceId,
              bucket_id: inboxBucket.id,
              type: adjustmentAmount > 0 ? 'INCOME' : 'EXPENSE',
              amount: Math.abs(adjustmentAmount),
              description: 'Ajuste de saldo inicial',
              internal_type: 'BALANCE_ADJUSTMENT',
              date: latestDate,
              is_paid: true,
            },
          });
        }
      }
    });
  }

  return {
    imported: newTransactions.length,
    duplicates,
    total: transactions.length,
  };
}

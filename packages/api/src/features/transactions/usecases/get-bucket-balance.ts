import { TransactionType, type Prisma, type PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getBucketBalance(
  db: DbClient,
  bucketId: string,
  options?: { excludeTransactionId?: string },
): Promise<number> {
  const aggregations = await db.transaction.groupBy({
    by: ['type'],
    where: {
      bucket_id: bucketId,
      is_paid: true,
      canceled_at: null,
      ...(options?.excludeTransactionId
        ? { id: { not: options.excludeTransactionId } }
        : {}),
    },
    _sum: { amount: true },
  });

  let income = 0;
  let expense = 0;

  for (const aggregation of aggregations) {
    const amount = Number(aggregation._sum.amount ?? 0);

    if (aggregation.type === TransactionType.INCOME) {
      income = amount;
    } else if (aggregation.type === TransactionType.EXPENSE) {
      expense = amount;
    }
  }

  return income - expense;
}

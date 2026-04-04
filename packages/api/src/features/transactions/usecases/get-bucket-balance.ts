import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getBucketBalance(
  db: DbClient,
  bucketId: string,
  options?: { excludeTransactionId?: string },
): Promise<number> {
  const transactions = await db.transaction.findMany({
    where: {
      bucket_id: bucketId,
      is_paid: true,
      canceled_at: null,
      ...(options?.excludeTransactionId
        ? { id: { not: options.excludeTransactionId } }
        : {}),
    },
    select: { type: true, amount: true },
  });

  let balance = 0;
  for (const t of transactions) {
    const value = Number(t.amount);
    if (t.type === 'INCOME') {
      balance += value;
    } else if (t.type === 'EXPENSE') {
      balance -= value;
    }
  }

  return balance;
}

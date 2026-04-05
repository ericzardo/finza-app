import { updateTransaction } from '@features/transactions/usecases/update-transaction';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function updateTransactionController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const { transactionId } = request.params as { transactionId: string };
  const body = request.body as {
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount?: number;
    description?: string;
    date?: Date;
    is_paid?: boolean;
    bucket_id?: string;
  };

  const transaction = await updateTransaction(fastify.prisma, {
    workspaceId: request.workspaceId as string,
    transactionId,
    ...body,
  });

  return reply.code(200).send(transaction);
}

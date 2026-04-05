import { listTransactions } from '@features/transactions/usecases/list-transactions';
import type { TransactionType } from '@prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function listTransactionsController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const query = request.query as {
    startDate?: Date;
    endDate?: Date;
    bucketId?: string;
    isPaid?: boolean;
    type?: TransactionType;
    page: number;
    limit: number;
  };

  const result = await listTransactions(fastify.prisma, {
    workspaceId: request.workspaceId as string,
    ...query,
  });

  return reply.code(200).send(result);
}

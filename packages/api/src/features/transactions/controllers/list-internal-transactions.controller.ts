import { listInternalTransactions } from '@features/transactions/usecases/list-internal-transactions';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function listInternalTransactionsController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const query = request.query as {
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  };

  const result = await listInternalTransactions(fastify.prisma, {
    workspaceId: request.workspaceId as string,
    ...query,
  });

  return reply.code(200).send(result);
}

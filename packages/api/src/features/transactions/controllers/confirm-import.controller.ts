import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { confirmImport } from '@features/transactions/usecases/confirm-import';

interface ConfirmImportBody {
  transactions: {
    date: Date;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE';
  }[];
}

export async function confirmImportController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const { transactions } = request.body as ConfirmImportBody;
  const workspaceId = request.workspaceId as string;

  const result = await confirmImport(fastify.prisma, {
    workspaceId,
    transactions,
  });

  return reply.code(200).send(result);
}

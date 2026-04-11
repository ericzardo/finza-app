import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { confirmImport } from '@features/transactions/usecases/confirm-import';

interface ConfirmImportBody {
  transactions: {
    date: Date;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE';
  }[];
  balanceAdjustment?: number;
}

export async function confirmImportController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const { transactions, balanceAdjustment } = request.body as ConfirmImportBody;
  const workspaceId = request.workspaceId as string;

  const result = await confirmImport(fastify.prisma, {
    workspaceId,
    transactions,
    balanceAdjustment,
  });

  return reply.code(200).send(result);
}

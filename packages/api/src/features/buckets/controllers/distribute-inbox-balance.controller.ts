import { AppError, ErrorCode } from '@errors/app-error';
import { distributeInboxBalance } from '@features/buckets/usecases/distribute-inbox-balance';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function distributeInboxBalanceController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const { workspaceId } = request.params as { workspaceId: string };

  if (!request.workspaceId) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'Workspace ID não encontrado no contexto da requisição',
    );
  }

  if (workspaceId !== request.workspaceId) {
    throw new AppError(
      ErrorCode.BAD_REQUEST,
      400,
      'O workspaceId da URL deve corresponder ao header x-workspace-id',
    );
  }

  const body = request.body as Array<{ bucket_id: string; amount: number }>;

  const result = await distributeInboxBalance(fastify.prisma, {
    workspaceId: request.workspaceId,
    distributions: body,
  });

  return reply.code(201).send(result);
}

import { createBucket } from '@features/buckets/usecases/create-bucket';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function createBucketController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const body = request.body as {
    name: string;
    type: 'SPENDING' | 'INVESTMENT';
    allocation_percentage: number;
  };

  const bucket = await createBucket(fastify.prisma, {
    workspaceId: request.workspaceId as string,
    name: body.name,
    type: body.type,
    allocation_percentage: body.allocation_percentage,
  });

  return reply.code(201).send(bucket);
}

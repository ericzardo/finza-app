import { createUser } from '@features/users/usecases/create-user';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function createUserController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const body = request.body as {
    name: string;
    email: string;
    password: string;
  };

  const user = await createUser(fastify.prisma, body);

  return reply.code(201).send({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: 'beta',
    avatar_url: user.avatar_url,
  });
}

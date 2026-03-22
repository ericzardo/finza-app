import env from '@env';
import { authenticateUser } from '@features/auth/usecases/authenticate-user';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const COOKIE_NAME = 'finza_token';

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const body = request.body as { email: string; password: string };

  const { token, user } = await authenticateUser(
    fastify.prisma,
    body,
    env.JWT_SECRET,
  );

  reply.setCookie(COOKIE_NAME, token);

  return reply.code(200).send({ user });
}

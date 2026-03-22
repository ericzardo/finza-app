import env from '@env';
import type { FastifyReply, FastifyRequest } from 'fastify';

const COOKIE_NAME = 'finza_token';

export async function logoutController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  reply.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'prod',
    sameSite: 'lax' as const,
    path: '/',
  });

  return reply.code(200).send({ message: 'Logout realizado com sucesso' });
}

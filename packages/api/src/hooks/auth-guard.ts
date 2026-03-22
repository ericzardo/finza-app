import env from '@env';
import { AppError, ErrorCode } from '@errors/app-error';
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
} from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

const COOKIE_NAME = 'finza_token';

const authGuardPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const token = request.cookies[COOKIE_NAME];

    if (!token) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        401,
        'Token de autenticação não encontrado',
      );
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      request.user = {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        401,
        'Token inválido ou expirado',
      );
    }
  });
};

export default fp(authGuardPlugin, { name: 'auth-guard' });

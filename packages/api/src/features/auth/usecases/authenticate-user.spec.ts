import { describe, expect, test } from 'bun:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCode } from '@errors/app-error';
import { authenticateUser } from './authenticate-user';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = 'test-secret-key-min-8';

type FindUserArgs = {
  where: { email: string };
  include?: { plan: boolean };
};

type BuildDbOptions = {
  userExists?: boolean;
  password?: string;
  plan?: { id: string; slug: string } | null;
};

async function buildDb(options: BuildDbOptions = {}) {
  const findUserCalls: FindUserArgs[] = [];
  const hashedPassword = options.password
    ? await bcrypt.hash(options.password, 10)
    : await bcrypt.hash('senha123', 10);

  const db = {
    user: {
      findUnique: async (args: FindUserArgs) => {
        findUserCalls.push(args);
        if (options.userExists === false) return null;
        return {
          id: 'user-id',
          name: 'Ana',
          email: 'ana@email.com',
          password: hashedPassword,
          plan:
            options.plan !== undefined
              ? options.plan
              : { id: 'plan-id', slug: 'beta' },
        };
      },
    },
  } as unknown as PrismaClient;

  return { db, findUserCalls };
}

describe('authenticateUser', () => {
  test('autentica usuario com sucesso e retorna JWT', async () => {
    const { db, findUserCalls } = await buildDb({ password: 'senha123' });

    const result = await authenticateUser(
      db,
      { email: 'ana@email.com', password: 'senha123' },
      JWT_SECRET,
    );

    expect(findUserCalls).toEqual([
      { where: { email: 'ana@email.com' }, include: { plan: true } },
    ]);

    expect(result.user).toEqual({
      id: 'user-id',
      name: 'Ana',
      email: 'ana@email.com',
      plan: 'beta',
    });

    expect(typeof result.token).toBe('string');

    const decoded = jwt.verify(result.token, JWT_SECRET) as jwt.JwtPayload;
    expect(decoded.sub).toBe('user-id');
    expect(decoded.email).toBe('ana@email.com');
  });

  test('lanca erro se usuario nao existir', async () => {
    const { db } = await buildDb({ userExists: false });

    try {
      await authenticateUser(
        db,
        { email: 'naoexiste@email.com', password: 'senha123' },
        JWT_SECRET,
      );
      expect(true).toBe(false);
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Credenciais inválidas');
    }
  });

  test('lanca erro se senha estiver incorreta', async () => {
    const { db } = await buildDb({ password: 'senha-correta' });

    try {
      await authenticateUser(
        db,
        { email: 'ana@email.com', password: 'senha-errada' },
        JWT_SECRET,
      );
      expect(true).toBe(false);
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Credenciais inválidas');
    }
  });

  test('retorna plan free se usuario nao tem plano', async () => {
    const { db } = await buildDb({ password: 'senha123', plan: null });

    const result = await authenticateUser(
      db,
      { email: 'ana@email.com', password: 'senha123' },
      JWT_SECRET,
    );

    expect(result.user.plan).toBe('free');
  });
});

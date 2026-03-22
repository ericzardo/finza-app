import { describe, expect, test } from 'bun:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';
import { changePassword } from './change-password';

const JWT_SECRET = 'test-secret-key-min-8';

type FindUniqueArgs = { where: { id: string } };
type UpdateArgs = {
  where: { id: string };
  data: { password: string };
  include?: { plan: boolean };
};
type DeleteManyArgs = { where: { user_id: string } };

type BuildDbOptions = {
  userExists?: boolean;
  currentPassword?: string;
};

async function buildDb(options: BuildDbOptions = {}) {
  const findUniqueCalls: FindUniqueArgs[] = [];
  const updateCalls: UpdateArgs[] = [];
  const deleteManyCalls: DeleteManyArgs[] = [];
  const transactionCalls: unknown[][] = [];

  const hashedPassword = await bcrypt.hash(
    options.currentPassword ?? 'senha-atual',
    10,
  );

  const db = {
    user: {
      findUnique: async (args: FindUniqueArgs) => {
        findUniqueCalls.push(args);
        if (options.userExists === false) return null;
        return {
          id: 'user-id',
          password: hashedPassword,
        };
      },
      update: (args: UpdateArgs) => {
        updateCalls.push(args);
        return {
          id: 'user-id',
          name: 'Test User',
          email: 'test@email.com',
          password: args.data.password,
          plan: { slug: 'beta' },
        };
      },
    },
    token: {
      deleteMany: (args: DeleteManyArgs) => {
        deleteManyCalls.push(args);
        return { count: 0 };
      },
    },
    $transaction: async (operations: unknown[]) => {
      transactionCalls.push(operations);
      return operations;
    },
  } as unknown as PrismaClient;

  return {
    db,
    findUniqueCalls,
    updateCalls,
    deleteManyCalls,
    transactionCalls,
  };
}

describe('changePassword', () => {
  test('altera a senha com sucesso', async () => {
    const { db, updateCalls, deleteManyCalls } = await buildDb({
      currentPassword: 'senha-atual',
    });

    const result = await changePassword(db, 'user-id', JWT_SECRET, {
      currentPassword: 'senha-atual',
      newPassword: 'nova-senha-123',
    });

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].where.id).toBe('user-id');

    const newHashMatches = await bcrypt.compare(
      'nova-senha-123',
      updateCalls[0].data.password,
    );
    expect(newHashMatches).toBe(true);

    expect(deleteManyCalls).toHaveLength(1);
    expect(deleteManyCalls[0].where.user_id).toBe('user-id');

    expect(typeof result.token).toBe('string');
    const decoded = jwt.verify(result.token, JWT_SECRET) as jwt.JwtPayload;
    expect(decoded.sub).toBe('user-id');
    expect(decoded.email).toBe('test@email.com');

    expect(result.user).toEqual({
      id: 'user-id',
      name: 'Test User',
      email: 'test@email.com',
      plan: 'beta',
    });
  });

  test('lança NOT_FOUND quando usuário não existir', async () => {
    const { db } = await buildDb({ userExists: false });

    await expect(
      changePassword(db, 'missing', JWT_SECRET, {
        currentPassword: 'qualquer',
        newPassword: 'nova-senha-123',
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
    });
  });

  test('lança FORBIDDEN quando senha atual estiver incorreta', async () => {
    const { db } = await buildDb({ currentPassword: 'senha-correta' });

    await expect(
      changePassword(db, 'user-id', JWT_SECRET, {
        currentPassword: 'senha-errada',
        newPassword: 'nova-senha-123',
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
    });
  });

  test('gera hash diferente para a nova senha', async () => {
    const { db, updateCalls } = await buildDb({
      currentPassword: 'senha-atual',
    });

    await changePassword(db, 'user-id', JWT_SECRET, {
      currentPassword: 'senha-atual',
      newPassword: 'nova-senha-123',
    });

    expect(updateCalls[0].data.password).not.toBe('nova-senha-123');
    expect(updateCalls[0].data.password.startsWith('$2')).toBe(true);
  });
});

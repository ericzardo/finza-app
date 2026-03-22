import { describe, expect, test } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { ErrorCode } from '@errors/app-error';
import { togglePrivacy } from './toggle-privacy';

type FindUniqueArgs = { where: { id: string } };
type UpdateArgs = {
  where: { id: string };
  data: { is_privacy_enabled: boolean };
  select: { is_privacy_enabled: true };
};

type BuildDbOptions = {
  userExists?: boolean;
  currentPrivacy?: boolean;
};

function buildDb(options: BuildDbOptions = {}) {
  const updateCalls: UpdateArgs[] = [];

  const db = {
    user: {
      findUnique: async (_args: FindUniqueArgs) => {
        if (options.userExists === false) return null;

        return {
          id: 'user-id',
          is_privacy_enabled: options.currentPrivacy ?? false,
        };
      },
      update: async (args: UpdateArgs) => {
        updateCalls.push(args);
        return { is_privacy_enabled: args.data.is_privacy_enabled };
      },
    },
  } as unknown as PrismaClient;

  return { db, updateCalls };
}

describe('togglePrivacy', () => {
  test('ativa a privacidade quando estava desativada', async () => {
    const { db, updateCalls } = buildDb({ currentPrivacy: false });

    const result = await togglePrivacy(db, 'user-id');

    expect(result.is_privacy_enabled).toBe(true);
    expect(updateCalls[0].data.is_privacy_enabled).toBe(true);
  });

  test('desativa a privacidade quando estava ativada', async () => {
    const { db, updateCalls } = buildDb({ currentPrivacy: true });

    const result = await togglePrivacy(db, 'user-id');

    expect(result.is_privacy_enabled).toBe(false);
    expect(updateCalls[0].data.is_privacy_enabled).toBe(false);
  });

  test('lança NOT_FOUND quando usuário não existir', async () => {
    const { db } = buildDb({ userExists: false });

    await expect(togglePrivacy(db, 'missing')).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
    });
  });
});

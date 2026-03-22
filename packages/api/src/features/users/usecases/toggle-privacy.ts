import { AppError, ErrorCode } from '@errors/app-error';
import { PrismaClient } from '@prisma/client';

export async function togglePrivacy(
  db: PrismaClient,
  userId: string,
): Promise<{ is_privacy_enabled: boolean }> {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Usuário não encontrado');
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { is_privacy_enabled: !user.is_privacy_enabled },
    select: { is_privacy_enabled: true },
  });

  return updated;
}

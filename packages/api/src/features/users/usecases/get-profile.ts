import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';

type GetProfileResult = {
  id: string;
  name: string;
  email: string;
  plan: string;
  avatar_url: string | null;
  is_privacy_enabled: boolean;
  email_verified_at: string | null;
};

export async function getProfile(
  db: PrismaClient,
  userId: string,
): Promise<GetProfileResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Usuário não encontrado');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan?.slug ?? 'free',
    avatar_url: user.avatar_url,
    is_privacy_enabled: user.is_privacy_enabled,
    email_verified_at: user.email_verified_at?.toISOString() ?? null,
  };
}

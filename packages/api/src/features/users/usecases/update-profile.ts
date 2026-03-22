import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';

interface UpdateProfileInput {
  name?: string;
  avatar_url?: string;
  email?: string;
}

interface UpdateProfileResult {
  id: string;
  name: string;
  email: string;
  plan: string;
  avatar_url: string | null;
  is_privacy_enabled: boolean;
  email_verified_at: string | null;
}

export async function updateProfile(
  db: PrismaClient,
  userId: string,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Usuário não encontrado');
  }

  const data: Record<string, unknown> = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.avatar_url !== undefined) {
    data.avatar_url = input.avatar_url;
  }

  if (input.email !== undefined && input.email !== user.email) {
    const existing = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError(ErrorCode.CONFLICT, 409, 'E-mail já cadastrado');
    }

    data.email = input.email;
    data.email_verified_at = null;
  }

  const updated = await db.user.update({
    where: { id: userId },
    data,
    include: { plan: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    plan: updated.plan?.slug ?? 'free',
    avatar_url: updated.avatar_url,
    is_privacy_enabled: updated.is_privacy_enabled,
    email_verified_at: updated.email_verified_at?.toISOString() ?? null,
  };
}

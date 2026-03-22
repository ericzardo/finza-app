import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordOutput {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
}

export async function changePassword(
  db: PrismaClient,
  userId: string,
  jwtSecret: string,
  { currentPassword, newPassword }: ChangePasswordInput,
): Promise<ChangePasswordOutput> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Usuário não encontrado');
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatches) {
    throw new AppError(ErrorCode.FORBIDDEN, 403, 'Senha atual incorreta');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { '0': updatedUser } = await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: { plan: true },
    }),
    db.token.deleteMany({
      where: { user_id: userId },
    }),
  ]);

  const token = jwt.sign(
    { sub: updatedUser.id, email: updatedUser.email },
    jwtSecret,
    {
      expiresIn: '7d',
    },
  );

  return {
    token,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      plan: updatedUser.plan?.slug ?? 'free',
    },
  };
}

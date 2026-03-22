import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCode } from '@errors/app-error';

interface AuthenticateInput {
  email: string;
  password: string;
}

interface AuthenticateOutput {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
}

export async function authenticateUser(
  db: PrismaClient,
  { email, password }: AuthenticateInput,
  jwtSecret: string,
): Promise<AuthenticateOutput> {
  const user = await db.user.findUnique({
    where: { email },
    include: { plan: true },
  });

  if (!user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, 401, 'Credenciais inválidas');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new AppError(ErrorCode.UNAUTHORIZED, 401, 'Credenciais inválidas');
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, {
    expiresIn: '7d',
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan?.slug ?? 'free',
    },
  };
}

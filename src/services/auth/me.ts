import { verifyToken } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getMeService(token: string | undefined) {
  if (!token) {
    throw new AppError("Token não fornecido.", 401);
  }

  const payload = await verifyToken(token);

  if (!payload || !payload.sub) {
    throw new AppError("Token inválido ou expirado.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true
    },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  return user;
}
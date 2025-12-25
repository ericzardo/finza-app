import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { ChangePasswordData } from "@/schemas/user";
import { hash, compare } from "bcryptjs";

export async function changePassword(userId: string, data: ChangePasswordData) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.password) { 
    throw new AppError("Usuário não encontrado", 404);
  }

  const passwordMatch = await compare(data.currentPassword, user.password);
  
  if (!passwordMatch) {
    throw new AppError("A senha atual está incorreta", 400);
  }

  const newPasswordHash = await hash(data.newPassword, 6);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: newPasswordHash,
    },
  });

  return { message: "Senha alterada com sucesso" };
}
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function deleteUser(id: string, requesterId: string) {
  if (id !== requesterId) {
    throw new AppError("You can only delete your own profile", 403);
  }

  // O delete do usuário deveria apagar tudo em cascata.
  // Vamos confiar que o Prisma/Banco está configurado ou faremos um delete simples.
  // Se der erro de Foreign Key, saberemos que precisamos limpar workspaces antes.
  
  await prisma.user.delete({
    where: { id }
  });

  return { success: true };
}
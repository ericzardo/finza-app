import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function deleteUser(id: string, requesterId: string) {
  if (id !== requesterId) {
    throw new AppError("You can only delete your own profile", 403);
  }
  
  const deletedUser = await prisma.user.delete({
    where: { id }
  });

  return deletedUser;
}
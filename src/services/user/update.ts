import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UpdateUserData } from "@/schemas/user";
import { Prisma } from "@prisma/client";

export async function updateUser(userId: string, data: UpdateUserData) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) throw new AppError("Usuário não encontrado", 404);

  const updateData: Prisma.UserUpdateInput = {};

  if (data.name) updateData.name = data.name;
  if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
  if (data.isPrivacyEnabled !== undefined) updateData.is_privacy_enabled = data.isPrivacyEnabled;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true, 
      email: true,
      avatar_url: true, 
      is_privacy_enabled: true,
    }
  });

  return {
    ...updatedUser,
    avatarUrl: updatedUser.avatar_url,
    isPrivacyEnabled: updatedUser.is_privacy_enabled,
  };
}
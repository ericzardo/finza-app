import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UpdateUserData } from "@/schemas/user";

interface UpdateUserServiceProps extends UpdateUserData {
  id: string;
  requesterId: string;
}

export async function updateUser({ id, requesterId, ...data }: UpdateUserServiceProps) {
  if (id !== requesterId) {
    throw new AppError("You can only update your own profile", 403);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  
  if (!user) throw new AppError("User not found", 404);

  const updateData: Prisma.UserUpdateInput = {};

  if (data.name) updateData.name = data.name;

  if (data.email && data.email !== user.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (emailExists) throw new AppError("Email already in use", 409);
    updateData.email = data.email;
  }

  if (data.password) {
    updateData.password = await hash(data.password, 6);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true, 
      email: true
    }
  });
}
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

interface UpdateUserDTO {
  id: string;
  requesterId: string;
  name?: string;
  email?: string;
  password?: string;
}

interface User {
  name?: string;
  email?: string;
  password?: string;
}

export async function updateUser(data: UpdateUserDTO) {
  if (data.id !== data.requesterId) {
    throw new AppError("You can only update your own profile", 403);
  }

  const user = await prisma.user.findUnique({ where: { id: data.id } });
  if (!user) throw new AppError("User not found", 404);

  const updateData: User = {};

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
    where: { id: data.id },
    data: updateData,
    select: {
      id: true,
      name: true, 
      email: true
    }
  });
}
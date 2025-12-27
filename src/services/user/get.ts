import { prisma } from "@/lib/prisma";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, 
      name: true, 
      email: true,
      avatar_url: true,
      workspaces: {
        select: { id: true, name: true }
      }
    }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true, avatar_url: true }
  });
}
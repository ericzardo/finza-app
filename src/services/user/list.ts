import { prisma } from "@/lib/prisma";

export async function listUsers() {
  return prisma.user.findMany({
    select: { 
      id: true, 
      name: true, 
      email: true,
      avatar_url: true,
      _count: {
        select: { workspaces: true }
      }
    }
  });
}
import { prisma } from "@/lib/prisma";

export async function listUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      name: true,
      currency: true,
      created_at: true,
      total_balance: true,
    }
  });
}
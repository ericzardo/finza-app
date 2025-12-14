import { prisma } from "@/lib/prisma";

interface CreateWorkspaceDTO {
  userId: string;
  name: string;
  currency?: string;
}

export async function createWorkspace(data: CreateWorkspaceDTO) {
  return prisma.workspace.create({
    data: {
      user_id: data.userId,
      name: data.name,
      currency: data.currency,
    }
  });
}
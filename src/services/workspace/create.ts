import { prisma } from "@/lib/prisma";
import { CreateWorkspaceData } from "@/schemas/workspace";

interface CreateServiceProps extends CreateWorkspaceData {
  userId: string;
}

export async function createWorkspace({userId, ...data}: CreateServiceProps) {
  return prisma.workspace.create({
    data: {
      user_id: userId,
      ...data,
    }
  });
}
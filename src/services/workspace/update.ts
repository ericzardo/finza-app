import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

interface UpdateWorkspaceDTO {
  id: string;
  userId: string;
  name?: string;
  currency?: string;
}

export async function updateWorkspace(data: UpdateWorkspaceDTO) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: data.id }
  });

  if (!workspace) {
    throw new AppError("Workspace not found", 404);
  }

  if (workspace.user_id !== data.userId) {
    throw new AppError("Unauthorized", 403);
  }

  return prisma.workspace.update({
    where: { id: data.id },
    data: {
      name: data.name,
      currency: data.currency
    }
  });
}
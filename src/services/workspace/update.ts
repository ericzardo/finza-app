import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UpdateWorkspaceData } from "@/schemas/workspace";
import { Prisma } from "@prisma/client";

interface UpdateServiceProps extends UpdateWorkspaceData {
  workspaceId: string;
  userId: string;
}

export async function updateWorkspace({workspaceId, userId, ...data}: UpdateServiceProps) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace) {
    throw new AppError("Workspace not found", 404);
  }

  if (workspace.user_id !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  const updateData: Prisma.WorkspaceUpdateInput = {
    ...data
  };

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: updateData
  });
}
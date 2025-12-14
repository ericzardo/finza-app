import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getWorkspaceById(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new AppError("Workspace not found", 404);
  }

  if (workspace.user_id !== userId) {
    throw new AppError("Unauthorized access to this workspace", 403);
  }

  return workspace;
}
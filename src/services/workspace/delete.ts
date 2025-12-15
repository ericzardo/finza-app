import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function deleteWorkspace(id: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id }
  });

  if (!workspace) {
    throw new AppError("Workspace not found", 404);
  }

  if (workspace.user_id !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  const deletedWorkspace = await prisma.workspace.delete({
    where: { id }
  });

  return deletedWorkspace;
}
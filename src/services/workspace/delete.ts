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

  await prisma.$transaction([
    prisma.transaction.deleteMany({
      where: { workspace_id: id },
    }),

    prisma.bucket.deleteMany({
      where: { workspace_id: id },
    }),

    prisma.workspace.delete({
      where: { id },
    }),
  ]);

  return workspace;
}
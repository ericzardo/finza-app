import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function deleteBucket(bucketId: string, userId: string) {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketId },
    include: { workspace: true }
  });

  if (!bucket || bucket.workspace.user_id !== userId) {
    throw new AppError("Bucket não encontrado ou não autorizado", 404);
  }

  const deleted = await prisma.bucket.delete({
    where: { id: bucketId }
  });

  return {
    id: deleted.id,
    name: deleted.name
  };
}
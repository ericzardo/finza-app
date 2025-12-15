import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function deleteBucket(bucketId: string) {
  const exists = await prisma.bucket.findUnique({
    where: { id: bucketId }
  });

  if (!exists) {
    throw new AppError("Bucket not found", 404);
  }

  const deletedBucket = await prisma.bucket.delete({
    where: { id: bucketId }
  });

  return deletedBucket;
}
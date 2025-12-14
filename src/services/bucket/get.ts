import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getBucketById(bucketId: string) {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketId }
  });

  if (!bucket) {
    throw new AppError("Bucket not found", 404);
  }

  return bucket;
}
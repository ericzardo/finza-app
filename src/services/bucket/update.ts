import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

interface UpdateBucketDTO {
  bucketId: string;
  name?: string;
  percentage?: number;
  isDefault?: boolean;
}

export async function updateBucket(data: UpdateBucketDTO) {
  const exists = await prisma.bucket.findUnique({
    where: { id: data.bucketId }
  });

  if (!exists) {
    throw new AppError("Bucket not found", 404);
  }

  return prisma.bucket.update({
    where: { id: data.bucketId },
    data: {
      name: data.name,
      allocation_percentage: data.percentage,
      is_default: data.isDefault
    }
  });
}
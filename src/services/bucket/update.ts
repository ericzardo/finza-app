import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UpdateBucketData } from "@/schemas/bucket";

interface UpdateServiceProps extends UpdateBucketData {
  bucketId: string;
}

export async function updateBucket({ bucketId, ...data }: UpdateServiceProps) {
  const exists = await prisma.bucket.findUnique({
    where: { id: bucketId }
  });

  if (!exists) {
    throw new AppError("Bucket not found", 404);
  }

  const updateData: Prisma.BucketUpdateInput = {};

  if (data.name) {
    updateData.name = data.name;
  }

  if (data.percentage !== undefined) {
    updateData.allocation_percentage = data.percentage;
  }

  if (data.isDefault !== undefined) {
    updateData.is_default = data.isDefault;
  }

  return prisma.bucket.update({
    where: { id: bucketId },
    data: updateData
  });
}
import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { getBucketById, updateBucket, deleteBucket } from "@/services/bucket";
import { updateBucketSchema } from "@/schemas/bucket";

type Props = { params: Promise<{ id: string }> };

async function ensureBucketOwnership(bucketId: string, userId: string) {
  const bucket = await prisma.bucket.findUnique({
    where: { id: bucketId },
    include: { workspace: true }
  });

  if (!bucket) throw new AppError("Bucket not found", 404);
  
  if (bucket.workspace.user_id !== userId) {
    throw new AppError("Unauthorized access to this bucket", 403);
  }
  
  return bucket;
}

export async function GET(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    // Verifica segurança antes de buscar
    await ensureBucketOwnership(params.id, userId);

    const bucket = await getBucketById(params.id);

    return handleResponse(bucket);

  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();
    const body = await request.json();

    await ensureBucketOwnership(params.id, userId);

    const data = updateBucketSchema.parse(body);

    const updated = await updateBucket({
      bucketId: params.id,
      ...data
    });

    return handleResponse(updated, {
      message: "Bucket atualizado com sucesso"
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    await ensureBucketOwnership(params.id, userId);

    const deletedBucket = await deleteBucket(params.id);

    return handleResponse(deletedBucket, {
      message: `Bucket ${deletedBucket.name} deletado com sucesso.`
    });

  } catch (error) {
    return handleError(error);
  }
}
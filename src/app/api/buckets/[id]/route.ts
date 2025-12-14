import { NextResponse } from "next/server";
import { getBucketById, updateBucket, deleteBucket } from "@/services/bucket";
import { handleError } from "@/errors/api-handler";
import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(bucket);

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

    const updated = await updateBucket({
      bucketId: params.id,
      name: body.name,
      percentage: body.percentage,
      isDefault: body.isDefault
    });

    return NextResponse.json(updated);

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    await ensureBucketOwnership(params.id, userId);

    await deleteBucket(params.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    return handleError(error);
  }
}
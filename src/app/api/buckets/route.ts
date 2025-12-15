import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { createBucket, listBuckets } from "@/services/bucket";
import { createBucketSchema } from "@/schemas/bucket";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = createBucketSchema.parse(body);

    const workspace = await prisma.workspace.findUnique({
      where: { id: data.workspaceId }
    });

    if (!workspace || workspace.user_id !== userId) {
      throw new AppError("Workspace not found or unauthorized", 404);
    }

    const bucket = await createBucket({
      workspaceId: data.workspaceId,
      name: data.name,
      percentage: data.percentage,
      isDefault: data.isDefault
    });

    return handleResponse(bucket, { 
      status: 201, 
      message: "Bucket criado com sucesso!" 
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      throw new AppError("Workspace ID is required", 400);
    }

    // Segurança: Verifica dono do workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace || workspace.user_id !== userId) {
      throw new AppError("Workspace not found or unauthorized", 404);
    }

    const buckets = await listBuckets(workspaceId);

    return handleResponse(buckets);

  } catch (error) {
    return handleError(error);
  }
}
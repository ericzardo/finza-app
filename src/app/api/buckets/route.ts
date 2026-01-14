import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { createBucket, listBuckets } from "@/services/bucket";
import { createBucketSchema } from "@/schemas/bucket";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = createBucketSchema.parse(body);

    const bucket = await createBucket({
      userId,
      workspaceId: data.workspaceId,
      name: data.name,
      allocationPercentage: data.allocationPercentage,
      isDefault: data.isDefault,
      type: data.type,
      initialBalance: data.initialBalance,
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
       return handleResponse(null, { status: 400, message: "Workspace ID é obrigatório" });
    }

    const validWorkspaceId = z.string().uuid("Formato de ID inválido").parse(workspaceId);

    const buckets = await listBuckets(validWorkspaceId, userId);

    return handleResponse(buckets);

  } catch (error) {
    return handleError(error);
  }
}
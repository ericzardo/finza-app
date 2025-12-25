import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { updateBucket, deleteBucket } from "@/services/bucket";
import { updateBucketSchema } from "@/schemas/bucket";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = updateBucketSchema.parse(body);

    const updated = await updateBucket({
      bucketId: params.id,
      userId,
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

    const result = await deleteBucket(params.id, userId);

    return handleResponse(result, {
      message: "Bucket deletado com sucesso."
    });

  } catch (error) {
    return handleError(error);
  }
}
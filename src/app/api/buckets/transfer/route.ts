import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { transferBalance } from "@/services/bucket";
import { transferBucketSchema } from "@/schemas/bucket";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = transferBucketSchema.parse(body);

    const result = await transferBalance({
      userId,
      sourceBucketId: data.sourceBucketId,
      destinationBucketId: data.destinationBucketId,
      amount: data.amount,
    });

    return handleResponse(result, {
      status: 200,
      message: "Transferência realizada com sucesso!"
    });

  } catch (error) {
    return handleError(error);
  }
}

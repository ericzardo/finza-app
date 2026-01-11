import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { distributeBalance } from "@/services/bucket";
import { distributeBucketSchema } from "@/schemas/bucket";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = distributeBucketSchema.parse(body);

    const result = await distributeBalance({
      userId,
      sourceBucketId: data.sourceBucketId,
      workspaceId: data.workspaceId,
      amount: data.amount,
      targets: data.targets,
    });

    return handleResponse(result, {
      status: 200,
      message: "Saldo distribuído com sucesso!"
    });

  } catch (error) {
    return handleError(error);
  }
}

import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { createTransaction, listTransactions } from "@/services/transaction";
import { createTransactionSchema } from "@/schemas/transactions";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = createTransactionSchema.parse(body);

    const transaction = await createTransaction({
      userId,
      workspaceId: data.workspaceId,
      bucketId: data.bucketId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: data.date ? String(data.date) : undefined 
    });

    return handleResponse(transaction, { 
      status: 201, 
      message: "Transação registrada com sucesso!" 
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: Request) {
  try {
    // Auth Check
    await getCurrentUserId();

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    const validWorkspaceId = z.string().uuid("Workspace ID inválido").parse(workspaceId);
    
    const transactions = await listTransactions(validWorkspaceId);

    return handleResponse(transactions);

  } catch (error) {
    return handleError(error);
  }
}
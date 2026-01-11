import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { importTransactions } from "@/services/transaction";
import { importTransactionSchema } from "@/schemas/transaction";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = importTransactionSchema.parse(body);

    const result = await importTransactions({
      userId,
      workspaceId: data.workspaceId,
      transactions: data.transactions.map(tx => ({
        ...tx,
        date: new Date(tx.date),
      })),
    });

    return handleResponse(result, { 
      status: 200, 
      message: `${result.count} transações importadas com sucesso!` 
    });

  } catch (error) {
    return handleError(error);
  }
}

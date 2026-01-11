import { z } from "zod";
import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { importTransactions } from "@/services/transaction";
import { transactionTypeEnum } from "@/schemas/transaction";

export const dynamic = 'force-dynamic';

const importTransactionSchema = z.object({
  workspaceId: z.string().uuid("ID do workspace inválido"),
  transactions: z.array(
    z.object({
      date: z.coerce.date(),
      description: z.string().min(1, "Descrição é obrigatória"),
      amount: z.number().min(0.01, "Valor deve ser maior que zero"),
      type: transactionTypeEnum,
    })
  ).min(1, "Pelo menos uma transação deve ser fornecida"),
});

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

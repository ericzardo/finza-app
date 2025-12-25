import { Transaction } from "@/types";
import { handleHttpError } from "@/handlers/http-error";
import { CreateTransactionData } from "@/schemas/transaction";

export async function getTransactionsRequest(
  workspaceId: string, 
  signal?: AbortSignal
): Promise<Transaction[]> {
  
  const response = await fetch(`/api/transactions?workspaceId=${workspaceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal, 
  });
  
  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao buscar transações");
  }

  const result = await response.json();
  return result.data || result;
}

export async function createTransactionRequest(data: CreateTransactionData): Promise<Transaction> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao criar transação");
  }

  const result = await response.json();
  return result.data || result;
}
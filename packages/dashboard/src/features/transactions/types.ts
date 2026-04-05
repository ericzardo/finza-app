import type { GetTransactions200 } from "@finza/api-client";

/**
 * Tipo de uma transação retornada pela API.
 */
export type Transaction = GetTransactions200["data"][number];

/**
 * Labels legíveis para tipos de transação.
 */
export const transactionTypeLabels: Record<Transaction["type"], string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
};

/**
 * Labels legíveis para status de pagamento.
 */
export const transactionStatusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
};

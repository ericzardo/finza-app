import { z } from "zod";

export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const transactionFormSchema = z.object({
  workspaceId: z.string().uuid("ID do workspace inválido").optional(),
  bucketId: z.string().nullable().optional(), 
  amount: z.number("Informe um valor numérico").min(0.01, "O valor deve ser maior que zero"),
  type: transactionTypeEnum,
  description: z.string().trim().min(1, "A descrição é obrigatória"),
  date: z.date("Selecione uma data válida"), 
});

export const createTransactionSchema = transactionFormSchema.extend({
  workspaceId: z.string().uuid("ID do workspace inválido"),
  date: z.coerce.date(), 
});

export const updateTransactionSchema = createTransactionSchema
  .omit({ workspaceId: true })
  .partial();

export type TransactionData = z.infer<typeof transactionFormSchema>;
export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type TransactionType = z.infer<typeof transactionTypeEnum>;
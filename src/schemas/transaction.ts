import { z } from "zod";

export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const transactionFormSchema = z.object({
  workspaceId: z.string().uuid("Área de trabalho não identificada.").optional(),
  bucketId: z.string().nullable().optional(), 
  amount: z.number("Informe um valor numérico").min(0.01, "O valor deve ser maior que zero"),
  type: transactionTypeEnum,
  description: z.string().trim().min(1, "A descrição é obrigatória"),
  date: z.date("Selecione uma data válida"),
  isAllocated: z.boolean().default(false).optional(),
});

export const createTransactionSchema = transactionFormSchema.extend({
  workspaceId: z.string().uuid("Área de trabalho não identificada."),
  date: z.coerce.date(), 
});

export const updateTransactionSchema = createTransactionSchema
  .omit({ workspaceId: true })
  .partial();

export const filterTransactionSchema = z.object({
  bucketId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  type: transactionTypeEnum.optional(),
});

export type TransactionData = z.infer<typeof transactionFormSchema>;
export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type FilterTransactionData = z.infer<typeof filterTransactionSchema>;
export type TransactionType = z.infer<typeof transactionTypeEnum>;

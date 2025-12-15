import { z } from "zod";

export const createTransactionSchema = z.object({
  workspaceId: z.string().uuid("ID do workspace inválido"),
  bucketId: z.string().uuid("ID do bucket inválido").optional().nullable(),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  type: z.enum(["INCOME", "EXPENSE"], {
    message: "O tipo deve ser INCOME ou EXPENSE", 
  }),
  description: z.string().optional(),
  date: z.string().or(z.date()).optional(),
});

export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
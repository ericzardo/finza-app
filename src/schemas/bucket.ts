import { z } from "zod";

export const createBucketSchema = z.object({
  workspaceId: z.string().uuid("ID do workspace inválido"),
  name: z.string().min(1, "O nome do bucket é obrigatório"),
  percentage: z.coerce.number().min(0).max(100).default(0),
  isDefault: z.boolean().optional().default(false),
});

export const updateBucketSchema = createBucketSchema
  .omit({ workspaceId: true })
  .partial();

export type CreateBucketData = z.infer<typeof createBucketSchema>;
export type UpdateBucketData = z.infer<typeof updateBucketSchema>;
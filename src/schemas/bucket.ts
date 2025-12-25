import { z } from "zod";

const baseBucketSchema = z.object({
  name: z.string().trim().min(1, "O nome do bucket é obrigatório"),
  allocationPercentage: z.number("Informe um número válido")
    .min(0, "A porcentagem deve ser entre 0 e 100")
    .max(100, "A porcentagem deve ser entre 0 e 100"),
  isDefault: z.boolean().default(false).optional(),
});

export const bucketFormSchema = baseBucketSchema;

export const createBucketSchema = baseBucketSchema.extend({
  workspaceId: z.string().uuid("ID do workspace inválido"),
});

export const updateBucketSchema = baseBucketSchema.partial().extend({});

export type BucketData = z.infer<typeof bucketFormSchema>;
export type CreateBucketData = z.infer<typeof createBucketSchema>;
export type UpdateBucketData = z.infer<typeof updateBucketSchema>;
import { z } from "zod";

export const bucketTypeEnum = z.enum(["SPENDING", "INVESTMENT", "INBOX"]);

const baseBucketSchema = z.object({
  name: z.string().trim().min(1, "O nome do bucket é obrigatório"),
  
  allocationPercentage: z.number("Informe um número válido")
    .min(0, "A porcentagem deve ser entre 0 e 100")
    .max(100, "A porcentagem deve ser entre 0 e 100"),
  isDefault: z.boolean(),
  type: bucketTypeEnum,
});

export const bucketFormSchema = baseBucketSchema;

export const createBucketSchema = baseBucketSchema.extend({
  workspaceId: z.string().uuid("Área de trabalho não identificada."),
});

export const updateBucketSchema = baseBucketSchema.partial().extend({});

export const transferBucketSchema = z.object({
  sourceBucketId: z.string().uuid("Erro na origem. Tente recarregar a página."),
  destinationBucketId: z.string().uuid("Selecione um caixa válido para o destino."),
  amount: z.number().positive("O valor deve ser positivo").min(0.01, "O valor deve ser maior que zero"),
});

export const distributeBucketSchema = z.object({
  sourceBucketId: z.string().uuid("Bucket de origem inválido"),
  workspaceId: z.string().uuid("Workspace inválido"),
  amount: z.number().positive("O valor deve ser positivo").min(0.01, "O valor deve ser maior que zero"),
  targets: z.array(z.object({
    bucketId: z.string().uuid("Bucket de destino inválido"),
    value: z.number().min(0, "O valor deve ser positivo"),
    isPercentage: z.boolean(),
  })).optional(), // Se não for passado, usa modo automático
});

export type BucketData = z.infer<typeof bucketFormSchema>;
export type CreateBucketData = z.infer<typeof createBucketSchema>;
export type UpdateBucketData = z.infer<typeof updateBucketSchema>;
export type TransferBucketData = z.infer<typeof transferBucketSchema>;
export type DistributeBucketData = z.infer<typeof distributeBucketSchema>;
export type BucketType = z.infer<typeof bucketTypeEnum>;

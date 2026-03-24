import { z } from 'zod';

export const bucketItemSchema = z.object({
  id: z.string().describe('ID do caixa'),
  workspace_id: z.string().describe('ID do workspace'),
  name: z.string().describe('Nome do caixa'),
  type: z.enum(['SPENDING', 'INVESTMENT', 'INBOX']).describe('Tipo do caixa'),
  allocation_percentage: z.number().describe('Percentual de alocação (0-100)'),
  is_default: z.boolean().describe('Indica se é o caixa padrão (INBOX)'),
  created_at: z.string().datetime().describe('Data de criação'),
});

export const createBucketBodySchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do caixa é obrigatório')
    .max(100, 'O nome do caixa deve ter no máximo 100 caracteres')
    .describe('Nome do caixa'),
  type: z
    .enum(['SPENDING', 'INVESTMENT'])
    .default('SPENDING')
    .describe('Tipo do caixa'),
  allocation_percentage: z
    .number()
    .min(0, 'O percentual deve ser no mínimo 0')
    .max(100, 'O percentual deve ser no máximo 100')
    .default(0)
    .describe('Percentual de alocação (0-100)'),
});

export const createBucketResponseSchema = bucketItemSchema;

export const listBucketsResponseSchema = z.array(bucketItemSchema);

export const updateBucketParamsSchema = z.object({
  bucketId: z.string().describe('ID do caixa'),
});

export const updateBucketBodySchema = z
  .object({
    name: z
      .string()
      .min(1, 'O nome do caixa é obrigatório')
      .max(100, 'O nome do caixa deve ter no máximo 100 caracteres')
      .optional()
      .describe('Nome do caixa'),
    type: z
      .enum(['SPENDING', 'INVESTMENT'])
      .optional()
      .describe('Tipo do caixa'),
    allocation_percentage: z
      .number()
      .min(0, 'O percentual deve ser no mínimo 0')
      .max(100, 'O percentual deve ser no máximo 100')
      .optional()
      .describe('Percentual de alocação (0-100)'),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.type !== undefined ||
      data.allocation_percentage !== undefined,
    { message: 'Pelo menos um campo deve ser fornecido para atualização' },
  );

export const updateBucketResponseSchema = bucketItemSchema;

export const deleteBucketParamsSchema = z.object({
  bucketId: z.string().describe('ID do caixa'),
});

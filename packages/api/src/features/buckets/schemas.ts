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

export const listBucketsQuerySchema = z.object({
  startDate: z
    .string()
    .date({ message: 'startDate deve ser uma data no formato YYYY-MM-DD' })
    .optional()
    .describe('Data de início do período (YYYY-MM-DD)'),
  endDate: z
    .string()
    .date({ message: 'endDate deve ser uma data no formato YYYY-MM-DD' })
    .optional()
    .describe('Data de fim do período (YYYY-MM-DD)'),
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

const inboxBucketSchema = bucketItemSchema.extend({
  type: z.literal('INBOX'),
  current_amount: z
    .number()
    .describe('Montante atual no caixa (receitas − despesas, histórico)'),
  period_income: z
    .number()
    .describe('Total de receitas neste caixa no período'),
  period_spent: z.number().describe('Total de despesas neste caixa no período'),
});

const spendingBucketSchema = bucketItemSchema.extend({
  type: z.literal('SPENDING'),
  current_amount: z
    .number()
    .describe('Montante atual no caixa (receitas − despesas, histórico)'),
  period_allocated: z
    .number()
    .describe('Total de receitas alocadas neste caixa no período'),
  period_spent: z.number().describe('Total de despesas neste caixa no período'),
});

const investmentBucketSchema = bucketItemSchema.extend({
  type: z.literal('INVESTMENT'),
  current_invested: z
    .number()
    .describe('Montante total aportado historicamente'),
  period_target: z
    .number()
    .describe(
      'Meta de aporte no período (receita total do workspace × allocation_percentage)',
    ),
  period_invested: z
    .number()
    .describe('Quanto já foi aportado neste caixa no período'),
});

export const listBucketsResponseSchema = z.array(
  z.discriminatedUnion('type', [
    inboxBucketSchema,
    spendingBucketSchema,
    investmentBucketSchema,
  ]),
);

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

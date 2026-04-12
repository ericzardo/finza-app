import { z } from "zod";

// --- Enums ---

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

// --- POST /transactions ---

export const createTransactionBodySchema = z
	.object({
		type: transactionTypeSchema.describe(
			"Tipo da transação: INCOME (receita), EXPENSE (despesa) ou TRANSFER (transferência)",
		),
		amount: z
			.number()
			.positive("O valor deve ser maior que zero")
			.describe("Valor da transação (positivo, em reais)"),
		description: z
			.string()
			.min(1, "A descrição é obrigatória")
			.max(255, "A descrição deve ter no máximo 255 caracteres")
			.describe("Descrição da transação"),
		date: z.coerce
			.date()
			.describe("Data da transação (aceita YYYY-MM-DD ou ISO 8601)"),
		is_paid: z
			.boolean()
			.default(true)
			.describe(
				"Se verdadeiro, a transação é efetivada e afeta saldos. Se falso, fica como pendente.",
			),
		bucket_id: z
			.string()
			.optional()
			.describe(
				"ID do caixa de propósito. Se omitido, a transação vai para o Caixa de Entrada (INBOX).",
			),
		bank_account_id: z
			.string()
			.optional()
			.describe(
				"ID da conta bancária (débito ou PIX). Mutuamente exclusivo com credit_card_id.",
			),
		credit_card_id: z
			.string()
			.optional()
			.describe(
				"ID do cartão de crédito. Mutuamente exclusivo com bank_account_id.",
			),
		category_id: z.string().optional().describe("ID da categoria da transação"),
	})
	.refine((data) => !(data.bank_account_id && data.credit_card_id), {
		message:
			"Informe apenas conta bancária ou cartão de crédito, não ambos simultaneamente",
		path: ["bank_account_id"],
	});

export const createTransactionResponseSchema = z.object({
	id: z.string().describe("ID da transação"),
	workspace_id: z.string().describe("ID do workspace"),
	type: transactionTypeSchema.describe("Tipo da transação"),
	amount: z.number().describe("Valor da transação"),
	description: z.string().describe("Descrição da transação"),
	date: z.string().datetime().describe("Data da transação (ISO 8601)"),
	is_paid: z.boolean().describe("Status de pagamento"),
	internal_type: z
		.string()
		.nullable()
		.describe(
			"Tipo da transação interna (CASCADE, DISTRIBUTION, BALANCE_ADJUSTMENT). Null se não interna.",
		),
	transfer_pair_id: z
		.string()
		.nullable()
		.describe("ID que liga o par de transações internas da Cascata"),
	bucket_id: z.string().nullable().describe("ID do caixa de propósito"),
	bank_account_id: z.string().nullable().describe("ID da conta bancária"),
	credit_card_id: z.string().nullable().describe("ID do cartão de crédito"),
	category_id: z.string().nullable().describe("ID da categoria"),
	created_at: z.string().datetime().describe("Data de criação do registro"),
});

// --- GET /transactions ---

export const listTransactionsQuerySchema = z.object({
	startDate: z.coerce
		.date()
		.optional()
		.describe("Início do período de filtro (YYYY-MM-DD ou ISO 8601)"),
	endDate: z.coerce
		.date()
		.optional()
		.describe("Fim do período de filtro (YYYY-MM-DD ou ISO 8601)"),
	bucketId: z
		.string()
		.optional()
		.describe("Filtrar por ID do caixa de propósito"),
	isPaid: z.coerce
		.boolean()
		.optional()
		.describe(
			"Filtrar por status de pagamento (true = pagas, false = pendentes)",
		),
	type: transactionTypeSchema
		.optional()
		.describe("Filtrar por tipo de transação"),
	page: z.coerce
		.number()
		.int()
		.positive()
		.default(1)
		.describe("Número da página para paginação"),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(100, "O limite máximo por página é 100")
		.default(20)
		.describe("Quantidade de itens por página (máx. 100)"),
});

const transactionItemSchema = z.object({
	id: z.string(),
	workspace_id: z.string(),
	type: transactionTypeSchema,
	amount: z.number(),
	description: z.string(),
	date: z.string().datetime(),
	is_paid: z.boolean(),
	internal_type: z.string().nullable(),
	transfer_pair_id: z.string().nullable(),
	bucket_id: z.string().nullable(),
	bank_account_id: z.string().nullable(),
	credit_card_id: z.string().nullable(),
	category_id: z.string().nullable(),
	created_at: z.string().datetime(),
});

export const deleteTransactionParamsSchema = z.object({
	transactionId: z.string().describe("ID da transação a ser deletada"),
});

export const listTransactionsResponseSchema = z.object({
	data: z.array(transactionItemSchema).describe("Lista de transações"),
	total: z
		.number()
		.describe("Total de transações que correspondem aos filtros"),
	page: z.number().describe("Página atual"),
	limit: z.number().describe("Itens por página"),
});

// --- GET /transactions/internal ---

export const internalTransactionTypeSchema = z.enum([
	"CASCADE",
	"DISTRIBUTION",
	"BALANCE_ADJUSTMENT",
]);

const internalTransactionEntrySchema = z.object({
	id: z
		.string()
		.describe(
			"ID da entrada (transfer_pair_id para pares, transaction id para solo)",
		),
	internal_type: internalTransactionTypeSchema.describe(
		"Tipo da transação interna",
	),
	date: z.string().datetime().describe("Data da transação interna (ISO 8601)"),
	amount: z.number().describe("Valor da transação"),
	description: z.string().nullable().describe("Descrição da transação"),
	transfer_pair_id: z
		.string()
		.nullable()
		.describe("ID do par (null para transações solo como BALANCE_ADJUSTMENT)"),
	from_bucket_name: z
		.string()
		.nullable()
		.describe("Nome do caixa de origem (null para solo)"),
	to_bucket_name: z
		.string()
		.nullable()
		.describe("Nome do caixa de destino (null para solo)"),
});

export const listInternalTransactionsResponseSchema = z.object({
	data: z
		.array(internalTransactionEntrySchema)
		.describe("Lista de transações internas"),
	meta: z.object({
		total: z
			.number()
			.describe("Total de entradas que correspondem aos filtros"),
		page: z.number().describe("Página atual"),
		limit: z.number().describe("Itens por página"),
	}),
});

export const listInternalTransactionsQuerySchema = z.object({
	startDate: z.coerce
		.date()
		.optional()
		.describe("Início do período de filtro (YYYY-MM-DD ou ISO 8601)"),
	endDate: z.coerce
		.date()
		.optional()
		.describe("Fim do período de filtro (YYYY-MM-DD ou ISO 8601)"),
	page: z.coerce
		.number()
		.int()
		.positive()
		.default(1)
		.describe("Número da página para paginação"),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(100, "O limite máximo por página é 100")
		.default(20)
		.describe("Quantidade de itens por página (máx. 100)"),
});

// --- PATCH /transactions/:transactionId ---

export const updateTransactionParamsSchema = z.object({
	transactionId: z.string().describe("ID da transação a ser atualizada"),
});

export const updateTransactionBodySchema = z
	.object({
		type: transactionTypeSchema
			.optional()
			.describe("Tipo da transação: INCOME, EXPENSE ou TRANSFER"),
		amount: z
			.number()
			.positive("O valor deve ser maior que zero")
			.optional()
			.describe("Valor da transação (positivo, em reais)"),
		description: z
			.string()
			.min(1, "A descrição é obrigatória")
			.max(255, "A descrição deve ter no máximo 255 caracteres")
			.optional()
			.describe("Descrição da transação"),
		date: z.coerce
			.date()
			.optional()
			.describe("Data da transação (aceita YYYY-MM-DD ou ISO 8601)"),
		is_paid: z
			.boolean()
			.optional()
			.describe("Status de pagamento da transação"),
		bucket_id: z.string().optional().describe("ID do caixa de propósito"),
	})
	.refine(
		(data) =>
			data.type !== undefined ||
			data.amount !== undefined ||
			data.description !== undefined ||
			data.date !== undefined ||
			data.is_paid !== undefined ||
			data.bucket_id !== undefined,
		{ message: "Pelo menos um campo deve ser fornecido para atualização" },
	);

export const updateTransactionResponseSchema = z.object({
	id: z.string().describe("ID da transação"),
	workspace_id: z.string().describe("ID do workspace"),
	type: transactionTypeSchema.describe("Tipo da transação"),
	amount: z.number().describe("Valor da transação"),
	description: z.string().describe("Descrição da transação"),
	date: z.string().datetime().describe("Data da transação (ISO 8601)"),
	is_paid: z.boolean().describe("Status de pagamento"),
	internal_type: z
		.string()
		.nullable()
		.describe(
			"Tipo da transação interna (CASCADE, DISTRIBUTION, BALANCE_ADJUSTMENT). Null se não interna.",
		),
	transfer_pair_id: z
		.string()
		.nullable()
		.describe("ID que liga o par de transações internas da Cascata"),
	bucket_id: z.string().nullable().describe("ID do caixa de propósito"),
	bank_account_id: z.string().nullable().describe("ID da conta bancária"),
	credit_card_id: z.string().nullable().describe("ID do cartão de crédito"),
	category_id: z.string().nullable().describe("ID da categoria"),
	created_at: z.string().datetime().describe("Data de criação do registro"),
});

// --- POST /transactions/import/preview ---

export const importFormatSchema = z.enum(["OFX", "NUBANK_CSV", "INTER_CSV"]);

export const previewTransactionSchema = z.object({
	date: z.string().datetime().describe("Data da transação (ISO 8601)"),
	amount: z.number().describe("Valor absoluto em BRL (float, sempre positivo)"),
	description: z.string().describe("Descrição original da transação"),
	type: z
		.enum(["INCOME", "EXPENSE"])
		.describe("Tipo inferido pelo sinal do valor"),
});

export const importPreviewResponseSchema = z.object({
	format: importFormatSchema.describe("Formato detectado do arquivo"),
	transactions: z
		.array(previewTransactionSchema)
		.describe("Transações parseadas do arquivo"),
	count: z.number().describe("Total de transações encontradas"),
	extractedBalance: z
		.number()
		.nullable()
		.describe("Saldo extraído dos metadados do arquivo (null se indisponível)"),
});

// --- POST /transactions/import/confirm ---

// --- Distribution Schemas ---

export const distributionParamsSchema = z.object({
	transactionId: z.string().describe("ID da transação a consultar/distribuir"),
});

export const deleteDistributionParamsSchema = z.object({
	transactionId: z.string().describe("ID da transação origem"),
	allocationId: z.string().describe("ID da alocação a ser deletada"),
});

const allocationItemSchema = z.object({
	id: z.string().describe("ID da alocação"),
	transaction_id: z.string().describe("ID da transação origem"),
	bucket_id: z.string().describe("ID do caixa destino"),
	amount: z.number().describe("Valor alocado"),
	allocation_type: z.string().describe("Tipo da alocação (DISTRIBUTION)"),
	transfer_pair_id: z
		.string()
		.nullable()
		.describe("ID do par de transações internas"),
});

export const getDistributionsResponseSchema = z.object({
	total: z.number().describe("Valor total da transação"),
	distributed: z.number().describe("Total já distribuído"),
	available: z.number().describe("Saldo disponível para distribuição"),
	allocations: z
		.array(allocationItemSchema)
		.describe("Lista de alocações existentes"),
});

export const createDistributionBodySchema = z.object({
	distributions: z
		.array(
			z.object({
				bucketId: z.string().describe("ID do caixa destino"),
				amount: z
					.number()
					.positive("O valor deve ser maior que zero")
					.describe("Valor a distribuir"),
			}),
		)
		.min(1, "Envie ao menos uma distribuição"),
});

export const createDistributionResponseSchema = z.object({
	allocations: z.array(allocationItemSchema).describe("Alocações criadas"),
	available: z.number().describe("Saldo disponível atualizado"),
});

// --- POST /transactions/import/confirm ---

export const importConfirmItemSchema = z.object({
	date: z.coerce.date().describe("Data da transação"),
	amount: z
		.number()
		.positive("O valor deve ser maior que zero")
		.describe("Valor absoluto da transação"),
	description: z
		.string()
		.min(1, "A descrição é obrigatória")
		.describe("Descrição da transação"),
	type: z
		.enum(["INCOME", "EXPENSE"])
		.describe("Tipo da transação: INCOME ou EXPENSE"),
});

export const importConfirmBodySchema = z.object({
	transactions: z
		.array(importConfirmItemSchema)
		.min(1, "Envie ao menos uma transação")
		.describe("Transações aprovadas pelo usuário"),
	balanceAdjustment: z
		.number()
		.optional()
		.describe(
			"Saldo alvo para ajuste. Se fornecido, cria transação de ajuste.",
		),
});

export const importConfirmResponseSchema = z.object({
	imported: z.number().describe("Transações efetivamente importadas"),
	duplicates: z.number().describe("Transações ignoradas por duplicidade"),
	total: z.number().describe("Total recebido no request"),
});

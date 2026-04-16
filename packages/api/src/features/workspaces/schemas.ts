import { z } from "zod";

export const workspaceItemSchema = z.object({
	id: z.string().describe("ID do workspace"),
	name: z.string().describe("Nome do workspace"),
	currency: z.string().describe("Moeda do workspace"),
	totalBalance: z.number().describe("Saldo total do workspace"),
	role: z
		.enum(["OWNER", "EDITOR", "VIEWER"])
		.describe("Papel do usuário no workspace"),
	created_at: z.string().datetime().describe("Data de criação do workspace"),
});

export const listWorkspacesResponseSchema = z.array(workspaceItemSchema);

export const createWorkspaceBodySchema = z.object({
	name: z
		.string()
		.min(1, "O nome do workspace é obrigatório")
		.max(100, "O nome do workspace deve ter no máximo 100 caracteres")
		.describe("Nome do workspace"),
	currency: z
		.string()
		.length(3, "A moeda deve ter exatamente 3 caracteres")
		.default("BRL")
		.describe("Código da moeda (ex: BRL, USD)"),
});

export const createWorkspaceResponseSchema = workspaceItemSchema;

// GET /workspaces/:workspaceId
export const getWorkspaceParamsSchema = z.object({
	workspaceId: z.string().describe("ID do workspace"),
});

export const getWorkspaceResponseSchema = z.object({
	id: z.string().describe("ID do workspace"),
	name: z.string().describe("Nome do workspace"),
	currency: z.string().describe("Moeda do workspace"),
	role: z
		.enum(["OWNER", "EDITOR", "VIEWER"])
		.describe("Papel do usuário no workspace"),
	created_at: z.string().datetime().describe("Data de criação do workspace"),
});

// GET /workspaces/:workspaceId/summary
export const getWorkspaceSummaryParamsSchema = z.object({
	workspaceId: z.string().describe("ID do workspace"),
});

const bucketDistributionItemSchema = z.object({
	bucketId: z.string().describe("ID do caixa"),
	bucketName: z.string().describe("Nome do caixa"),
	bucketType: z.string().describe("Tipo do caixa"),
	amount: z
		.number()
		.describe(
			"Saldo real all-time do caixa (receitas + entradas internas − despesas − saídas internas)",
		),
	percentage: z.number().describe("Percentual do total"),
});

export const getWorkspaceSummaryResponseSchema = z.object({
	totalBalance: z
		.number()
		.describe(
			"Patrimônio total all-time (receitas pagas − despesas pagas, excluindo transferências internas)",
		),
	currentBalance: z
		.number()
		.describe(
			"Saldo atual all-time do workspace (equivalente ao patrimônio global vigente)",
		),
	maxBalance: z.number().describe("Maior saldo histórico all-time atingido"),
	totalInvested: z
		.number()
		.describe("Saldo total all-time alocado em buckets do tipo INVESTMENT"),
	pendingBalance: z
		.number()
		.describe(
			"Soma all-time do valor absoluto de todas as transações com is_paid = false vencidas até hoje",
		),
	distribution: z
		.array(bucketDistributionItemSchema)
		.describe("Distribuição all-time do saldo atual por caixas de propósitos"),
});

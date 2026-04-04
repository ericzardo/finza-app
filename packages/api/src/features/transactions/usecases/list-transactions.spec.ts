import { describe, expect, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { listTransactions } from "./list-transactions";

const now = new Date("2026-01-15T10:00:00.000Z");

function makeTxn(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		id: "txn-1",
		workspace_id: "ws-id",
		type: "EXPENSE" as const,
		amount: { toNumber: () => 50, valueOf: () => 50 } as unknown as number,
		description: "Café",
		date: now,
		is_paid: true,
		bucket_id: "bucket-id",
		bank_account_id: null,
		credit_card_id: null,
		category_id: null,
		invoice_id: null,
		transaction_pattern_id: null,
		installment_number: null,
		canceled_at: null,
		canceled_by: null,
		cancellation_reason: null,
		created_at: now,
		updated_at: now,
		...overrides,
	};
}

function buildDb(
	transactions: ReturnType<typeof makeTxn>[],
	total: number,
	capturedWhere?: { ref: unknown },
) {
	return {
		transaction: {
			findMany: async ({ where }: { where: unknown }) => {
				if (capturedWhere) capturedWhere.ref = where;
				return transactions;
			},
			count: async () => total,
		},
	} as unknown as PrismaClient;
}

describe("listTransactions", () => {
	test("retorna lista com paginação padrão", async () => {
		const txns = [makeTxn(), makeTxn({ id: "txn-2" })];
		const db = buildDb(txns, 2);

		const result = await listTransactions(db, {
			workspaceId: "ws-id",
			page: 1,
			limit: 20,
		});

		expect(result.data).toHaveLength(2);
		expect(result.total).toBe(2);
		expect(result.page).toBe(1);
		expect(result.limit).toBe(20);
	});

	test("serializa amount como number", async () => {
		const db = buildDb([makeTxn()], 1);
		const result = await listTransactions(db, {
			workspaceId: "ws-id",
			page: 1,
			limit: 20,
		});

		expect(typeof result.data[0].amount).toBe("number");
		expect(result.data[0].amount).toBe(50);
	});

	test("retorna lista vazia quando não há transações", async () => {
		const db = buildDb([], 0);
		const result = await listTransactions(db, {
			workspaceId: "ws-id",
			page: 1,
			limit: 20,
		});

		expect(result.data).toHaveLength(0);
		expect(result.total).toBe(0);
	});

	test("aplica filtro isPaid no where passado ao Prisma", async () => {
		const capturedWhere = { ref: null as unknown };
		const db = buildDb([makeTxn({ is_paid: false })], 1, capturedWhere);

		await listTransactions(db, {
			workspaceId: "ws-id",
			isPaid: false,
			page: 1,
			limit: 20,
		});

		expect((capturedWhere.ref as Record<string, unknown>).is_paid).toBe(false);
	});

	test("aplica filtro type no where passado ao Prisma", async () => {
		const capturedWhere = { ref: null as unknown };
		const db = buildDb([makeTxn()], 1, capturedWhere);

		await listTransactions(db, {
			workspaceId: "ws-id",
			type: "INCOME",
			page: 1,
			limit: 20,
		});

		expect((capturedWhere.ref as Record<string, unknown>).type).toBe("INCOME");
	});

	test("aplica filtros de data no where passado ao Prisma", async () => {
		const capturedWhere = { ref: null as unknown };
		const db = buildDb([], 0, capturedWhere);
		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		await listTransactions(db, {
			workspaceId: "ws-id",
			startDate,
			endDate,
			page: 1,
			limit: 20,
		});

		const where = capturedWhere.ref as Record<string, unknown>;
		expect((where.date as Record<string, unknown>).gte).toBe(startDate);
		expect((where.date as Record<string, unknown>).lte).toBe(endDate);
	});

	test("aplica filtro bucketId no where passado ao Prisma", async () => {
		const capturedWhere = { ref: null as unknown };
		const db = buildDb([], 0, capturedWhere);

		await listTransactions(db, {
			workspaceId: "ws-id",
			bucketId: "bucket-abc",
			page: 1,
			limit: 20,
		});

		expect((capturedWhere.ref as Record<string, unknown>).bucket_id).toBe(
			"bucket-abc",
		);
	});
});

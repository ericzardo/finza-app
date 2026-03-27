import { describe, expect, test } from "bun:test";
import type { BucketType, PrismaClient } from "@prisma/client";
import { listBuckets } from "./list-buckets";

type MockBucket = {
	id: string;
	workspace_id: string;
	name: string;
	type: BucketType;
	allocation_percentage: number;
	is_default: boolean;
	created_at: Date;
	updated_at: Date;
};

type GroupByRow = {
	bucket_id: string | null;
	type?: string;
	_sum: { amount: number | null };
};

type AggregateResult = {
	_sum: { amount: number | null };
};

function buildDb(
	buckets: MockBucket[] = [],
	groupByRows: GroupByRow[] = [],
	aggregateResult: AggregateResult = { _sum: { amount: null } },
	periodGroupByRows: GroupByRow[] = [],
	investmentHistoricalRows: GroupByRow[] = [],
	workspaceIncomeResult: AggregateResult = { _sum: { amount: null } },
) {
	const db = {
		bucket: {
			findMany: async () => buckets,
		},
		transaction: {
			groupBy: async (args: {
				by: string[];
				where?: Record<string, unknown>;
				_sum?: Record<string, boolean>;
			}) => {
				const where = args.where ?? {};
				const bucketIds = (where.bucket_id as { in?: string[] } | undefined)
					?.in;

				// INVESTMENT historical (no date filter, type = EXPENSE, no 'type' in by)
				if (
					bucketIds &&
					(where.type as string | undefined) === "EXPENSE" &&
					!args.by.includes("type") &&
					!(where.date as unknown)
				) {
					return investmentHistoricalRows.filter(
						(r) => bucketIds.includes(r.bucket_id ?? "") ?? false,
					);
				}

				// INVESTMENT period (date filter, type = EXPENSE, by bucket_id only)
				if (
					bucketIds &&
					(where.type as string | undefined) === "EXPENSE" &&
					!args.by.includes("type") &&
					where.date
				) {
					return periodGroupByRows.filter(
						(r) => bucketIds.includes(r.bucket_id ?? "") ?? false,
					);
				}

				// SPENDING groupBy (by bucket_id + type, no date filter)
				if (args.by.includes("type") && bucketIds && !where.date) {
					return groupByRows.filter(
						(r) => bucketIds.includes(r.bucket_id ?? "") ?? false,
					);
				}

				// SPENDING period groupBy (by bucket_id + type, with date filter)
				if (args.by.includes("type") && bucketIds && where.date) {
					return periodGroupByRows.filter(
						(r) => bucketIds.includes(r.bucket_id ?? "") ?? false,
					);
				}

				return [];
			},
			aggregate: async (args: { where?: Record<string, unknown> }) => {
				const where = args.where ?? {};
				// workspace income aggregate (no bucket_id filter, has workspace_id)
				if (where.workspace_id) {
					return workspaceIncomeResult;
				}
				return aggregateResult;
			},
		},
	} as unknown as PrismaClient;

	return { db };
}

describe("listBuckets", () => {
	test("retorna caixa INBOX sem campos de agregação", async () => {
		const now = new Date();

		const mockBuckets: MockBucket[] = [
			{
				id: "inbox-id",
				workspace_id: "ws-id",
				name: "Caixa de Entrada",
				type: "INBOX",
				allocation_percentage: 0,
				is_default: true,
				created_at: now,
				updated_at: now,
			},
		];

		const { db } = buildDb(mockBuckets);
		const result = await listBuckets(db, { workspaceId: "ws-id" });

		expect(result).toHaveLength(1);
		const inbox = result[0];
		expect(inbox.type).toBe("INBOX");
		expect(inbox.id).toBe("inbox-id");
		expect(inbox.name).toBe("Caixa de Entrada");
		expect(inbox.is_default).toBe(true);
		expect("current_amount" in inbox).toBe(false);
	});

	test("retorna caixa SPENDING com campos de agregação financeira", async () => {
		const now = new Date();

		const mockBuckets: MockBucket[] = [
			{
				id: "spending-id",
				workspace_id: "ws-id",
				name: "Lazer",
				type: "SPENDING",
				allocation_percentage: 20,
				is_default: false,
				created_at: now,
				updated_at: now,
			},
		];

		// Histórico: 1000 income, 600 expense → current_amount = 400
		const groupByRows: GroupByRow[] = [
			{ bucket_id: "spending-id", type: "INCOME", _sum: { amount: 1000 } },
			{ bucket_id: "spending-id", type: "EXPENSE", _sum: { amount: 600 } },
		];

		// Período: 300 income, 250 expense
		const periodGroupByRows: GroupByRow[] = [
			{ bucket_id: "spending-id", type: "INCOME", _sum: { amount: 300 } },
			{ bucket_id: "spending-id", type: "EXPENSE", _sum: { amount: 250 } },
		];

		const startDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			1,
		).toISOString();
		const endDate = new Date().toISOString();

		const { db } = buildDb(
			mockBuckets,
			groupByRows,
			{ _sum: { amount: null } },
			periodGroupByRows,
		);
		const result = await listBuckets(db, {
			workspaceId: "ws-id",
			startDate,
			endDate,
		});

		expect(result).toHaveLength(1);
		const bucket = result[0];
		expect(bucket.type).toBe("SPENDING");
		if (bucket.type === "SPENDING") {
			expect(bucket.current_amount).toBe(400);
			expect(bucket.period_allocated).toBe(300);
			expect(bucket.period_spent).toBe(250);
		}
	});

	test("retorna caixa INVESTMENT com campos de agregação financeira", async () => {
		const now = new Date();

		const mockBuckets: MockBucket[] = [
			{
				id: "invest-id",
				workspace_id: "ws-id",
				name: "Reserva",
				type: "INVESTMENT",
				allocation_percentage: 10,
				is_default: false,
				created_at: now,
				updated_at: now,
			},
		];

		const investmentHistoricalRows: GroupByRow[] = [
			{ bucket_id: "invest-id", _sum: { amount: 5000 } },
		];

		const investmentPeriodRows: GroupByRow[] = [
			{ bucket_id: "invest-id", _sum: { amount: 500 } },
		];

		// workspace income no período: 2000 → period_target = 2000 * 0.10 = 200
		const workspaceIncomeResult: AggregateResult = {
			_sum: { amount: 2000 },
		};

		const startDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			1,
		).toISOString();
		const endDate = new Date().toISOString();

		const { db } = buildDb(
			mockBuckets,
			[],
			{ _sum: { amount: null } },
			investmentPeriodRows,
			investmentHistoricalRows,
			workspaceIncomeResult,
		);
		const result = await listBuckets(db, {
			workspaceId: "ws-id",
			startDate,
			endDate,
		});

		expect(result).toHaveLength(1);
		const bucket = result[0];
		expect(bucket.type).toBe("INVESTMENT");
		if (bucket.type === "INVESTMENT") {
			expect(bucket.current_invested).toBe(5000);
			expect(bucket.period_target).toBe(200);
			expect(bucket.period_invested).toBe(500);
		}
	});

	test("retorna lista vazia quando não há buckets", async () => {
		const { db } = buildDb([]);
		const result = await listBuckets(db, { workspaceId: "ws-id" });

		expect(result).toEqual([]);
	});

	test("funciona sem filtro de datas (sem agregação de período)", async () => {
		const now = new Date();

		const mockBuckets: MockBucket[] = [
			{
				id: "inbox-id",
				workspace_id: "ws-id",
				name: "Caixa de Entrada",
				type: "INBOX",
				allocation_percentage: 0,
				is_default: true,
				created_at: now,
				updated_at: now,
			},
		];

		const { db } = buildDb(mockBuckets);
		const result = await listBuckets(db, { workspaceId: "ws-id" });

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe("INBOX");
	});
});

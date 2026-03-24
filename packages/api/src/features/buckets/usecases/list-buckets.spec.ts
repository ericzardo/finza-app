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

function buildDb(buckets: MockBucket[] = []) {
	const db = {
		bucket: {
			findMany: async () => buckets,
		},
	} as unknown as PrismaClient;

	return { db };
}

describe("listBuckets", () => {
	test("lista buckets do workspace", async () => {
		const now = new Date();

		const mockBuckets: MockBucket[] = [
			{
				id: "inbox-id",
				workspace_id: "ws-id",
				name: "INBOX",
				type: "INBOX",
				allocation_percentage: 0,
				is_default: true,
				created_at: now,
				updated_at: now,
			},
			{
				id: "bucket-id",
				workspace_id: "ws-id",
				name: "Lazer",
				type: "SPENDING",
				allocation_percentage: 20,
				is_default: false,
				created_at: new Date(now.getTime() + 1000),
				updated_at: new Date(now.getTime() + 1000),
			},
		];

		const { db } = buildDb(mockBuckets);
		const result = await listBuckets(db, { workspaceId: "ws-id" });

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe("inbox-id");
		expect(result[0].name).toBe("INBOX");
		expect(result[0].is_default).toBe(true);
		expect(result[1].id).toBe("bucket-id");
		expect(result[1].name).toBe("Lazer");
		expect(result[1].allocation_percentage).toBe(20);
	});

	test("retorna lista vazia quando não há buckets", async () => {
		const { db } = buildDb([]);
		const result = await listBuckets(db, { workspaceId: "ws-id" });

		expect(result).toEqual([]);
	});
});

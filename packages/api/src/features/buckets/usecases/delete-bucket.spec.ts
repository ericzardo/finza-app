import { describe, expect, test } from "bun:test";
import { ErrorCode } from "@errors/app-error";
import type { BucketType, PrismaClient } from "@prisma/client";
import { deleteBucket } from "./delete-bucket";

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

interface BuildDbOptions {
	existing?: MockBucket | null;
}

function buildDb(options: BuildDbOptions = {}) {
	const now = new Date();

	const defaultBucket: MockBucket = {
		id: "bucket-id",
		workspace_id: "ws-id",
		name: "Lazer",
		type: "SPENDING",
		allocation_percentage: 20,
		is_default: false,
		created_at: now,
		updated_at: now,
	};

	const existing =
		options.existing !== undefined ? options.existing : defaultBucket;

	const deleteCalls: unknown[] = [];

	const db = {
		bucket: {
			findFirst: async () => existing,
			delete: async (args: { where: { id: string } }) => {
				deleteCalls.push(args);
			},
		},
	} as unknown as PrismaClient;

	return { db, deleteCalls };
}

describe("deleteBucket", () => {
	test("deleta bucket com sucesso", async () => {
		const { db, deleteCalls } = buildDb();

		await deleteBucket(db, { workspaceId: "ws-id", bucketId: "bucket-id" });

		expect(deleteCalls).toHaveLength(1);
	});

	test("lança NOT_FOUND quando bucket não existe no workspace", async () => {
		const { db } = buildDb({ existing: null });

		expect(
			deleteBucket(db, {
				workspaceId: "ws-id",
				bucketId: "nonexistent-id",
			}),
		).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
	});

	test("lança FORBIDDEN ao tentar deletar o caixa INBOX", async () => {
		const now = new Date();
		const { db } = buildDb({
			existing: {
				id: "inbox-id",
				workspace_id: "ws-id",
				name: "INBOX",
				type: "INBOX",
				allocation_percentage: 0,
				is_default: true,
				created_at: now,
				updated_at: now,
			},
		});

		expect(
			deleteBucket(db, {
				workspaceId: "ws-id",
				bucketId: "inbox-id",
			}),
		).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
	});
});

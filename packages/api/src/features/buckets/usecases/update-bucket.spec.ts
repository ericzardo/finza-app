import { describe, expect, test } from "bun:test";
import { ErrorCode } from "@errors/app-error";
import type { BucketType, PrismaClient } from "@prisma/client";
import { updateBucket } from "./update-bucket";

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

	const updateCalls: unknown[] = [];

	const db = {
		bucket: {
			findFirst: async () => existing,
			update: async (args: {
				where: { id: string };
				data: Partial<MockBucket>;
			}) => {
				updateCalls.push(args);
				const patch = Object.fromEntries(
					Object.entries(args.data).filter(([, v]) => v !== undefined),
				);
				return {
					...(existing as MockBucket),
					...patch,
					updated_at: new Date(),
				};
			},
		},
	} as unknown as PrismaClient;

	return { db, updateCalls, now };
}

describe("updateBucket", () => {
	test("atualiza bucket com sucesso", async () => {
		const { db, updateCalls } = buildDb();

		const result = await updateBucket(db, {
			workspaceId: "ws-id",
			bucketId: "bucket-id",
			name: "Cinema",
		});

		expect(updateCalls).toHaveLength(1);
		expect(result.name).toBe("Cinema");
		expect(result.type).toBe("SPENDING");
	});

	test("lança NOT_FOUND quando bucket não existe no workspace", async () => {
		const { db } = buildDb({ existing: null });

		expect(
			updateBucket(db, {
				workspaceId: "ws-id",
				bucketId: "nonexistent-id",
				name: "Qualquer",
			}),
		).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
	});

	test("lança FORBIDDEN ao tentar editar o caixa INBOX", async () => {
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
			updateBucket(db, {
				workspaceId: "ws-id",
				bucketId: "inbox-id",
				name: "Renomeado",
			}),
		).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
	});
});

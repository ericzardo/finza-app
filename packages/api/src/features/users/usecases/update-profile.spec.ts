import { describe, expect, test } from "bun:test";
import { ErrorCode } from "@errors/app-error";
import type { PrismaClient } from "@prisma/client";
import { updateProfile } from "./update-profile";

type FindUniqueArgs = {
	where: { id?: string; email?: string };
	include?: { plan: boolean };
};
type UpdateArgs = {
	where: { id: string };
	data: Record<string, unknown>;
	include: { plan: boolean };
};

type BuildDbOptions = {
	userExists?: boolean;
	emailTaken?: boolean;
	currentEmail?: string;
	isPrivacyEnabled?: boolean;
};

function buildDb(options: BuildDbOptions = {}) {
	const findUniqueCalls: FindUniqueArgs[] = [];
	const updateCalls: UpdateArgs[] = [];

	const currentEmail = options.currentEmail ?? "user@email.com";

	const baseUser = {
		id: "user-id",
		name: "User Original",
		email: currentEmail,
		avatar_url: "/avatars/1.webp",
		is_privacy_enabled: options.isPrivacyEnabled ?? false,
		email_verified_at: new Date("2025-01-01T00:00:00.000Z"),
		plan: { slug: "beta" },
	};

	const db = {
		user: {
			findUnique: async (args: FindUniqueArgs) => {
				findUniqueCalls.push(args);

				if (args.where.id) {
					return options.userExists === false ? null : baseUser;
				}

				if (args.where.email) {
					return options.emailTaken ? { id: "other-user-id" } : null;
				}

				return null;
			},
			update: async (args: UpdateArgs) => {
				updateCalls.push(args);
				return {
					...baseUser,
					...args.data,
					plan: baseUser.plan,
					email_verified_at:
						args.data.email_verified_at === null
							? null
							: baseUser.email_verified_at,
				};
			},
		},
	} as unknown as PrismaClient;

	return { db, findUniqueCalls, updateCalls };
}

describe("updateProfile", () => {
	test("atualiza o nome do usuário", async () => {
		const { db, updateCalls } = buildDb();

		const result = await updateProfile(db, "user-id", { name: "Novo Nome" });

		expect(updateCalls).toHaveLength(1);
		expect(updateCalls[0].data.name).toBe("Novo Nome");
		expect(result.name).toBe("Novo Nome");
		expect(result.email).toBe("user@email.com");
	});

	test("atualiza o avatar_url do usuário", async () => {
		const { db, updateCalls } = buildDb();

		const result = await updateProfile(db, "user-id", {
			avatar_url: "https://example.com/avatar.png",
		});

		expect(updateCalls).toHaveLength(1);
		expect(updateCalls[0].data.avatar_url).toBe(
			"https://example.com/avatar.png",
		);
		expect(result.avatar_url).toBe("https://example.com/avatar.png");
	});

	test("atualiza o email e reseta email_verified_at", async () => {
		const { db, updateCalls } = buildDb();

		const result = await updateProfile(db, "user-id", {
			email: "novo@email.com",
		});

		expect(updateCalls).toHaveLength(1);
		expect(updateCalls[0].data.email).toBe("novo@email.com");
		expect(updateCalls[0].data.email_verified_at).toBeNull();
		expect(result.email_verified_at).toBeNull();
	});

	test("não reseta email_verified_at quando email é o mesmo", async () => {
		const { db, updateCalls } = buildDb({ currentEmail: "user@email.com" });

		await updateProfile(db, "user-id", { email: "user@email.com" });

		expect(updateCalls).toHaveLength(1);
		expect(updateCalls[0].data.email).toBeUndefined();
		expect(updateCalls[0].data.email_verified_at).toBeUndefined();
	});

	test("lança CONFLICT quando novo email já está em uso", async () => {
		const { db } = buildDb({ emailTaken: true });

		await expect(
			updateProfile(db, "user-id", { email: "taken@email.com" }),
		).rejects.toMatchObject({
			code: ErrorCode.CONFLICT,
			statusCode: 409,
		});
	});

	test("lança NOT_FOUND quando usuário não existir", async () => {
		const { db } = buildDb({ userExists: false });

		await expect(
			updateProfile(db, "missing", { name: "Test" }),
		).rejects.toMatchObject({
			code: ErrorCode.NOT_FOUND,
			statusCode: 404,
		});
	});

	test("atualiza múltiplos campos ao mesmo tempo", async () => {
		const { db, updateCalls } = buildDb();

		const result = await updateProfile(db, "user-id", {
			name: "Novo Nome",
			avatar_url: "https://example.com/avatar.png",
		});

		expect(updateCalls).toHaveLength(1);
		expect(updateCalls[0].data.name).toBe("Novo Nome");
		expect(updateCalls[0].data.avatar_url).toBe(
			"https://example.com/avatar.png",
		);
		expect(result.plan).toBe("beta");
	});

	test("envia objeto de data vazio quando nenhum campo é informado", async () => {
		const { db, updateCalls } = buildDb();

		await updateProfile(db, "user-id", {});

		expect(updateCalls).toHaveLength(1);
		expect(Object.keys(updateCalls[0].data)).toHaveLength(0);
	});
});

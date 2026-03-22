import { describe, expect, test } from "bun:test";
import { ErrorCode } from "@errors/app-error";
import type { PrismaClient } from "@prisma/client";
import { getProfile } from "./get-profile";

type FindUserArgs = {
	where: { id: string };
	include: { plan: true };
};

type BuildDbOptions = {
	userExists?: boolean;
	hasPlan?: boolean;
	isPrivacyEnabled?: boolean;
};

function buildDb(options: BuildDbOptions = {}) {
	const findUserCalls: FindUserArgs[] = [];

	const db = {
		user: {
			findUnique: async (args: FindUserArgs) => {
				findUserCalls.push(args);

				if (options.userExists === false) {
					return null;
				}

				return {
					id: "user-id",
					name: "User",
					email: "user@email.com",
					avatar_url: "/avatars/1.webp",
					is_privacy_enabled: options.isPrivacyEnabled ?? true,
					email_verified_at: new Date("2025-01-01T00:00:00.000Z"),
					plan: options.hasPlan === false ? null : { slug: "beta" },
				};
			},
		},
	} as unknown as PrismaClient;

	return { db, findUserCalls };
}

describe("getProfile", () => {
	test("retorna os dados do usuário com o plano atual", async () => {
		const { db, findUserCalls } = buildDb();

		const result = await getProfile(db, "user-id");

		expect(findUserCalls).toEqual([
			{ where: { id: "user-id" }, include: { plan: true } },
		]);
		expect(result).toEqual({
			id: "user-id",
			name: "User",
			email: "user@email.com",
			plan: "beta",
			avatar_url: "/avatars/1.webp",
			is_privacy_enabled: true,
			email_verified_at: "2025-01-01T00:00:00.000Z",
		});
	});

	test("retorna plano free quando usuário não possui plano", async () => {
		const { db } = buildDb({ hasPlan: false });

		const result = await getProfile(db, "user-id");

		expect(result.plan).toBe("free");
	});

	test("retorna a flag de privacidade conforme configuracao do usuario", async () => {
		const { db } = buildDb({ isPrivacyEnabled: false });

		const result = await getProfile(db, "user-id");

		expect(result.is_privacy_enabled).toBe(false);
	});

	test("lança NOT_FOUND quando usuário não existir", async () => {
		const { db } = buildDb({ userExists: false });

		await expect(getProfile(db, "missing")).rejects.toMatchObject({
			code: ErrorCode.NOT_FOUND,
			statusCode: 404,
		});
	});
});

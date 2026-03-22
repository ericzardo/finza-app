import { describe, expect, test } from "bun:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { FastifyInstance } from "fastify";
import env from "@env";
import { ErrorCode } from "@errors/app-error";
import { setupTestServer } from "@utils/test-setup";
import { changePasswordResponseSchema } from "./schemas";

const COOKIE_NAME = "finza_token";

function uniqueEmail(prefix: string) {
	return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

function buildAuthCookie(user: { id: string; email: string }) {
	const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
		expiresIn: "7d",
	});

	return {
		[COOKIE_NAME]: token,
	};
}

async function ensureBetaPlan(server: FastifyInstance) {
	return server.prisma.plan.upsert({
		where: { slug: "beta" },
		update: {},
		create: {
			slug: "beta",
			name: "Versao BETA",
			price: 0,
			features: {
				max_workspaces: 3,
			},
		},
	});
}

async function createTestUser(
	server: FastifyInstance,
	options: { password?: string } = {},
) {
	const plan = await ensureBetaPlan(server);
	const rawPassword = options.password ?? "senha-segura-123";
	const hashedPassword = await bcrypt.hash(rawPassword, 10);

	const user = await server.prisma.user.create({
		data: {
			name: "Auth Test User",
			email: uniqueEmail("auth"),
			password: hashedPassword,
			plan_id: plan.id,
		},
	});

	return { ...user, rawPassword };
}

describe("POST /auth/change-password", () => {
	test("altera a senha com sucesso e limpa o cookie", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const response = await server.inject({
				method: "POST",
				url: "/auth/change-password",
				cookies: buildAuthCookie(user),
				payload: {
					currentPassword: user.rawPassword,
					newPassword: "nova-senha-456",
				},
			});

			expect(response.statusCode).toBe(200);
			const parsed = changePasswordResponseSchema.safeParse(response.json());
			if (!parsed.success) {
				throw new Error(
					"Resposta nao corresponde ao schema: " +
						JSON.stringify(parsed.error),
				);
			}

			expect(parsed.data.message).toBe("Senha alterada com sucesso");

			// Verifica que o cookie foi limpo
			const setCookie = response.headers["set-cookie"];
			expect(setCookie).toBeDefined();
			expect(String(setCookie)).toContain(COOKIE_NAME);

			// Verifica que a nova senha funciona no banco
			const updatedUser = await server.prisma.user.findUnique({
				where: { id: user.id },
			});
			const newPasswordMatches = await bcrypt.compare(
				"nova-senha-456",
				updatedUser!.password,
			);
			expect(newPasswordMatches).toBe(true);
		} finally {
			await server.close();
		}
	});

	test("retorna 401 quando senha atual estiver incorreta", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const response = await server.inject({
				method: "POST",
				url: "/auth/change-password",
				cookies: buildAuthCookie(user),
				payload: {
					currentPassword: "senha-errada",
					newPassword: "nova-senha-456",
				},
			});

			expect(response.statusCode).toBe(401);
			const body = response.json();
			expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
		} finally {
			await server.close();
		}
	});

	test("retorna 401 quando cookie nao for enviado", async () => {
		const server = await setupTestServer();

		try {
			const response = await server.inject({
				method: "POST",
				url: "/auth/change-password",
				payload: {
					currentPassword: "qualquer",
					newPassword: "nova-senha-456",
				},
			});

			expect(response.statusCode).toBe(401);
			const body = response.json();
			expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
		} finally {
			await server.close();
		}
	});

	test("retorna 404 quando usuário não existir", async () => {
		const server = await setupTestServer();

		try {
			const cookies = buildAuthCookie({
				id: "missing-user",
				email: "missing@example.com",
			});

			const response = await server.inject({
				method: "POST",
				url: "/auth/change-password",
				cookies,
				payload: {
					currentPassword: "qualquer",
					newPassword: "nova-senha-456",
				},
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.code).toBe(ErrorCode.NOT_FOUND);
		} finally {
			await server.close();
		}
	});

	test("retorna 400 quando senhas forem muito curtas", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const response = await server.inject({
				method: "POST",
				url: "/auth/change-password",
				cookies: buildAuthCookie(user),
				payload: {
					currentPassword: "short",
					newPassword: "short",
				},
			});

			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
		} finally {
			await server.close();
		}
	});

	test("invalida tokens do usuário após trocar a senha", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			// Cria um token no banco para o usuário
			await server.prisma.token.create({
				data: {
					token: "test-token-123",
					type: "PASSWORD_RESET",
					user_id: user.id,
					expires_at: new Date(Date.now() + 3600000),
				},
			});

			await server.inject({
				method: "POST",
				url: "/auth/change-password",
				cookies: buildAuthCookie(user),
				payload: {
					currentPassword: user.rawPassword,
					newPassword: "nova-senha-456",
				},
			});

			// Verifica que os tokens foram removidos
			const tokens = await server.prisma.token.findMany({
				where: { user_id: user.id },
			});
			expect(tokens).toHaveLength(0);
		} finally {
			await server.close();
		}
	});

	test("retorna 400 quando body estiver vazio", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const response = await server.inject({
				method: "POST",
				url: "/auth/change-password",
				cookies: buildAuthCookie(user),
				payload: {},
			});

			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
		} finally {
			await server.close();
		}
	});
});

import { describe, expect, setDefaultTimeout, test } from "bun:test";
import env from "@env";
import { ErrorCode } from "@errors/app-error";
import { setupTestServer } from "@utils/test-setup";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { bucketItemSchema, listBucketsResponseSchema } from "./schemas";

const COOKIE_NAME = "finza_token";

setDefaultTimeout(15000);

function uniqueEmail(prefix: string) {
	return `${prefix}-${Date.now()}-${Math.random()
		.toString(16)
		.slice(2)}@example.com`;
}

function buildAuthCookie(user: { id: string; email: string }) {
	const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
		expiresIn: "7d",
	});
	return { [COOKIE_NAME]: token };
}

async function ensureBetaPlan(server: FastifyInstance) {
	return server.prisma.plan.upsert({
		where: { slug: "beta" },
		update: {},
		create: {
			slug: "beta",
			name: "Versao BETA",
			price: 0,
			features: { max_workspaces: 3 },
		},
	});
}

async function createTestUser(server: FastifyInstance) {
	const plan = await ensureBetaPlan(server);
	return server.prisma.user.create({
		data: {
			name: "Test User",
			email: uniqueEmail("bucket-test"),
			password: "hashed-password",
			plan_id: plan.id,
		},
	});
}

async function createTestWorkspace(server: FastifyInstance, userId: string) {
	const workspace = await server.prisma.workspace.create({
		data: { name: "Test Workspace", currency: "BRL" },
	});

	await server.prisma.workspaceMember.create({
		data: {
			workspace_id: workspace.id,
			user_id: userId,
			role: "OWNER",
			accepted_at: new Date(),
		},
	});

	const inbox = await server.prisma.bucket.create({
		data: {
			workspace_id: workspace.id,
			name: "Caixa de Entrada",
			type: "INBOX",
			allocation_percentage: 0,
			is_default: true,
		},
	});

	return { workspace, inbox };
}

async function createTestBucket(
	server: FastifyInstance,
	workspaceId: string,
	name = "Lazer",
) {
	return server.prisma.bucket.create({
		data: {
			workspace_id: workspaceId,
			name,
			type: "SPENDING",
			allocation_percentage: 20,
		},
	});
}

describe("POST /buckets", () => {
	test("cria bucket com sucesso", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);

			const response = await server.inject({
				method: "POST",
				url: "/buckets",
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "Lazer", type: "SPENDING", allocation_percentage: 20 },
			});

			expect(response.statusCode).toBe(201);

			const body = response.json();
			const parsed = bucketItemSchema.safeParse(body);
			if (!parsed.success) {
				throw new Error(
					`Resposta não corresponde ao schema: ${JSON.stringify(parsed.error)}`,
				);
			}

			expect(parsed.data.name).toBe("Lazer");
			expect(parsed.data.type).toBe("SPENDING");
			expect(parsed.data.allocation_percentage).toBe(20);
			expect(parsed.data.workspace_id).toBe(workspace.id);
			expect(parsed.data.is_default).toBe(false);
		} finally {
			await server.close();
		}
	});

	test("retorna 400 com body inválido", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);

			const response = await server.inject({
				method: "POST",
				url: "/buckets",
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe(ErrorCode.VALIDATION_ERROR);
		} finally {
			await server.close();
		}
	});

	test("retorna 401 quando cookie não for enviado", async () => {
		const server = await setupTestServer();

		try {
			const response = await server.inject({
				method: "POST",
				url: "/buckets",
				payload: { name: "Lazer" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe(ErrorCode.UNAUTHORIZED);
		} finally {
			await server.close();
		}
	});

	test("retorna 400 quando header x-workspace-id estiver ausente", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const response = await server.inject({
				method: "POST",
				url: "/buckets",
				cookies: buildAuthCookie(user),
				payload: { name: "Lazer" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe(ErrorCode.BAD_REQUEST);
		} finally {
			await server.close();
		}
	});

	test("retorna 403 quando usuário não é membro do workspace", async () => {
		const server = await setupTestServer();

		try {
			const owner = await createTestUser(server);
			const stranger = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, owner.id);

			const response = await server.inject({
				method: "POST",
				url: "/buckets",
				cookies: buildAuthCookie(stranger),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "Lazer" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
		} finally {
			await server.close();
		}
	});
});

describe("GET /buckets", () => {
	test("lista buckets do workspace incluindo o INBOX", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);
			await createTestBucket(server, workspace.id, "Lazer");

			const response = await server.inject({
				method: "GET",
				url: "/buckets",
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(200);

			const body = response.json();
			const parsed = listBucketsResponseSchema.safeParse(body);
			if (!parsed.success) {
				throw new Error(
					`Resposta não corresponde ao schema: ${JSON.stringify(parsed.error)}`,
				);
			}

			expect(parsed.data).toHaveLength(2);
			const inbox = parsed.data.find((b) => b.is_default);
			expect(inbox).toBeDefined();
			expect(inbox?.name).toBe("Caixa de Entrada");
			expect(inbox?.type).toBe("INBOX");
		} finally {
			await server.close();
		}
	});

	test("retorna lista vazia quando não há buckets além do workspace recém-criado", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const workspace = await server.prisma.workspace.create({
				data: { name: "Empty Workspace", currency: "BRL" },
			});
			await server.prisma.workspaceMember.create({
				data: {
					workspace_id: workspace.id,
					user_id: user.id,
					role: "OWNER",
					accepted_at: new Date(),
				},
			});

			const response = await server.inject({
				method: "GET",
				url: "/buckets",
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual([]);
		} finally {
			await server.close();
		}
	});

	test("retorna 401 quando cookie não for enviado", async () => {
		const server = await setupTestServer();

		try {
			const response = await server.inject({
				method: "GET",
				url: "/buckets",
				headers: { "x-workspace-id": "any-id" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe(ErrorCode.UNAUTHORIZED);
		} finally {
			await server.close();
		}
	});

	test("retorna 400 quando endDate for uma data futura", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);

			const futureDate = new Date(Date.now() + 86400 * 1000).toISOString();

			const response = await server.inject({
				method: "GET",
				url: `/buckets?endDate=${encodeURIComponent(futureDate)}`,
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe(ErrorCode.VALIDATION_ERROR);
		} finally {
			await server.close();
		}
	});

	test("retorna 400 quando header x-workspace-id estiver ausente", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);

			const response = await server.inject({
				method: "GET",
				url: "/buckets",
				cookies: buildAuthCookie(user),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe(ErrorCode.BAD_REQUEST);
		} finally {
			await server.close();
		}
	});

	test("retorna 403 quando usuário não é membro do workspace", async () => {
		const server = await setupTestServer();

		try {
			const owner = await createTestUser(server);
			const stranger = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, owner.id);

			const response = await server.inject({
				method: "GET",
				url: "/buckets",
				cookies: buildAuthCookie(stranger),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
		} finally {
			await server.close();
		}
	});
});

describe("PATCH /buckets/:bucketId", () => {
	test("atualiza bucket com sucesso", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);
			const bucket = await createTestBucket(server, workspace.id);

			const response = await server.inject({
				method: "PATCH",
				url: `/buckets/${bucket.id}`,
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "Cinema" },
			});

			expect(response.statusCode).toBe(200);

			const body = response.json();
			const parsed = bucketItemSchema.safeParse(body);
			if (!parsed.success) {
				throw new Error(
					`Resposta não corresponde ao schema: ${JSON.stringify(parsed.error)}`,
				);
			}

			expect(parsed.data.name).toBe("Cinema");
			expect(parsed.data.id).toBe(bucket.id);
		} finally {
			await server.close();
		}
	});

	test("retorna 403 ao tentar editar o caixa INBOX", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace, inbox } = await createTestWorkspace(server, user.id);

			const response = await server.inject({
				method: "PATCH",
				url: `/buckets/${inbox.id}`,
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "Renomeado" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
		} finally {
			await server.close();
		}
	});

	test("retorna 404 quando bucket não existe", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);

			const response = await server.inject({
				method: "PATCH",
				url: "/buckets/nonexistent-id",
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "Qualquer" },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe(ErrorCode.NOT_FOUND);
		} finally {
			await server.close();
		}
	});

	test("retorna 401 quando cookie não for enviado", async () => {
		const server = await setupTestServer();

		try {
			const response = await server.inject({
				method: "PATCH",
				url: "/buckets/any-id",
				headers: { "x-workspace-id": "any-id" },
				payload: { name: "Qualquer" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe(ErrorCode.UNAUTHORIZED);
		} finally {
			await server.close();
		}
	});

	test("retorna 403 quando usuário não é membro do workspace", async () => {
		const server = await setupTestServer();

		try {
			const owner = await createTestUser(server);
			const stranger = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, owner.id);
			const bucket = await createTestBucket(server, workspace.id);

			const response = await server.inject({
				method: "PATCH",
				url: `/buckets/${bucket.id}`,
				cookies: buildAuthCookie(stranger),
				headers: { "x-workspace-id": workspace.id },
				payload: { name: "Qualquer" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
		} finally {
			await server.close();
		}
	});
});

describe("DELETE /buckets/:bucketId", () => {
	test("deleta bucket com sucesso", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);
			const bucket = await createTestBucket(server, workspace.id);

			const response = await server.inject({
				method: "DELETE",
				url: `/buckets/${bucket.id}`,
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(204);

			const deleted = await server.prisma.bucket.findUnique({
				where: { id: bucket.id },
			});
			expect(deleted).toBeNull();
		} finally {
			await server.close();
		}
	});

	test("retorna 403 ao tentar deletar o caixa INBOX", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace, inbox } = await createTestWorkspace(server, user.id);

			const response = await server.inject({
				method: "DELETE",
				url: `/buckets/${inbox.id}`,
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
		} finally {
			await server.close();
		}
	});

	test("retorna 404 quando bucket não existe", async () => {
		const server = await setupTestServer();

		try {
			const user = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, user.id);

			const response = await server.inject({
				method: "DELETE",
				url: "/buckets/nonexistent-id",
				cookies: buildAuthCookie(user),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe(ErrorCode.NOT_FOUND);
		} finally {
			await server.close();
		}
	});

	test("retorna 401 quando cookie não for enviado", async () => {
		const server = await setupTestServer();

		try {
			const response = await server.inject({
				method: "DELETE",
				url: "/buckets/any-id",
				headers: { "x-workspace-id": "any-id" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe(ErrorCode.UNAUTHORIZED);
		} finally {
			await server.close();
		}
	});

	test("retorna 403 quando usuário não é membro do workspace", async () => {
		const server = await setupTestServer();

		try {
			const owner = await createTestUser(server);
			const stranger = await createTestUser(server);
			const { workspace } = await createTestWorkspace(server, owner.id);
			const bucket = await createTestBucket(server, workspace.id);

			const response = await server.inject({
				method: "DELETE",
				url: `/buckets/${bucket.id}`,
				cookies: buildAuthCookie(stranger),
				headers: { "x-workspace-id": workspace.id },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe(ErrorCode.FORBIDDEN);
		} finally {
			await server.close();
		}
	});
});

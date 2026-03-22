import { appErrorSchema } from "@errors/app-error-schemas";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { changePasswordController } from "./controllers/change-password.controller";
import { loginController } from "./controllers/login.controller";
import { logoutController } from "./controllers/logout.controller";
import {
	changePasswordBodySchema,
	changePasswordResponseSchema,
	loginBodySchema,
	loginResponseSchema,
	logoutResponseSchema,
} from "./schemas";

export async function authRoutes(fastify: FastifyInstance) {
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/auth/login",
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "1 minute",
				},
			},
			schema: {
				tags: ["auth"],
				description:
					"Autentica um usuário com email e senha. O token JWT é enviado via HttpOnly cookie.",
				body: loginBodySchema,
				response: {
					200: loginResponseSchema,
					400: appErrorSchema.describe("Erro de validação"),
					401: appErrorSchema.describe("Credenciais inválidas"),
				},
				summary: "Login de usuário",
				consumes: ["application/json"],
				produces: ["application/json"],
				security: [],
			},
		},
		(request, reply) => loginController(request, reply, fastify),
	);

	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/auth/logout",
		{
			schema: {
				tags: ["auth"],
				description:
					"Encerra a sessão do usuário removendo o cookie de autenticação.",
				response: {
					200: logoutResponseSchema,
				},
				summary: "Logout de usuário",
				produces: ["application/json"],
				security: [],
			},
		},
		(request, reply) => logoutController(request, reply),
	);

	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/auth/change-password",
		{
			preHandler: fastify.authenticate,
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "1 minute",
				},
			},
			schema: {
				tags: ["auth"],
				description:
					"Altera a senha do usuário autenticado. Requer a senha atual para confirmação. Invalida a sessão atual após a troca.",
				body: changePasswordBodySchema,
				response: {
					200: changePasswordResponseSchema,
					400: appErrorSchema.describe("Erro de validação"),
					401: appErrorSchema.describe("Token inválido ou expirado"),
					403: appErrorSchema.describe("Senha atual incorreta"),
					404: appErrorSchema.describe("Usuário não encontrado"),
				},
				summary: "Alterar senha do usuário",
				consumes: ["application/json"],
				produces: ["application/json"],
				security: [{ cookieAuth: [] }],
			},
		},
		(request, reply) => changePasswordController(request, reply, fastify),
	);
}

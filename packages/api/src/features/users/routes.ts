import { appErrorSchema } from "@errors/app-error-schemas";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createUserController } from "./controllers/create-user.controller";
import { getProfileController } from "./controllers/get-profile.controller";
import { togglePrivacyController } from "./controllers/toggle-privacy.controller";
import { updateProfileController } from "./controllers/update-profile.controller";
import {
	profileResponseSchema,
	signupBodySchema,
	signupResponseSchema,
	togglePrivacyResponseSchema,
	updateProfileBodySchema,
	updateProfileResponseSchema,
} from "./schemas";

export async function usersRoutes(fastify: FastifyInstance) {
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/users",
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "1 minute",
				},
			},
			schema: {
				tags: ["users"],
				description: "Cria um novo usuário na plataforma.",
				body: signupBodySchema,
				response: {
					201: signupResponseSchema,
					400: appErrorSchema.describe("Erro de validação"),
					409: appErrorSchema.describe("E-mail já cadastrado"),
				},
				summary: "Cadastro de usuário",
				consumes: ["application/json"],
				produces: ["application/json"],
				security: [],
			},
		},
		(request, reply) => createUserController(request, reply, fastify),
	);

	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/profile",
		{
			preHandler: fastify.authenticate,
			schema: {
				tags: ["users"],
				description: "Retorna os dados do usuário autenticado.",
				response: {
					200: profileResponseSchema,
					401: appErrorSchema.describe("Token inválido ou ausente"),
					404: appErrorSchema.describe("Usuário não encontrado"),
				},
				summary: "Perfil do usuário autenticado",
				produces: ["application/json"],
				security: [{ cookieAuth: [] }],
			},
		},
		(request, reply) => getProfileController(request, reply, fastify),
	);

	fastify.withTypeProvider<ZodTypeProvider>().patch(
		"/profile",
		{
			preHandler: fastify.authenticate,
			schema: {
				tags: ["users"],
				description:
					"Atualiza os dados do perfil do usuário autenticado. Se o e-mail for alterado, a verificação é resetada.",
				body: updateProfileBodySchema,
				response: {
					200: updateProfileResponseSchema,
					400: appErrorSchema.describe("Erro de validação"),
					401: appErrorSchema.describe("Token inválido ou ausente"),
					404: appErrorSchema.describe("Usuário não encontrado"),
					409: appErrorSchema.describe("E-mail já cadastrado"),
				},
				summary: "Atualizar perfil do usuário",
				consumes: ["application/json"],
				produces: ["application/json"],
				security: [{ cookieAuth: [] }],
			},
		},
		(request, reply) => updateProfileController(request, reply, fastify),
	);

	fastify.withTypeProvider<ZodTypeProvider>().patch(
		"/profile/privacy",
		{
			preHandler: fastify.authenticate,
			schema: {
				tags: ["users"],
				description:
					"Alterna o estado de privacidade de valores do usuário autenticado.",
				response: {
					200: togglePrivacyResponseSchema,
					401: appErrorSchema.describe("Token inválido ou ausente"),
					404: appErrorSchema.describe("Usuário não encontrado"),
				},
				summary: "Toggle de privacidade do usuário",
				produces: ["application/json"],
				security: [{ cookieAuth: [] }],
			},
		},
		(request, reply) => togglePrivacyController(request, reply, fastify),
	);
}

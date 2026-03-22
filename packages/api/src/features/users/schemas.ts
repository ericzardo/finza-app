import { z } from "zod";

export const signupBodySchema = z.object({
	name: z.string().min(3).max(120).describe("Nome completo do usuário"),
	email: z.string().email().describe("E-mail do usuário"),
	password: z
		.string()
		.min(8)
		.describe("Senha do usuário (mínimo 8 caracteres)"),
});

const userSummarySchema = z.object({
	id: z.string().describe("ID do usuário"),
	name: z.string().describe("Nome completo do usuário"),
	email: z.string().email().describe("E-mail do usuário"),
	plan: z.string().describe("Plano do usuário"),
	avatar_url: z.string().nullable().describe("URL do avatar do usuário"),
});

export const signupResponseSchema = userSummarySchema;

export const profileResponseSchema = userSummarySchema.extend({
	is_privacy_enabled: z
		.boolean()
		.describe("Indica se a privacidade de valores do usuario esta habilitada"),
	email_verified_at: z
		.string()
		.datetime()
		.nullable()
		.describe("Data de verificação do e-mail"),
});

export const updateProfileBodySchema = z.object({
	name: z
		.string()
		.min(3)
		.max(120)
		.describe("Nome completo do usuário")
		.optional(),
	avatar_url: z.string().url().describe("URL do avatar do usuário").optional(),
	email: z.string().email().describe("Novo e-mail do usuário").optional(),
});

export const updateProfileResponseSchema = profileResponseSchema;

export const togglePrivacyResponseSchema = z.object({
	is_privacy_enabled: z
		.boolean()
		.describe("Novo estado da privacidade de valores do usuário"),
});

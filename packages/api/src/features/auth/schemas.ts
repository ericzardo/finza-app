import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email().describe('E-mail do usuário'),
  password: z
    .string()
    .min(8)
    .describe('Senha do usuário (mínimo 8 caracteres)'),
});

export const loginUserSchema = z.object({
  id: z.string().describe('ID do usuário'),
  name: z.string().describe('Nome completo do usuário'),
  email: z.string().email().describe('E-mail do usuário'),
  plan: z.string().describe('Plano do usuário'),
});

export const loginResponseSchema = z.object({
  user: loginUserSchema,
});

export const logoutResponseSchema = z.object({
  message: z.string().describe('Mensagem de confirmação'),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z
    .string()
    .min(8)
    .describe('Senha atual do usuário (mínimo 8 caracteres)'),
  newPassword: z
    .string()
    .min(8)
    .describe('Nova senha do usuário (mínimo 8 caracteres)'),
});

export const changePasswordResponseSchema = z.object({
  message: z.string().describe('Mensagem de confirmação'),
});

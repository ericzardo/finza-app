import { z } from "zod";
import { passwordSchema } from "./user"; 

export const loginSchema = z.object({
  email: z.string().trim().email("Digite um email válido").toLowerCase(),
  password: z.string().min(1, "A senha é obrigatória"), 
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().trim().email("Digite um email válido").toLowerCase(),
  password: passwordSchema, 
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswwordData = z.infer<typeof forgotPasswordSchema>;
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export type LoginData = z.infer<typeof loginSchema>;
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(/[\W_]/, "A senha deve conter pelo menos um caractere especial (ex: !@#$%)");

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().trim().email("Digite um email válido").toLowerCase(),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").optional(),
  avatarUrl: z.string().optional(), 
  isPrivacyEnabled: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
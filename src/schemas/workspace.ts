import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "O nome do workspace é obrigatório"),
  currency: z.string().default("BRL"),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export type CreateWorkspaceData = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceData = z.infer<typeof updateWorkspaceSchema>;
import { z } from "zod";
import { createUserSchema, updateUserSchema, changePasswordSchema } from "@/schemas/user";

// Tipos inferidos dos schemas
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// Tipos de entidade
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  is_privacy_enabled: boolean;
}

// Tipos de contexto
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface PrivacyContextType {
  isPrivacyEnabled: boolean;
  togglePrivacy: () => void;
}

// Tipos de componentes
export interface PrivacyToggleProps {
  showTooltip?: boolean;
}

// Tipos de diálogos
export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Tipos de layout
export interface AuthLayoutProps {
  children: React.ReactNode;
}

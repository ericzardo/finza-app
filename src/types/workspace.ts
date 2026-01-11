import { z } from "zod";
import { currencyEnum } from "@/schemas/workspace";
import type { Bucket } from "./bucket";

// Tipos inferidos dos schemas
export type CurrencyType = z.infer<typeof currencyEnum>;

// Tipos de entidade
export interface Workspace {
  id: string;
  name: string;
  currency: CurrencyType;
  total_balance: number;
}

export interface WorkspaceWithBuckets extends Workspace {
  user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
  buckets: Bucket[];
}

// Tipos de componentes
export interface WorkspaceCardProps {
  workspace: Workspace;
}

// Tipos de layout
export interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: {
    workspaceId: string;
  };
}

// Tipos de diálogos
export interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

// Tipos de configurações
export interface WorkspaceDeleteZoneProps {
  workspaceId: string;
}

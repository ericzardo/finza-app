import { z } from "zod";
import { transactionTypeEnum } from "@/schemas/transaction";
import type { Bucket } from "./bucket";

// Tipos inferidos dos schemas
export type TransactionType = z.infer<typeof transactionTypeEnum>;
export type FilterType = "ALL" | "INCOME" | "EXPENSE";

// Tipos de entidade
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string | Date;
  description?: string;
  bucket_id?: string;
  workspace_id: string;
  created_at?: string | Date;
  is_allocated?: boolean;
  bucket?: {
    id?: string;
    name: string;
  } | null;
}

// Tipos de componentes
export interface TransactionRowProps {
  transaction: Transaction;
}

// Tipos de dados
import type { FilterTransactionData } from "@/schemas/transaction";
export type { FilterTransactionData };

// Tipos de diálogos
export interface FilterTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buckets: Bucket[];
  currency: string;
  defaultValues?: Partial<FilterTransactionData>;
  onApplyFilters: (filters: FilterTransactionData) => void;
  onClearFilters: () => void;
}

export interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  bucketId?: string;
  currency: string;
  onSuccess?: () => void;
}

export interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
}

export interface ImportTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currency: string;
  onSuccess?: () => void;
}

// Tipos de importação
export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
}

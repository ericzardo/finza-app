import { z } from "zod";
import { bucketTypeEnum } from "@/schemas/bucket";

// Tipos inferidos dos schemas
export type BucketType = z.infer<typeof bucketTypeEnum>;

// Tipos de entidade
export interface Bucket {
  id: string;
  workspace_id: string;
  name: string;
  allocation_percentage: number;
  type: BucketType; 
  current_balance: number;
  total_allocated: number;
  total_spent: number;
  is_default: boolean;
}

// Tipos de componentes
export interface BucketCardProps {
  bucket: Bucket;
  currency: string;
  index: number;
  onEdit: (bucket: Bucket) => void;
  onDelete: (bucket: Bucket) => void;
  onTransfer?: (bucket: Bucket) => void;
  onDistribute?: (bucket: Bucket) => void;
}

export interface BucketCardSkeletonProps {
  index?: number;
}

// Tipos de diálogos
export interface AddBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: () => void;
}

export interface EditBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: Bucket;
  onSuccess?: () => void;
}

export interface DeleteBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: Bucket | null;
  currency: string;
  onSuccess?: () => void;
}

export interface TransferBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBucket: Bucket;
  workspaceId: string;
  buckets: Bucket[];
  currency: string;
  onSuccess?: () => void;
}

// Tipos de distribuição
export interface DistributionTarget {
  bucketId: string;
  bucketName: string;
  value: number;
  isPercentage: boolean;
  inputMode: "amount" | "percentage";
  calculatedAmount?: number;
}

export interface DistributionResult {
  bucketId: string;
  amount: number;
}

export interface DistributeBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBucket: Bucket;
  workspaceId: string;
  buckets: Bucket[];
  onSuccess?: () => void;
  currency?: string;
}

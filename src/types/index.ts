export type BucketType = "SPENDING" | "INVESTMENT" | "INBOX";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  is_privacy_enabled: boolean;
}

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
export interface Workspace {
  id: string;
  name: string;
  currency: string;
  total_balance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
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

export interface WorkspaceWithBuckets extends Workspace {
  user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
  buckets: Bucket[];
}

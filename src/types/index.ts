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
  current_balance: number;
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
}

export interface WorkspaceWithBuckets {
  id: string;
  name: string;
  currency: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  buckets: {
    current_balance: unknown; 
  }[];
}
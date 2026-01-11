import { CreateBucketData, UpdateBucketData, TransferBucketData } from "@/schemas/bucket";

import { Bucket } from "@/types"; 

async function handleHttpError(response: Response, defaultMessage: string) {
  try {
    const errorData = await response.json();
    return new Error(errorData.error || errorData.message || defaultMessage);
  } catch {
    return new Error(defaultMessage);
  }
}

export async function getBucketsRequest(
  workspaceId: string,
  signal?: AbortSignal
): Promise<Bucket[]> {
  const response = await fetch(`/api/buckets?workspaceId=${workspaceId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao buscar buckets");
  }

  const result = await response.json();
  return result.data || result;
}

export async function createBucketRequest(data: CreateBucketData): Promise<Bucket> {
  const response = await fetch("/api/buckets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao criar bucket");
  }

  const result = await response.json();
  return result.data || result;
}

export async function updateBucketRequest(
  bucketId: string, 
  data: UpdateBucketData
): Promise<Bucket> {
  const response = await fetch(`/api/buckets/${bucketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao atualizar bucket");
  }

  const result = await response.json();
  return result.data || result;
}

export async function deleteBucketRequest(bucketId: string): Promise<void> {
  const response = await fetch(`/api/buckets/${bucketId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao deletar bucket");
  }
}

export async function transferBalanceRequest(data: TransferBucketData): Promise<{ source: Bucket; destination: Bucket }> {
  const response = await fetch("/api/buckets/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao transferir saldo entre buckets");
  }

  const result = await response.json();
  return result.data || result;
}

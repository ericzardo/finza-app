import { Workspace } from "@/types";
import { CreateWorkspaceData, UpdateWorkspaceData } from "@/schemas/workspace";
import { handleHttpError } from "@/handlers/http-error";

export async function getWorkspacesRequest(signal?: AbortSignal): Promise<Workspace[]> {
  const response = await fetch("/api/workspaces", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao buscar workspaces");
  }

  const result = await response.json();
  return result.data || result; 
}

export async function createWorkspaceRequest(data: CreateWorkspaceData): Promise<Workspace> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao criar workspace");
  }

  const result = await response.json();
  return result.data || result;
}

export async function getWorkspaceByIdRequest(id: string, signal?: AbortSignal): Promise<Workspace> {
  if (!id) {
    throw new Error("ID do workspace inválido");
  }

  const response = await fetch(`/api/workspaces/${id}`, {
    signal,
  });
  
  if (!response.ok) {
    throw await handleHttpError(response, "Workspace não encontrado");
  }

  const result = await response.json();
  return result.data || result;
}

export async function updateWorkspaceRequest(
  id: string, 
  data: UpdateWorkspaceData
): Promise<Workspace> {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao atualizar workspace");
  }

  const result = await response.json();
  return result.data || result;
}

export async function deleteWorkspaceRequest(id: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Falha ao deletar workspace");
  }
}
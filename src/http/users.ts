import { UpdateUserData, ChangePasswordData } from "@/schemas/user";

async function handleHttpError(response: Response, defaultMessage: string) {
  try {
    const errorData = await response.json();
    return new Error(errorData.error || errorData.message || defaultMessage);
  } catch {
    return new Error(defaultMessage);
  }
}

export async function updateUserRequest(userId: string, data: UpdateUserData) {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw await handleHttpError(response, "Erro ao atualizar perfil");
  return response.json();
}

export async function changePasswordRequest(userId: string, data: ChangePasswordData) {
  const response = await fetch(`/api/users/${userId}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw await handleHttpError(response, "Erro ao alterar senha");
  return response.json();
}
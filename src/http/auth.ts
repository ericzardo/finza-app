import { LoginData, RegisterData } from "@/schemas/auth";
import { handleHttpError } from "@/handlers/http-error";

export async function loginRequest(data: LoginData) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Erro ao fazer login");
  }

  const body = await response.json();
  return body.data.user; 
}

export async function registerRequest(data: RegisterData) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await handleHttpError(response, "Erro ao criar conta");
  }

  const body = await response.json();
  return body.data.user; 
}

export async function logoutRequest() {
  await fetch("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMeRequest(signal?: AbortSignal) {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    
    return body.data; 

  } catch (error) { 
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return null;
  }
}
import { loginService } from "@/services/auth/login";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { loginSchema } from "@/schemas/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = loginSchema.parse(body);

    const result = await loginService({
      email,
      password,
    });

    return handleResponse(result, { 
      message: "Login realizado com sucesso",
      status: 200 
    });

  } catch (error) {
    return handleError(error);
  }
}
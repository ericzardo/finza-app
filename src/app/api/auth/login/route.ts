import { cookies } from "next/headers";
import { loginService } from "@/services/auth/login";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { loginSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = loginSchema.parse(body);

    const result = await loginService({
      email,
      password,
    });

    const cookieStore = await cookies();
    
    cookieStore.set("finza.token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return handleResponse(result, { 
      message: "Login realizado com sucesso",
      status: 200 
    });

  } catch (error) {
    return handleError(error);
  }
}
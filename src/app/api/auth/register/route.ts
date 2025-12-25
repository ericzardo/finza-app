import { cookies } from "next/headers";
import { registerService } from "@/services/auth";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { registerSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password } = registerSchema.parse(body);

    const result = await registerService({
      name,
      email,
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("finza.token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return handleResponse(result, { 
      message: "Conta criada com sucesso", 
      status: 201 
    });

  } catch (error) {
    return handleError(error);
  }
}
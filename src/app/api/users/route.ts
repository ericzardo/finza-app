import { createUser, listUsers } from "@/services/user";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { createUserSchema } from "@/schemas/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password } = createUserSchema.parse(body);

    const user = await createUser({
      name,
      email,
      password,
    });

    return handleResponse(user, { 
      status: 201, 
      message: "Usuário criado com sucesso" 
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  try {
    const users = await listUsers();
    
    return handleResponse(users);
    
  } catch (error) {
    return handleError(error);
  }
}
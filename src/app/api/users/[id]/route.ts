import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { updateUserSchema } from "@/schemas/user";
import { getUserById, updateUser, deleteUser } from "@/services/user";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Props) {
  try {
    const params = await props.params;
    
    // Auth Check
    await getCurrentUserId(); 
    
    const user = await getUserById(params.id);
    if (!user) throw new AppError("User not found", 404);

    return handleResponse(user);

  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, props: Props) {
  try {
    const params = await props.params;
    const requesterId = await getCurrentUserId();
    const body = await request.json();

    const data = updateUserSchema.parse(body);

    const updatedUser = await updateUser({
      id: params.id,
      requesterId, 
      ...data
    });

    return handleResponse(updatedUser, {
      message: "Dados atualizados com sucesso"
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const requesterId = await getCurrentUserId();

    const deletedUser = await deleteUser(params.id, requesterId);

    return handleResponse(deletedUser, {
      message: `Usuário ${deletedUser.name} foi deletado permanentemente.`
    });

  } catch (error) {
    return handleError(error);
  }
}
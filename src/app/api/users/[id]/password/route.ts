import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { AppError } from "@/lib/errors";
import { changePasswordSchema } from "@/schemas/user";
import { changePassword } from "@/services/user";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: Props) {
  try {
    const params = await props.params;
    const requesterId = await getCurrentUserId();

    if (params.id !== requesterId) {
      throw new AppError("Você não tem permissão para alterar esta senha", 403);
   }

    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const result = await changePassword(params.id, data);

    return handleResponse(result, {
      message: "Senha alterada com sucesso"
    });

  } catch (error) {
    return handleError(error);
  }
}
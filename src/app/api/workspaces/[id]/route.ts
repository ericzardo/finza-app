import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { getWorkspaceById, updateWorkspace, deleteWorkspace } from "@/services/workspace";
import { updateWorkspaceSchema } from "@/schemas/workspace";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();
    
    const workspace = await getWorkspaceById(params.id, userId);

    if (!workspace) throw new AppError("Workspace not found", 404);
    if (workspace.user_id !== userId) throw new AppError("Unauthorized", 403);

    return handleResponse(workspace);

  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();
    const body = await request.json();

    const data = updateWorkspaceSchema.parse(body);

    const updated = await updateWorkspace({
      workspaceId: params.id,
      userId,
      ...data
    });

    return handleResponse(updated, {
      message: "Workspace atualizado com sucesso"
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    const deletedWorkspace = await deleteWorkspace(params.id, userId);

    return handleResponse(deletedWorkspace, {
      message: `Workspace ${deletedWorkspace.name} deletado com sucesso.`
    });

  } catch (error) {
    return handleError(error);
  }
}
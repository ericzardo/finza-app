import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { listUserWorkspaces, createWorkspace } from "@/services/workspace";
import { createWorkspaceSchema } from "@/schemas/workspace";

export async function GET() {
  try {
    const userId = await getCurrentUserId(); 
    
    const workspaces = await listUserWorkspaces(userId);

    return handleResponse(workspaces);

  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    const { name, currency } = createWorkspaceSchema.parse(body);

    const newWorkspace = await createWorkspace({
      userId,
      name,
      currency
    });

    return handleResponse(newWorkspace, { 
      status: 201, 
      message: "Workspace criado com sucesso!" 
    });

  } catch (error) {
    return handleError(error);
  }
}
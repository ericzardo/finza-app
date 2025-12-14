import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/errors/api-handler";
import { getWorkspaceById, updateWorkspace, deleteWorkspace } from "@/services/workspace";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();
    
    const workspace = await getWorkspaceById(params.id, userId);
    return NextResponse.json(workspace);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();
    const body = await request.json();

    const updated = await updateWorkspace({
      id: params.id,
      userId,
      name: body.name,
      currency: body.currency
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    await deleteWorkspace(params.id, userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
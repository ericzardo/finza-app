import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { AppError } from "@/lib/errors";
import { getCurrentUserId } from "@/lib/session";
import { handleError } from "@/errors/api-handler";
import { listUserWorkspaces, createWorkspace } from "@/services/workspace";

export async function GET() {
  try {
    const userId = await getCurrentUserId(); 
    
    const workspaces = await listUserWorkspaces(userId);
    return NextResponse.json(workspaces);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    if (!body.name) {
      throw new AppError("Name is required", 400);
    }

    const newWorkspace = await createWorkspace({
      userId,
      name: body.name,
      currency: body.currency
    });

    return NextResponse.json(newWorkspace, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
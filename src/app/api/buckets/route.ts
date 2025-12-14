import { NextResponse } from "next/server";
import { createBucket, listBuckets } from "@/services/bucket";
import { handleError } from "@/errors/api-handler";
import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    if (!body.workspaceId || !body.name) {
      throw new AppError("Workspace ID and Name are required", 400);
    }
    const workspace = await prisma.workspace.findUnique({
      where: { id: body.workspaceId }
    });

    if (!workspace || workspace.user_id !== userId) {
      throw new AppError("Unauthorized", 404);
    }

    const bucket = await createBucket({
      workspaceId: body.workspaceId,
      name: body.name,
      percentage: Number(body.percentage) || 0,
      isDefault: body.isDefault
    });

    return NextResponse.json(bucket, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}

// GET: Listar Buckets (exige ?workspaceId=...)
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      throw new AppError("Workspace ID is required", 400);
    }

    // Segurança: Verifica dono do workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace || workspace.user_id !== userId) {
      throw new AppError("Workspace not found or unauthorized", 404);
    }

    const buckets = await listBuckets(workspaceId);

    return NextResponse.json(buckets);

  } catch (error) {
    return handleError(error);
  }
}
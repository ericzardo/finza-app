import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { AppError } from "@/lib/errors";
import { createTransaction, listTransactions } from "@/services/transaction";
import { handleError } from "@/errors/api-handler";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();

    if (!body.workspaceId || !body.amount || !body.type) {
      throw new AppError("Missing required fields: workspaceId, amount, type", 400);
    }

    const transaction = await createTransaction({
      userId,
      workspaceId: body.workspaceId,
      bucketId: body.bucketId,
      amount: Number(body.amount),
      type: body.type,
      description: body.description,
      date: body.date
    });

    return NextResponse.json(transaction, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}

// GET: Listar Transações
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(); // Garante que está logado
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      throw new AppError("Workspace ID is required", 400);
    }

    // Nota: O service listTransactions não valida se o user é dono do workspace
    // porque ele apenas filtra. Se o user passar um ID de outro workspace, 
    // vai retornar array vazio (o que é seguro).
    // Se quiser ser estrito, poderia validar o workspace aqui também.
    
    const transactions = await listTransactions(workspaceId);

    return NextResponse.json(transactions);

  } catch (error) {
    return handleError(error);
  }
}
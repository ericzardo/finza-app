import { NextResponse } from "next/server";
import { getTransactionById, deleteTransaction } from "@/services/transaction";
import { handleError } from "@/handlers/api-error";
import { getCurrentUserId } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    const transaction = await getTransactionById(params.id, userId);
    return NextResponse.json(transaction);

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const params = await props.params;
    const userId = await getCurrentUserId();

    await deleteTransaction(params.id, userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    return handleError(error);
  }
}
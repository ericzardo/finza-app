import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  console.error("🔥 Critical Error:", error);

  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}
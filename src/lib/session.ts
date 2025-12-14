import { headers } from "next/headers";
import { AppError } from "@/lib/errors";

export async function getCurrentUserId() {
  const headersList = await headers();
  
  const userId = headersList.get("x-user-id");

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
}
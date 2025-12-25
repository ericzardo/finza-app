import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";
import { verify } from "jsonwebtoken";

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  
  const token = cookieStore.get("finza.token")?.value;

  if (!token) {
    throw new AppError("Unauthorized: No token found", 401);
  }

  try {
    console.log("Unauthorized")
    const secret = process.env.JWT_SECRET || ""; 
    
    const decoded = verify(token, secret) as { sub: string; id?: string };
    const userId = decoded.sub || decoded.id;

    if (!userId) {
        throw new AppError("Unauthorized: Invalid token payload", 401);
    }

    return userId;

  } catch {
    console.log("Unauthorized")
    throw new AppError("Unauthorized: Invalid token signature", 401);
  }
}
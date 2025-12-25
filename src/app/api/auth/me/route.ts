import { cookies } from "next/headers";
import { handleError } from "@/handlers/api-error";
import { handleResponse } from "@/handlers/api-response";
import { getMeService } from "@/services/auth/me";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("finza.token")?.value;

    const user = await getMeService(token);

    return handleResponse(user);

  } catch (error) {
    return handleError(error);
  }
}
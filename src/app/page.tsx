import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";

export default async function RootPage() {

  const id = await getCurrentUserId();

  if (id) {
    redirect("/dashboard"); 
  }

  redirect("/auth/login");
}
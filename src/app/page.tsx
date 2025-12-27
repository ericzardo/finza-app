"use client";

import { redirect } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function RootPage() {
  const { user } = useAuth();

  if (user) {
    redirect("/dashboard"); 
  }

  redirect("/login");
}
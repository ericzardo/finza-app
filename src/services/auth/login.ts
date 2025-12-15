import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { signToken } from "@/lib/auth";
import { LoginData } from "@/schemas/auth";

export async function loginService(data: LoginData) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  }); 

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordMatch = await compare(data.password, user.password);

  if (!passwordMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = await signToken({ sub: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };
}
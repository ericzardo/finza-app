import { createUser } from "@/services/user";
import { signToken } from "@/lib/auth";
import { RegisterData } from "@/schemas/auth";

export async function registerService(data: RegisterData) {
  const user = await createUser({
    name: data.name,
    email: data.email,
    password: data.password,
  });

  const token = await signToken({ sub: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url
    },
    token,
  };
}
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { CreateUserData } from "@/schemas/user";

export async function createUser(data: CreateUserData) {
  const userExists = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (userExists) {
    throw new AppError("Email already in use", 409);
  }

  const passwordHash = await hash(data.password, 6);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: passwordHash,
      workspaces: {
        create: {
          name: "Meu Workspace",
          currency: "BRL",
          buckets: {
            create: {
              name: "Caixa de Entrada",
              type: "INBOX",
              allocation_percentage: new Prisma.Decimal(0),
              current_balance: new Prisma.Decimal(0),
              total_allocated: new Prisma.Decimal(0),
              total_spent: new Prisma.Decimal(0),
              is_default: true,
            }
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
      workspaces: {
        include: {
          buckets: true
        }
      },
      avatar_url: true,
    }
  });

  return user;
}

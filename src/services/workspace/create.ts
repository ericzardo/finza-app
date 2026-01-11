import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CreateWorkspaceData } from "@/schemas/workspace";

interface CreateServiceProps extends CreateWorkspaceData {
  userId: string;
}

export async function createWorkspace({ userId, ...data }: CreateServiceProps) {
  return prisma.workspace.create({
    data: {
      user_id: userId,
      ...data,
      buckets: {
        create: {
          name: "Caixa de Entrada",
          type: "INBOX" as const,
          allocation_percentage: new Prisma.Decimal(0),
          current_balance: new Prisma.Decimal(0),
          total_allocated: new Prisma.Decimal(0),
          total_spent: new Prisma.Decimal(0),
          is_default: true,
        }
      }
    }
  });
}

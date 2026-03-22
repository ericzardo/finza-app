import type { PrismaClient } from '@prisma/client';
import type { WorkspaceWithRole } from '@features/workspaces/domain/workspace.types';
import { DEFAULT_CATEGORIES } from '@features/workspaces/domain/workspace.types';

interface CreateWorkspaceInput {
  name: string;
  currency: string;
  userId: string;
}

export async function createWorkspace(
  db: PrismaClient,
  { name, currency, userId }: CreateWorkspaceInput,
): Promise<WorkspaceWithRole> {
  return db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name, currency },
    });

    await tx.workspaceMember.create({
      data: {
        workspace_id: workspace.id,
        user_id: userId,
        role: 'OWNER',
        accepted_at: new Date(),
      },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        workspace_id: workspace.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      })),
    });

    return {
      id: workspace.id,
      name: workspace.name,
      currency: workspace.currency,
      role: 'OWNER' as const,
      totalBalance: 0,
      created_at: workspace.created_at.toISOString(),
    };
  });
}

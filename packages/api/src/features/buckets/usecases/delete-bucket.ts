import { AppError, ErrorCode } from '@errors/app-error';
import type { PrismaClient } from '@prisma/client';

export async function deleteBucket(
  db: PrismaClient,
  { workspaceId, bucketId }: { workspaceId: string; bucketId: string },
): Promise<void> {
  const existing = await db.bucket.findFirst({
    where: { id: bucketId, workspace_id: workspaceId },
  });

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Caixa não encontrado');
  }

  if (existing.is_default) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      403,
      'O caixa INBOX não pode ser deletado',
    );
  }

  await db.bucket.delete({ where: { id: bucketId } });
}

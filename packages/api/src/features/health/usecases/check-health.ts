import { PrismaClient } from '@prisma/client';
import { HealthCheckResponse } from '@features/health/schemas';
import { AppError, ErrorCode } from '@errors/app-error';

export async function checkHealthUseCase(
  db: PrismaClient,
): Promise<HealthCheckResponse> {
  try {
    // Testa conexão com o banco
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'up' };
  } catch {
    throw new AppError(
      ErrorCode.HEALTH_CHECK_FAILED,
      503,
      'Falha ao verificar a saúde do sistema',
    );
  }
}

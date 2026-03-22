import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCode } from '@errors/app-error';
import { expect, test, describe } from 'bun:test';
import { checkHealthUseCase } from './check-health';

describe('checkHealthUseCase', () => {
  test('deve retornar status ok e db up quando o banco estiver online', async () => {
    // Criamos o mock do banco de forma simples
    const mockDb = {
      $queryRaw: async () => [{ '1': 1 }],
    } as unknown as PrismaClient;

    const result = await checkHealthUseCase(mockDb);

    expect(result).toEqual({ status: 'ok', db: 'up' });
  });

  test('deve lançar HealthCheckFailed quando o banco estiver offline', async () => {
    // Simulamos a falha do banco
    const mockDb = {
      $queryRaw: async () => {
        throw new Error('Conexão perdida');
      },
    } as unknown as PrismaClient;

    try {
      await checkHealthUseCase(mockDb);
      // Se chegar aqui, o teste falhou pois deveria ter dado erro
      expect(true).toBe(false);
    } catch (error) {
      if (error instanceof AppError) {
        expect(error.code).toBe(ErrorCode.HEALTH_CHECK_FAILED);
        expect(error.statusCode).toBe(503);
      }
    }
  });
});

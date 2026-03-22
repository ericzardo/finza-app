import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError, ErrorCode } from '@errors/app-error';
import { createWorkspace } from '@features/workspaces/usecases/create-workspace';

/**
 * Cria um novo usuário, associando ao plano 'beta'.
 * @throws AppError com código CONFLICT e status 409 se email já existir
 * @throws AppError com código NOT_FOUND e status 404 se plano inicial não for encontrado
 */
export async function createUser(
  db: PrismaClient,
  { name, email, password }: { name: string; email: string; password: string },
) {
  // Verifica se o email já existe
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(ErrorCode.CONFLICT, 409, 'E-mail já cadastrado');
  }

  // Busca o plano 'beta' como inicial
  const plan = await db.plan.findUnique({ where: { slug: 'beta' } });
  if (!plan) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      404,
      'Plano Inicial não encontrado',
    );
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Cria o usuário associado ao plano
  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      plan_id: plan.id,
    },
  });

  // Cria workspace padrão para o novo usuário
  await createWorkspace(db, {
    name: 'Meu Workspace',
    currency: 'BRL',
    userId: user.id,
  });

  return user;
}

import { AppError, ErrorCode } from "@errors/app-error";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

interface ChangePasswordInput {
	currentPassword: string;
	newPassword: string;
}

export async function changePassword(
	db: PrismaClient,
	userId: string,
	{ currentPassword, newPassword }: ChangePasswordInput,
): Promise<void> {
	const user = await db.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new AppError(ErrorCode.NOT_FOUND, 404, "Usuário não encontrado");
	}

	const passwordMatches = await bcrypt.compare(currentPassword, user.password);

	if (!passwordMatches) {
		throw new AppError(ErrorCode.UNAUTHORIZED, 401, "Senha atual incorreta");
	}

	const hashedPassword = await bcrypt.hash(newPassword, 10);

	await db.$transaction([
		db.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		}),
		db.token.deleteMany({
			where: { user_id: userId },
		}),
	]);
}

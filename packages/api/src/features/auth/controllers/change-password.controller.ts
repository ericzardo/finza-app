import { AppError, ErrorCode } from "@errors/app-error";
import { changePassword } from "@features/auth/usecases/change-password";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const COOKIE_NAME = "finza_token";

export async function changePasswordController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	if (!request.user?.sub) {
		throw new AppError(
			ErrorCode.UNAUTHORIZED,
			401,
			"Token de autenticação não encontrado",
		);
	}

	const body = request.body as {
		currentPassword: string;
		newPassword: string;
	};

	await changePassword(fastify.prisma, request.user.sub, body);

	reply.clearCookie(COOKIE_NAME, { path: "/" });

	return reply.code(200).send({ message: "Senha alterada com sucesso" });
}

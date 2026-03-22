import { AppError, ErrorCode } from "@errors/app-error";
import { updateProfile } from "@features/users/usecases/update-profile";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function updateProfileController(
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
		name?: string;
		avatar_url?: string;
		email?: string;
	};

	const profile = await updateProfile(fastify.prisma, request.user.sub, body);

	return reply.code(200).send(profile);
}

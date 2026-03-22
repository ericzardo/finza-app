import { AppError, ErrorCode } from "@errors/app-error";
import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
	interface FastifyRequest {
		workspaceId?: string;
		workspaceMemberRole?: "OWNER" | "EDITOR" | "VIEWER";
	}

	interface FastifyInstance {
		validateWorkspace: (request: FastifyRequest) => Promise<void>;
	}
}

const workspaceGuardPlugin: FastifyPluginAsync = async (
	fastify: FastifyInstance,
) => {
	fastify.decorate("validateWorkspace", async (request: FastifyRequest) => {
		const workspaceId = request.headers["x-workspace-id"];

		if (!workspaceId || typeof workspaceId !== "string") {
			throw new AppError(
				ErrorCode.BAD_REQUEST,
				400,
				"Header x-workspace-id é obrigatório",
			);
		}

		if (!request.user?.sub) {
			throw new AppError(
				ErrorCode.UNAUTHORIZED,
				401,
				"Token de autenticação não encontrado",
			);
		}

		const member = await fastify.prisma.workspaceMember.findUnique({
			where: {
				workspace_id_user_id: {
					workspace_id: workspaceId,
					user_id: request.user.sub,
				},
			},
		});

		if (!member) {
			throw new AppError(
				ErrorCode.FORBIDDEN,
				403,
				"Você não tem permissão para acessar este workspace",
			);
		}

		request.workspaceId = workspaceId;
		request.workspaceMemberRole = member.role;
	});
};

export default fp(workspaceGuardPlugin, { name: "workspace-guard" });

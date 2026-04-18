import { deleteDistribution } from "@features/transactions/usecases/delete-distribution";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function deleteDistributionController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { transactionId, allocationId } = request.params as {
		transactionId: string;
		allocationId: string;
	};

	await deleteDistribution(fastify.prisma, {
		allocationId,
		transactionId,
		workspaceId: request.workspaceId as string,
	});

	return reply.code(204).send();
}

import { getTransactionDistributions } from "@features/transactions/usecases/get-transaction-distributions";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function getTransactionDistributionsController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { transactionId } = request.params as { transactionId: string };

	const result = await getTransactionDistributions(fastify.prisma, {
		transactionId,
		workspaceId: request.workspaceId as string,
	});

	return reply.code(200).send(result);
}

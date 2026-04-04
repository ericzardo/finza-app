import { deleteTransaction } from "@features/transactions/usecases/delete-transaction";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function deleteTransactionController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { transactionId } = request.params as { transactionId: string };

	await deleteTransaction(fastify.prisma, {
		workspaceId: request.workspaceId as string,
		transactionId,
	});

	return reply.code(204).send();
}

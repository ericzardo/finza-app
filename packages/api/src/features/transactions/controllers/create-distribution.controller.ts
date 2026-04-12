import { createDistribution } from "@features/transactions/usecases/create-distribution";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function createDistributionController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { transactionId } = request.params as { transactionId: string };
	const body = request.body as {
		distributions: Array<{ bucketId: string; amount: number }>;
	};

	const result = await createDistribution(fastify.prisma, {
		transactionId,
		workspaceId: request.workspaceId as string,
		distributions: body.distributions,
	});

	return reply.code(201).send(result);
}

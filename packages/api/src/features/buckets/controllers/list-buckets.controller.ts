import { listBuckets } from "@features/buckets/usecases/list-buckets";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function listBucketsController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { startDate, endDate } = request.query as {
		startDate?: string;
		endDate?: string;
	};

	const buckets = await listBuckets(fastify.prisma, {
		workspaceId: request.workspaceId as string,
		startDate,
		endDate,
	});

	return reply.code(200).send(buckets);
}

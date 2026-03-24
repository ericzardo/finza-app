import { listBuckets } from "@features/buckets/usecases/list-buckets";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function listBucketsController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const buckets = await listBuckets(fastify.prisma, {
		workspaceId: request.workspaceId as string,
	});

	return reply.code(200).send(buckets);
}

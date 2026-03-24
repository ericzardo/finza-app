import { deleteBucket } from "@features/buckets/usecases/delete-bucket";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function deleteBucketController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { bucketId } = request.params as { bucketId: string };

	await deleteBucket(fastify.prisma, {
		workspaceId: request.workspaceId as string,
		bucketId,
	});

	return reply.code(204).send();
}

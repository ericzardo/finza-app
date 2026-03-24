import { updateBucket } from "@features/buckets/usecases/update-bucket";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function updateBucketController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const { bucketId } = request.params as { bucketId: string };
	const body = request.body as {
		name?: string;
		type?: "SPENDING" | "INVESTMENT";
		allocation_percentage?: number;
	};

	const bucket = await updateBucket(fastify.prisma, {
		workspaceId: request.workspaceId as string,
		bucketId,
		name: body.name,
		type: body.type,
		allocation_percentage: body.allocation_percentage,
	});

	return reply.code(200).send(bucket);
}

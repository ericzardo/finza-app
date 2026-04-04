import { createTransaction } from "@features/transactions/usecases/create-transaction";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function createTransactionController(
	request: FastifyRequest,
	reply: FastifyReply,
	fastify: FastifyInstance,
) {
	const body = request.body as {
		type: "INCOME" | "EXPENSE" | "TRANSFER";
		amount: number;
		description: string;
		date: Date;
		is_paid: boolean;
		bucket_id?: string;
		bank_account_id?: string;
		credit_card_id?: string;
		category_id?: string;
	};

	const transaction = await createTransaction(fastify.prisma, {
		workspaceId: request.workspaceId as string,
		...body,
	});

	return reply.code(201).send(transaction);
}

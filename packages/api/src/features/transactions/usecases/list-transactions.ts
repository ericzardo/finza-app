import type { TransactionResult } from "@features/transactions/usecases/create-transaction";
import type { PrismaClient, TransactionType } from "@prisma/client";

interface ListTransactionsInput {
	workspaceId: string;
	startDate?: Date;
	endDate?: Date;
	bucketId?: string;
	isPaid?: boolean;
	type?: TransactionType;
	page: number;
	limit: number;
}

interface ListTransactionsResult {
	data: TransactionResult[];
	total: number;
	page: number;
	limit: number;
}

export async function listTransactions(
	db: PrismaClient,
	input: ListTransactionsInput,
): Promise<ListTransactionsResult> {
	const {
		workspaceId,
		startDate,
		endDate,
		bucketId,
		isPaid,
		type,
		page,
		limit,
	} = input;

	const where = {
		workspace_id: workspaceId,
		is_internal: false,
		...(startDate || endDate
			? {
					date: {
						...(startDate ? { gte: startDate } : {}),
						...(endDate ? { lte: endDate } : {}),
					},
				}
			: {}),
		...(bucketId ? { bucket_id: bucketId } : {}),
		...(isPaid !== undefined ? { is_paid: isPaid } : {}),
		...(type ? { type } : {}),
	};

	const [transactions, total] = await Promise.all([
		db.transaction.findMany({
			where,
			orderBy: { date: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		}),
		db.transaction.count({ where }),
	]);

	return {
		data: transactions.map((t) => ({
			id: t.id,
			workspace_id: t.workspace_id,
			type: t.type,
			amount: Number(t.amount),
			description: t.description,
			date: t.date.toISOString(),
			is_paid: t.is_paid,
			is_internal: t.is_internal,
			transfer_pair_id: t.transfer_pair_id,
			bucket_id: t.bucket_id,
			bank_account_id: t.bank_account_id,
			credit_card_id: t.credit_card_id,
			category_id: t.category_id,
			created_at: t.created_at.toISOString(),
		})),
		total,
		page,
		limit,
	};
}

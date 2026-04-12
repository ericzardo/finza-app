import { AppError, ErrorCode } from "@errors/app-error";
import type { PrismaClient } from "@prisma/client";
import type { AllocationResult } from "./get-transaction-distributions";

interface DistributionItem {
	bucketId: string;
	amount: number;
}

interface CreateDistributionInput {
	transactionId: string;
	workspaceId: string;
	distributions: DistributionItem[];
}

export interface CreateDistributionResult {
	allocations: AllocationResult[];
	available: number;
}

export async function createDistribution(
	db: PrismaClient,
	{ transactionId, workspaceId, distributions }: CreateDistributionInput,
): Promise<CreateDistributionResult> {
	const transaction = await db.transaction.findFirst({
		where: { id: transactionId, workspace_id: workspaceId },
		include: { bucket: true },
	});

	if (!transaction) {
		throw new AppError(ErrorCode.NOT_FOUND, 404, "Transação não encontrada");
	}

	if (transaction.type !== "INCOME") {
		throw new AppError(
			ErrorCode.BAD_REQUEST,
			400,
			"Apenas transações do tipo INCOME podem ser distribuídas",
		);
	}

	if (!transaction.bucket || transaction.bucket.type !== "INBOX") {
		throw new AppError(
			ErrorCode.BAD_REQUEST,
			400,
			"Apenas transações do Caixa de Entrada (INBOX) podem ser distribuídas",
		);
	}

	// Calcular saldo disponível
	const existingAllocations = await db.transactionAllocation.findMany({
		where: { transaction_id: transactionId },
	});

	const alreadyDistributed = existingAllocations.reduce(
		(sum, a) => sum + Number(a.amount),
		0,
	);

	const total = Number(transaction.amount);
	const currentAvailable = total - alreadyDistributed;
	const requestedTotal = distributions.reduce((sum, d) => sum + d.amount, 0);

	if (requestedTotal > currentAvailable) {
		throw new AppError(
			ErrorCode.BAD_REQUEST,
			400,
			`Saldo insuficiente para distribuição. Disponível: ${currentAvailable}, solicitado: ${requestedTotal}`,
		);
	}

	// Validar que todos os buckets destino existem e pertencem ao workspace
	for (const dist of distributions) {
		const bucket = await db.bucket.findFirst({
			where: { id: dist.bucketId, workspace_id: workspaceId },
		});
		if (!bucket) {
			throw new AppError(
				ErrorCode.NOT_FOUND,
				404,
				`Caixa de propósito não encontrado: ${dist.bucketId}`,
			);
		}
	}

	// Executar tudo em transação atômica
	const createdAllocations = await db.$transaction(async (tx) => {
		const results: AllocationResult[] = [];

		for (const dist of distributions) {
			const pairId = crypto.randomUUID();

			// Criar alocação
			const allocation = await tx.transactionAllocation.create({
				data: {
					transaction_id: transactionId,
					bucket_id: dist.bucketId,
					amount: dist.amount,
					allocation_type: "DISTRIBUTION",
					transfer_pair_id: pairId,
				},
			});

			// Criar par de transações internas
			await tx.transaction.createMany({
				data: [
					{
						workspace_id: workspaceId,
						type: "EXPENSE",
						amount: dist.amount,
						description: `Distribuição: ${transaction.description}`,
						date: transaction.date,
						is_paid: true,
						internal_type: "DISTRIBUTION",
						transfer_pair_id: pairId,
						source_transaction_id: transactionId,
						bucket_id: transaction.bucket_id,
					},
					{
						workspace_id: workspaceId,
						type: "INCOME",
						amount: dist.amount,
						description: `Distribuição: ${transaction.description}`,
						date: transaction.date,
						is_paid: true,
						internal_type: "DISTRIBUTION",
						transfer_pair_id: pairId,
						source_transaction_id: transactionId,
						bucket_id: dist.bucketId,
					},
				],
			});

			results.push({
				id: allocation.id,
				transaction_id: allocation.transaction_id,
				bucket_id: allocation.bucket_id,
				amount: Number(allocation.amount),
				allocation_type: allocation.allocation_type,
				transfer_pair_id: allocation.transfer_pair_id,
			});
		}

		return results;
	});

	const newAvailable = currentAvailable - requestedTotal;

	return {
		allocations: createdAllocations,
		available: newAvailable,
	};
}

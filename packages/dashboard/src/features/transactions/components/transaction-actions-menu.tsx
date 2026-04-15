import { Button } from "@components/ui/button";
import { DistributionModal } from "@features/distributions/components/distribution-modal";
import { DeleteTransactionAlert } from "@features/transactions/components/delete-transaction-alert";
import type { Transaction } from "@features/transactions/types";
import { getTransactionsTransactionidDistributionsQueryOptions } from "@finza/api-client";
import { useQueryClient } from "@tanstack/react-query";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import { Loader2, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TransactionActionsMenuProps {
	transaction: Transaction;
	onEdit: (transaction: Transaction) => void;
	canDistribute?: boolean;
}

export function TransactionActionsMenu({
	transaction,
	onEdit,
	canDistribute = false,
}: TransactionActionsMenuProps) {
	const queryClient = useQueryClient();
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [showDistributionModal, setShowDistributionModal] = useState(false);
	const [distributionAvailableAmount, setDistributionAvailableAmount] =
		useState<number | null>(null);
	const [isPreparingDistribution, setIsPreparingDistribution] = useState(false);

	async function handleOpenDistribution() {
		setIsPreparingDistribution(true);

		try {
			const distributionData = await queryClient.fetchQuery(
				getTransactionsTransactionidDistributionsQueryOptions(transaction.id),
			);

			setDistributionAvailableAmount(distributionData.available);
			setShowDistributionModal(true);
		} catch (error) {
			const message =
				(
					error as {
						response?: { data?: { message?: string } };
					}
				).response?.data?.message ?? "Erro ao carregar saldo distribuível.";
			toast.error(message);
		} finally {
			setIsPreparingDistribution(false);
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
					>
						<MoreHorizontal className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{canDistribute && (
						<>
							<DropdownMenuItem
								onClick={() => {
									void handleOpenDistribution();
								}}
								disabled={isPreparingDistribution}
							>
								{isPreparingDistribution ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Wallet className="size-4" />
								)}
								Distribuir
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem onClick={() => onEdit(transaction)}>
						<Pencil className="size-4" />
						Editar
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setShowDeleteAlert(true)}
					>
						<Trash2 className="size-4" />
						Excluir
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DeleteTransactionAlert
				transaction={transaction}
				open={showDeleteAlert}
				onOpenChange={setShowDeleteAlert}
			/>

			{distributionAvailableAmount !== null && (
				<DistributionModal
					isOpen={showDistributionModal}
					onClose={() => setShowDistributionModal(false)}
					availableAmount={distributionAvailableAmount}
					transactionId={transaction.id}
				/>
			)}
		</>
	);
}

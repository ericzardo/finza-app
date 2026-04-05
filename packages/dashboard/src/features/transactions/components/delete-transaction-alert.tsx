import type { Transaction } from "@features/transactions/types";
import {
	getBucketsQueryKey,
	getTransactionsQueryKey,
	useDeleteTransactionsTransactionid,
} from "@finza/api-client/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteTransactionAlertProps {
	transaction: Transaction | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteTransactionAlert({
	transaction,
	open,
	onOpenChange,
}: DeleteTransactionAlertProps) {
	const queryClient = useQueryClient();

	const { mutate: deleteTx, isPending } = useDeleteTransactionsTransactionid({
		mutation: {
			onSuccess: () => {
				toast.success("Transação removida.");
				queryClient.invalidateQueries({
					queryKey: getTransactionsQueryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: getBucketsQueryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: [{ url: "/workspaces/:workspaceId/summary" }],
				});
				onOpenChange(false);
			},
			onError: (error) => {
				const message =
					error.response?.data?.message ?? "Erro ao remover transação.";
				toast.error(message);
			},
		},
	});

	function handleConfirm() {
		if (!transaction) return;
		deleteTx({ transactionId: transaction.id });
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Excluir transação</AlertDialogTitle>
					<AlertDialogDescription>
						Tem certeza? Essa ação afetará o saldo dos seus caixas.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleConfirm}
						disabled={isPending}
					>
						{isPending && <Loader2 className="size-4 animate-spin" />}
						Excluir
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

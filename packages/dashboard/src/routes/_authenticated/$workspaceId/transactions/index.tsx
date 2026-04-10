import { MonthRangePicker } from "@components/shared/month-range-picker";
import { Button } from "@components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { CreateTransactionDialog } from "@features/transactions/components/create-transaction-dialog";
import { ImportTransactionsDialog } from "@features/transactions/components/import-transactions-dialog";
import { InternalTransactionTable } from "@features/transactions/components/internal-transaction-table";
import { TransactionTable } from "@features/transactions/components/transaction-table";
import {
	InternalTransactionsTableSkeleton,
	TransactionsSkeleton,
	TransactionsTableSkeleton,
} from "@features/transactions/components/transactions-skeleton";
import { UpdateTransactionDialog } from "@features/transactions/components/update-transaction-dialog";
import type { Transaction } from "@features/transactions/types";
import {
	getTransactionsQueryOptions,
	useGetTransactions,
} from "@finza/api-client";
import {
	getTransactionsInternalQueryOptions,
	useGetTransactionsInternal,
} from "@finza/api-client/hooks";
import { useIsMobile } from "@hooks/use-mobile";
import { getWorkspaceQueryOptions } from "@lib/api-client/workspace-queries";
import { getMonthRange } from "@lib/date";
import { setPageMeta } from "@lib/seo";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
	start: z.string().optional(),
	end: z.string().optional(),
});

export const Route = createFileRoute(
	"/_authenticated/$workspaceId/transactions/",
)({
	validateSearch: searchSchema,
	beforeLoad: () => {
		setPageMeta({
			title: "Finza | Transações",
			description:
				"Visualize e gerencie as transações do seu workspace. Registre receitas e despesas.",
		});
	},
	loaderDeps: ({ search }) => ({
		start: search.start,
		end: search.end,
	}),
	loader: ({ context, deps }) => {
		const defaults = getMonthRange();
		const startDate = deps.start ?? defaults.startDate;
		const endDate = deps.end ?? defaults.endDate;
		return Promise.all([
			context.queryClient.ensureQueryData(
				getTransactionsQueryOptions({ startDate, endDate }),
			),
			context.queryClient.ensureQueryData(
				getTransactionsInternalQueryOptions({ startDate, endDate }),
			),
		]);
	},
	pendingComponent: TransactionsSkeleton,
	component: TransactionsPage,
});

function TransactionsPage() {
	const { workspaceId } = Route.useParams();
	const { start, end } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [createOpen, setCreateOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [activeTab, setActiveTab] = useState("transactions");
	const isMobile = useIsMobile();

	const defaults = getMonthRange();
	const startDate = start ?? defaults.startDate;
	const endDate = end ?? defaults.endDate;

	const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId));
	const currency = workspace?.currency ?? "BRL";

	const {
		data: transactionsData,
		isLoading,
		isError,
		refetch,
	} = useGetTransactions({ startDate, endDate });

	const { data: internalData, isLoading: isLoadingInternal } =
		useGetTransactionsInternal({ startDate, endDate });

	const transactions = transactionsData?.data ?? [];
	const internalTransactions = internalData?.data ?? [];

	function handleDateChange(newStart: string, newEnd: string) {
		navigate({
			search: { start: newStart, end: newEnd },
			replace: true,
			resetScroll: false,
		});
	}

	if (isError) {
		return (
			<div className="shell-container py-8">
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/5 py-16 text-center">
					<p className="text-sm font-medium text-destructive">
						Erro ao carregar as transações
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Não foi possível buscar os dados. Tente novamente.
					</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Tentar novamente
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="shell-container py-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Transações
					</h1>
					<p className="text-sm text-muted-foreground">
						Registre e acompanhe as movimentações do seu patrimônio
					</p>
				</div>
				<div className="flex flex-col-reverse gap-3 md:flex-row md:items-start">
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setImportOpen(true)}
							size={isMobile ? "lg" : "default"}
							className="w-full shrink-0 md:w-auto"
						>
							<Upload className="size-4" />
							Importar
						</Button>
						<Button
							variant="accent"
							onClick={() => setCreateOpen(true)}
							size={isMobile ? "lg" : "default"}
							className="w-full shrink-0 md:w-auto"
						>
							<Plus className="size-4" />
							Nova transação
						</Button>
					</div>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
				<TabsList variant="line" className="w-full">
					<span className="w-fit">
						<TabsTrigger value="transactions">Transações</TabsTrigger>
						<TabsTrigger value="internal">Movimentações Internas</TabsTrigger>
					</span>

					<div className="flex w-full flex-1 justify-end	">
						<MonthRangePicker
							startDate={startDate}
							endDate={endDate}
							onChange={handleDateChange}
						/>
					</div>


				</TabsList>

				<TabsContent value="transactions" className="mt-4">
					{isLoading ? (
						<TransactionsTableSkeleton />
					) : (
						<TransactionTable
							transactions={transactions}
							currency={currency}
							onEdit={setEditingTransaction}
						/>
					)}
				</TabsContent>

				<TabsContent value="internal" className="mt-4">
					{isLoadingInternal ? (
						<InternalTransactionsTableSkeleton />
					) : (
						<InternalTransactionTable
							transactions={internalTransactions}
							currency={currency}
						/>
					)}
				</TabsContent>
			</Tabs>

			<CreateTransactionDialog open={createOpen} onOpenChange={setCreateOpen} />

			<ImportTransactionsDialog open={importOpen} onOpenChange={setImportOpen} />

			<UpdateTransactionDialog
				transaction={editingTransaction}
				open={editingTransaction !== null}
				onOpenChange={(open) => {
					if (!open) setEditingTransaction(null);
				}}
			/>
		</div>
	);
}

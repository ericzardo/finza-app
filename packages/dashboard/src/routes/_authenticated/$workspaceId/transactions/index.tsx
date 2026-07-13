import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { CreateTransactionDialog } from "@features/transactions/components/create-transaction-dialog";
import { ImportTransactionsDialog } from "@features/transactions/components/import-transactions-dialog";
import { InternalTransactionTable } from "@features/transactions/components/internal-transaction-table";
import {
	type TransactionFilters,
	TransactionFiltersDialog,
} from "@features/transactions/components/transaction-filters-dialog";
import { TransactionPagination } from "@features/transactions/components/transaction-pagination";
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
import { setPageMeta } from "@lib/seo";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, SlidersHorizontal, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

const DEFAULT_LIMIT = 20;

const searchSchema = z.object({
	start: z.string().optional(),
	end: z.string().optional(),
	bucketId: z.string().optional(),
	type: z.enum(["INCOME", "EXPENSE"]).optional(),
	isPaid: z.enum(["true", "false"]).optional(),
	page: z.coerce.number().int().positive().optional().default(1),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(100)
		.optional()
		.default(DEFAULT_LIMIT),
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
		bucketId: search.bucketId,
		type: search.type,
		isPaid: search.isPaid,
		page: search.page,
		limit: search.limit,
	}),
	loader: ({ context, deps }) => {
		const isPaidBool =
			deps.isPaid === undefined ? undefined : deps.isPaid === "true";
		return Promise.all([
			context.queryClient.ensureQueryData(
				getTransactionsQueryOptions({
					startDate: deps.start,
					endDate: deps.end,
					bucketId: deps.bucketId,
					type: deps.type,
					isPaid: isPaidBool,
					page: deps.page,
					limit: deps.limit,
				}),
			),
			context.queryClient.ensureQueryData(
				getTransactionsInternalQueryOptions({
					startDate: deps.start,
					endDate: deps.end,
				}),
			),
		]);
	},
	pendingComponent: TransactionsSkeleton,
	component: TransactionsPage,
});

function TransactionsPage() {
	const { workspaceId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [createOpen, setCreateOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [activeTab, setActiveTab] = useState("transactions");
	const isMobile = useIsMobile();

	const page = search.page ?? 1;
	const limit = search.limit ?? DEFAULT_LIMIT;

	const { data: workspace } = useQuery(getWorkspaceQueryOptions(workspaceId));
	const currency = workspace?.currency ?? "BRL";

	const isPaidBool =
		search.isPaid === undefined ? undefined : search.isPaid === "true";

	const {
		data: transactionsData,
		isLoading,
		isError,
		refetch,
	} = useGetTransactions({
		startDate: search.start,
		endDate: search.end,
		bucketId: search.bucketId,
		type: search.type,
		isPaid: isPaidBool,
		page,
		limit,
	});

	const { data: internalData, isLoading: isLoadingInternal } =
		useGetTransactionsInternal({
			startDate: search.start,
			endDate: search.end,
		});

	const transactions = transactionsData?.data ?? [];
	const internalTransactions = internalData?.data ?? [];
	const total = transactionsData?.total ?? 0;

	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (search.start || search.end) count++;
		if (search.bucketId) count++;
		if (search.type) count++;
		if (search.isPaid !== undefined) count++;
		return count;
	}, [search.start, search.end, search.bucketId, search.type, search.isPaid]);

	function handleApplyFilters(filters: TransactionFilters) {
		navigate({
			search: {
				start: filters.start,
				end: filters.end,
				bucketId: filters.bucketId,
				type: filters.type,
				isPaid: filters.isPaid,
				page: 1,
				limit,
			},
			replace: true,
			resetScroll: false,
		});
	}

	function handlePageChange(newPage: number) {
		navigate({
			search: (prev) => ({ ...prev, page: newPage }),
			replace: true,
			resetScroll: false,
		});
	}

	function handleLimitChange(newLimit: number) {
		navigate({
			search: (prev) => ({ ...prev, limit: newLimit, page: 1 }),
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

	const filtersKey = JSON.stringify({
		start: search.start,
		end: search.end,
		bucketId: search.bucketId,
		type: search.type,
		isPaid: search.isPaid,
	});

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
					<div className="flex flex-col-reverse md:flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => setFiltersOpen(true)}
							size={isMobile ? "lg" : "default"}
							className="relative w-full shrink-0 md:w-auto"
						>
							<SlidersHorizontal className="size-4" />
							Filtros
							{activeFilterCount > 0 && (
								<Badge
									variant="default"
									className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
								>
									{activeFilterCount}
								</Badge>
							)}
						</Button>
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
				<TabsList variant="line">
					<span className="w-fit">
						<TabsTrigger value="transactions">Transações</TabsTrigger>
						<TabsTrigger value="internal">Movimentações Internas</TabsTrigger>
					</span>
				</TabsList>

				<TabsContent value="transactions" className="mt-4">
					{isLoading ? (
						<TransactionsTableSkeleton />
					) : (
						<>
							<TransactionTable
								transactions={transactions}
								currency={currency}
								onEdit={setEditingTransaction}
							/>
							{transactions.length > 0 && (
								<TransactionPagination
									page={page}
									limit={limit}
									total={total}
									onPageChange={handlePageChange}
									onLimitChange={handleLimitChange}
								/>
							)}
						</>
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

			<TransactionFiltersDialog
				key={filtersKey}
				open={filtersOpen}
				onOpenChange={setFiltersOpen}
				filters={{
					start: search.start,
					end: search.end,
					bucketId: search.bucketId,
					type: search.type,
					isPaid: search.isPaid,
				}}
				onApply={handleApplyFilters}
			/>
		</div>
	);
}

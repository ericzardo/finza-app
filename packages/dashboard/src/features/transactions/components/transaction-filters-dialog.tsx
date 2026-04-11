import { Button } from "@components/ui/button";
import { DatePicker } from "@components/ui/date-picker";
import { Label } from "@components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/select";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@ui/responsive-dialog";
import type { Bucket } from "@features/buckets/types";
import { useGetBuckets } from "@finza/api-client/hooks";
import { useIsMobile } from "@hooks/use-mobile";
import { useState } from "react";

const ALL_VALUE = "__all__";

export interface TransactionFilters {
	start?: string;
	end?: string;
	bucketId?: string;
	type?: "INCOME" | "EXPENSE";
	isPaid?: "true" | "false";
}

export interface TransactionFiltersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: TransactionFilters;
	onApply: (filters: TransactionFilters) => void;
}

function getToday() {
	return new Date().toISOString().split("T")[0];
}

export function TransactionFiltersDialog({
	open,
	onOpenChange,
	filters,
	onApply,
}: TransactionFiltersDialogProps) {
	const isMobile = useIsMobile();
	const { data: bucketsData } = useGetBuckets<Bucket[]>();
	const buckets = bucketsData ?? [];

	const [start, setStart] = useState(filters.start ?? "");
	const [end, setEnd] = useState(filters.end ?? "");
	const [bucketId, setBucketId] = useState(filters.bucketId ?? ALL_VALUE);
	const [type, setType] = useState<string>(filters.type ?? ALL_VALUE);
	const [isPaid, setIsPaid] = useState<string>(
		filters.isPaid ?? ALL_VALUE,
	);

	function handleApply() {
		onApply({
			start: start || undefined,
			end: end || undefined,
			bucketId: bucketId === ALL_VALUE ? undefined : bucketId,
			type:
				type === ALL_VALUE
					? undefined
					: (type as "INCOME" | "EXPENSE"),
			isPaid:
				isPaid === ALL_VALUE
					? undefined
					: (isPaid as "true" | "false"),
		});
		onOpenChange(false);
	}

	function handleClear() {
		onApply({});
		onOpenChange(false);
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Filtros</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Refine a busca das suas transações
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<div className="space-y-4">
					{/* Período */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="filter-start">De</Label>
							<DatePicker
								value={start}
								onChange={setStart}
								placeholder="Data inicial"
								className="w-full"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="filter-end">Até</Label>
							<DatePicker
								value={end}
								onChange={setEnd}
								placeholder="Data final"
								max={getToday()}
								className="w-full"
							/>
						</div>
					</div>

					{/* Tipo + Status */}
					<div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
						<div className="space-y-2">
							<Label htmlFor="filter-type">Tipo</Label>
							<Select value={type} onValueChange={setType}>
								<SelectTrigger id="filter-type">
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_VALUE}>
										Todos
									</SelectItem>
									<SelectItem value="INCOME">
										Receita
									</SelectItem>
									<SelectItem value="EXPENSE">
										Despesa
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="filter-status">Status</Label>
							<Select value={isPaid} onValueChange={setIsPaid}>
								<SelectTrigger id="filter-status">
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_VALUE}>
										Todos
									</SelectItem>
									<SelectItem value="true">Pagas</SelectItem>
									<SelectItem value="false">
										Pendentes
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Caixa */}
					<div className="space-y-2">
						<Label htmlFor="filter-bucket">Caixa</Label>
						<Select value={bucketId} onValueChange={setBucketId}>
							<SelectTrigger id="filter-bucket">
								<SelectValue placeholder="Todas as caixas" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_VALUE}>
									Todas as caixas
								</SelectItem>
								{buckets.map((bucket) => (
									<SelectItem key={bucket.id} value={bucket.id}>
										{bucket.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<ResponsiveDialogFooter>
					<Button
						type="button"
						variant="ghost"
						size={isMobile ? "lg" : "default"}
						onClick={handleClear}
					>
						Limpar filtros
					</Button>
					<Button
						type="button"
						variant="accent"
						size={isMobile ? "lg" : "default"}
						onClick={handleApply}
					>
						Aplicar filtros
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

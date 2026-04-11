import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@components/ui/sheet";
import type { Bucket } from "@features/buckets/types";
import { useGetBuckets } from "@finza/api-client/hooks";
import { useState } from "react";

const ALL_VALUE = "__all__";

export interface TransactionFilters {
	start?: string;
	end?: string;
	bucketId?: string;
	type?: "INCOME" | "EXPENSE";
	isPaid?: boolean;
}

export interface TransactionFiltersDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: TransactionFilters;
	onApply: (filters: TransactionFilters) => void;
}

function getToday() {
	return new Date().toISOString().split("T")[0];
}

export function TransactionFiltersDrawer({
	open,
	onOpenChange,
	filters,
	onApply,
}: TransactionFiltersDrawerProps) {
	const { data: bucketsData } = useGetBuckets<Bucket[]>();
	const buckets = bucketsData ?? [];

	const [start, setStart] = useState(filters.start ?? "");
	const [end, setEnd] = useState(filters.end ?? "");
	const [bucketId, setBucketId] = useState(filters.bucketId ?? ALL_VALUE);
	const [type, setType] = useState<string>(filters.type ?? ALL_VALUE);
	const [isPaid, setIsPaid] = useState<string>(
		filters.isPaid === undefined ? ALL_VALUE : String(filters.isPaid),
	);

	function syncFromProps() {
		setStart(filters.start ?? "");
		setEnd(filters.end ?? "");
		setBucketId(filters.bucketId ?? ALL_VALUE);
		setType(filters.type ?? ALL_VALUE);
		setIsPaid(
			filters.isPaid === undefined ? ALL_VALUE : String(filters.isPaid),
		);
	}

	function handleApply() {
		onApply({
			start: start || undefined,
			end: end || undefined,
			bucketId: bucketId === ALL_VALUE ? undefined : bucketId,
			type:
				type === ALL_VALUE
					? undefined
					: (type as "INCOME" | "EXPENSE"),
			isPaid: isPaid === ALL_VALUE ? undefined : isPaid === "true",
		});
		onOpenChange(false);
	}

	function handleClear() {
		onApply({});
		onOpenChange(false);
	}

	function handleOpenChange(next: boolean) {
		if (next) {
			syncFromProps();
		}
		onOpenChange(next);
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent side="right" className="flex flex-col">
				<SheetHeader>
					<SheetTitle>Filtros</SheetTitle>
					<SheetDescription>
						Refine a busca das suas transações
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
					<div className="space-y-3">
						<Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Período
						</Label>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="filter-start">De</Label>
								<Input
									id="filter-start"
									type="date"
									value={start}
									onChange={(e) => setStart(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="filter-end">Até</Label>
								<Input
									id="filter-end"
									type="date"
									value={end}
									max={getToday()}
									onChange={(e) => setEnd(e.target.value)}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-1.5">
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

					<div className="space-y-1.5">
						<Label htmlFor="filter-type">Tipo</Label>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger id="filter-type">
								<SelectValue placeholder="Todos" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_VALUE}>Todos</SelectItem>
								<SelectItem value="INCOME">Receita</SelectItem>
								<SelectItem value="EXPENSE">Despesa</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="filter-status">Status</Label>
						<Select value={isPaid} onValueChange={setIsPaid}>
							<SelectTrigger id="filter-status">
								<SelectValue placeholder="Todos" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_VALUE}>Todos</SelectItem>
								<SelectItem value="true">Pagas</SelectItem>
								<SelectItem value="false">Pendentes</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<SheetFooter>
					<Button variant="outline" onClick={handleClear} className="flex-1">
						Limpar filtros
					</Button>
					<Button variant="accent" onClick={handleApply} className="flex-1">
						Aplicar filtros
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

import { Button } from "@components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT_OPTIONS = [20, 50, 100] as const;

export interface TransactionPaginationProps {
	page: number;
	limit: number;
	total: number;
	onPageChange: (page: number) => void;
	onLimitChange: (limit: number) => void;
}

export function TransactionPagination({
	page,
	limit,
	total,
	onPageChange,
	onLimitChange,
}: TransactionPaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const isFirstPage = page <= 1;
	const isLastPage = page >= totalPages;

	return (
		<div className="flex items-center justify-between gap-4 pt-4">
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Exibir</span>
				<Select
					value={String(limit)}
					onValueChange={(value) => onLimitChange(Number(value))}
				>
					<SelectTrigger className="w-[72px]" size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LIMIT_OPTIONS.map((opt) => (
							<SelectItem key={opt} value={String(opt)}>
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-sm text-muted-foreground">por página</span>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">
					Página {page} de {totalPages}
				</span>
				<div className="flex gap-1">
					<Button
						variant="outline"
						size="icon-sm"
						disabled={isFirstPage}
						onClick={() => onPageChange(page - 1)}
					>
						<ChevronLeft className="size-4" />
						<span className="sr-only">Página anterior</span>
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						disabled={isLastPage}
						onClick={() => onPageChange(page + 1)}
					>
						<ChevronRight className="size-4" />
						<span className="sr-only">Próxima página</span>
					</Button>
				</div>
			</div>
		</div>
	);
}

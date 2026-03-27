import type { Bucket } from "@features/buckets/types";
import { formatCurrency } from "@lib/utils";

interface WorkspaceBudgetProgressProps {
	buckets: Bucket[];
	currency: string;
}

function getAllocationMessage(pct: number): string {
	if (pct === 0) {
		return "Seu dinheiro ainda não tem um destino. Distribua suas Caixas.";
	}
	if (pct <= 25) {
		return "Quase tudo ainda está no INBOX. Dê um propósito a cada real.";
	}
	if (pct <= 50) {
		return "Você está construindo. Metade do seu capital já tem direção.";
	}
	if (pct <= 75) {
		return "Boa disciplina. Mais da metade do seu dinheiro trabalha por você.";
	}
	if (pct < 100) {
		return "Quase lá. Esvazie o INBOX e feche o mês com tudo alocado.";
	}
	return "Capital totalmente alocado. Cada real com um propósito.";
}

export function WorkspaceBudgetProgress({
	buckets,
	currency,
}: WorkspaceBudgetProgressProps) {
	if (buckets.length === 0) return null;

	const totalBalance = buckets.reduce<number>((acc, b) => {
		if (b.type === "INVESTMENT") return acc + b.current_invested;
		return acc + b.current_amount;
	}, 0);

	const allocatedBalance = buckets.reduce<number>((acc, b) => {
		if (b.type === "INBOX") return acc;
		if (b.type === "INVESTMENT") return acc + b.current_invested;
		return acc + b.current_amount;
	}, 0);

	const allocationPct =
		totalBalance > 0
			? Math.min(Math.round((allocatedBalance / totalBalance) * 100), 100)
			: 0;

	const message = getAllocationMessage(allocationPct);

	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="mb-3 flex items-center justify-between gap-4">
				<p className="text-sm text-muted-foreground">
					<span className="font-semibold text-foreground">
						{allocationPct}%
					</span>{" "}
					do seu capital está alocado com propósito
				</p>
				<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
					{formatCurrency(allocatedBalance, currency)} de{" "}
					{formatCurrency(totalBalance, currency)}
				</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all duration-500"
					style={{ width: `${allocationPct}%` }}
				/>
			</div>
			<p className="mt-2 text-xs text-muted-foreground">{message}</p>
		</div>
	);
}

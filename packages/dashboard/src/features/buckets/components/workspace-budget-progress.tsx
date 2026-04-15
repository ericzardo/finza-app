import { Button } from "@components/ui/button";
import { type Bucket, isInboxBucket } from "@features/buckets/types";
import { DistributionModal } from "@features/distributions/components/distribution-modal";
import { formatCurrency } from "@lib/utils";
import { Wallet } from "lucide-react";
import { useState } from "react";

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
	const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);

	if (buckets.length === 0) return null;

	const inboxBucket = buckets.find(isInboxBucket);
	const inboxAvailableAmount = Math.max(inboxBucket?.current_amount ?? 0, 0);
	const canDistributeInbox = inboxAvailableAmount > 0;

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
		<>
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<p className="text-sm text-muted-foreground">
						<span className="font-semibold text-foreground">
							{allocationPct}%
						</span>{" "}
						do seu capital está alocado com propósito
					</p>
					<div className="flex flex-col items-start gap-2 md:items-end">
						<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
							{formatCurrency(allocatedBalance, currency)} de{" "}
							{formatCurrency(totalBalance, currency)}
						</span>
						{canDistributeInbox && (
							<Button
								type="button"
								size="sm"
								variant="accent"
								onClick={() => setIsDistributionModalOpen(true)}
							>
								<Wallet className="size-4" />
								Distribuir saldo
							</Button>
						)}
					</div>
				</div>
				<div className="h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all duration-500"
						style={{ width: `${allocationPct}%` }}
					/>
				</div>
				<p className="mt-2 text-xs text-muted-foreground">{message}</p>
			</div>
			{canDistributeInbox && (
				<DistributionModal
					isOpen={isDistributionModalOpen}
					onClose={() => setIsDistributionModalOpen(false)}
					availableAmount={inboxAvailableAmount}
				/>
			)}
		</>
	);
}

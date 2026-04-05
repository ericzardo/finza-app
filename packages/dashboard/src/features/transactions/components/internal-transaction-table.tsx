import { Sensitive } from "@features/user/components/sensitive-value";
import { formatCurrency } from "@lib/utils";
import { cn } from "@lib/utils";
import { ArrowLeftRight } from "lucide-react";

interface InternalTransaction {
  transfer_pair_id: string;
  date: string;
  amount: number;
  from_bucket_name: string;
  to_bucket_name: string;
  reason: string;
}

interface InternalTransactionTableProps {
  transactions: InternalTransaction[];
  currency: string;
}

export function InternalTransactionTable({
  transactions,
  currency,
}: InternalTransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ArrowLeftRight className="size-10 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium text-foreground">
          Nenhuma movimentação interna
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Movimentações internas são geradas automaticamente quando há redistribuição entre caixas.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Desktop header */}
      <div className="hidden items-center gap-4 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground md:flex">
        <span className="w-20">Data</span>
        <span className="flex-1">De</span>
        <span className="flex-1">Para</span>
        <span className="w-28 text-right">Valor</span>
      </div>

      {transactions.map((tx) => (
        <InternalTransactionRow
          key={tx.transfer_pair_id}
          transaction={tx}
          currency={currency}
        />
      ))}
    </div>
  );
}

function InternalTransactionRow({
  transaction: tx,
  currency,
}: {
  transaction: InternalTransaction;
  currency: string;
}) {
  const formattedDate = new Date(tx.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0",
        "md:flex-row md:items-center md:gap-4",
      )}
    >
      {/* Mobile layout */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formattedDate}
          </span>
          <span className="truncate text-sm text-foreground">
            {tx.from_bucket_name}
            <span className="mx-1.5 text-muted-foreground">→</span>
            {tx.to_bucket_name}
          </span>
        </div>
        <Sensitive className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(tx.amount, currency)}
        </Sensitive>
      </div>

      {/* Desktop layout */}
      <span className="hidden w-20 text-sm tabular-nums text-muted-foreground md:block">
        {formattedDate}
      </span>
      <span className="hidden flex-1 truncate text-sm text-foreground md:block">
        {tx.from_bucket_name}
      </span>
      <span className="hidden flex-1 truncate text-sm text-foreground md:block">
        {tx.to_bucket_name}
      </span>
      <Sensitive className="hidden w-28 text-right text-sm font-semibold tabular-nums text-foreground md:block">
        {formatCurrency(tx.amount, currency)}
      </Sensitive>
    </div>
  );
}

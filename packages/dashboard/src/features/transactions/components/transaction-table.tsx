import { Badge } from "@components/ui/badge";
import {
  type Transaction,
  transactionTypeLabels,
} from "@features/transactions/types";
import type { Bucket } from "@features/buckets/types";
import { Sensitive } from "@features/user/components/sensitive-value";
import { TransactionActionsMenu } from "@features/transactions/components/transaction-actions-menu";
import { formatCurrency } from "@lib/utils";
import { cn } from "@lib/utils";
import { ReceiptText } from "lucide-react";
import { useGetBuckets } from "@finza/api-client/hooks";

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  currency,
  onEdit,
}: TransactionTableProps) {
  const { data: bucketsData } = useGetBuckets<Bucket[]>();
  const buckets = bucketsData ?? [];

  const bucketNameMap = new Map<string, string>();
  for (const b of buckets) {
    bucketNameMap.set(b.id, b.name);
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ReceiptText className="size-10 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium text-foreground">
          Nenhuma transação registrada
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre a primeira movimentação para começar a organizar seu
          patrimônio.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Desktop header */}
      <div className="hidden items-center gap-4 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground md:flex">
        <span className="w-20">Data</span>
        <span className="flex-1">Descrição</span>
        <span className="w-20 text-center">Tipo</span>
        <span className="w-28 text-right">Valor</span>
        <span className="w-32">Caixa</span>
        <span className="w-10" />
      </div>

      {transactions.map((tx) => (
        <TransactionRow
          key={tx.id}
          transaction={tx}
          currency={currency}
          bucketName={
            tx.bucket_id
              ? (bucketNameMap.get(tx.bucket_id) ?? "—")
              : "Caixa de Entrada"
          }
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function TransactionRow({
  transaction: tx,
  currency,
  bucketName,
  onEdit,
}: {
  transaction: Transaction;
  currency: string;
  bucketName: string;
  onEdit: (transaction: Transaction) => void;
}) {
  const isIncome = tx.type === "INCOME";
  const isPendingExpense = tx.type === "EXPENSE" && !tx.is_paid;
  const formattedDate = new Date(tx.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div className="group flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0 md:flex-row md:items-center md:gap-4">
      {/* Mobile layout */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="text-sm tabular-nums text-muted-foreground">
            {formattedDate}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isIncome
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400",
            )}
          >
            {transactionTypeLabels[tx.type]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Sensitive
            className={cn(
              "text-sm font-semibold tabular-nums",
              isIncome
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-foreground",
            )}
          >
            {isIncome ? "+ " : "- "}
            {formatCurrency(tx.amount, currency)}
          </Sensitive>
          <TransactionActionsMenu transaction={tx} onEdit={onEdit} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm text-foreground">{tx.description}</p>
          {isPendingExpense && (
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
            >
              Pendente
            </Badge>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <span className="hidden w-20 text-sm tabular-nums text-muted-foreground md:block">
        {formattedDate}
      </span>
      <div className="hidden flex-1 min-w-0 items-center gap-1.5 md:flex">
        <p className="truncate text-sm text-foreground">
          {tx.description}
        </p>
        {isPendingExpense && (
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
          >
            Pendente
          </Badge>
        )}
      </div>
      <span className="hidden w-20 text-center md:block">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            isIncome
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400",
          )}
        >
          {transactionTypeLabels[tx.type]}
        </Badge>
      </span>
      <Sensitive
        className={cn(
          "hidden w-28 text-right text-sm font-semibold tabular-nums md:block",
          isIncome
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-foreground",
        )}
      >
        {isIncome ? "+ " : "- "}
        {formatCurrency(tx.amount, currency)}
      </Sensitive>
      <span className="hidden w-32 truncate text-xs text-muted-foreground md:block">
        {bucketName}
      </span>
      <span className="hidden w-10 md:block">
        <TransactionActionsMenu transaction={tx} onEdit={onEdit} />
      </span>
    </div>
  );
}

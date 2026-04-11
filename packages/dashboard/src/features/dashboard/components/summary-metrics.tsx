import { Wallet, Clock, TrendingUp } from 'lucide-react'
import { Sensitive } from '@features/user/components/sensitive-value'
import { formatCurrency } from '@lib/utils'

interface SummaryMetricsProps {
  totalBalance: number
  totalPending: number
  totalInvested: number
  currency: string
}

export function SummaryMetrics({
  totalBalance,
  totalPending,
  totalInvested,
  currency,
}: SummaryMetricsProps) {
  const safeBalance = Number.isFinite(totalBalance) ? totalBalance : 0
  const safePending = Number.isFinite(totalPending) ? totalPending : 0
  const safeInvested = Number.isFinite(totalInvested) ? totalInvested : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Saldo Atual */}
      <div className="min-w-0 rounded-lg border border-border bg-stone-50 p-5 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Wallet className="size-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Saldo Atual
          </span>
        </div>
        <div className="mt-4">
          <Sensitive className="block truncate text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
            {formatCurrency(safeBalance, currency)}
          </Sensitive>
          <p className="mt-1 text-xs text-muted-foreground">
            Receitas menos despesas pagas (all-time)
          </p>
        </div>
      </div>

      {/* Pendente */}
      <div className="min-w-0 rounded-lg border border-border bg-stone-50 p-5 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Pendente
          </span>
        </div>
        <div className="mt-4">
          <Sensitive className="block truncate text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
            {formatCurrency(safePending, currency)}
          </Sensitive>
          <p className="mt-1 text-xs text-muted-foreground">
            Total de transações pendentes até hoje
          </p>
        </div>
      </div>

      {/* Total Aportado (Investimentos) */}
      <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Total Aportado
          </span>
        </div>
        <div className="mt-4">
          <Sensitive className="block truncate text-xl font-bold tabular-nums tracking-tight text-emerald-700 sm:text-2xl dark:text-emerald-300">
            {formatCurrency(safeInvested, currency)}
          </Sensitive>
          <p className="mt-1 text-xs text-muted-foreground">
            Soma dos aportes em investimentos
          </p>
        </div>
      </div>
    </div>
  )
}

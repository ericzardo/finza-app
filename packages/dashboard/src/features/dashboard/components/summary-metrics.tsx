import { Wallet, TrendingUp, PiggyBank } from 'lucide-react'
import { Sensitive } from '@features/user/components/sensitive-value'
import { formatCurrency } from '@lib/utils'
import type { WorkspaceSummary } from '@lib/api-client/workspace-queries'

interface SummaryMetricsProps {
  summary: WorkspaceSummary
  currency: string
}

const metrics = [
  {
    key: 'currentBalance' as const,
    label: 'Saldo Atual',
    icon: Wallet,
    description: 'Receitas menos despesas pagas',
  },
  {
    key: 'maxBalance' as const,
    label: 'Saldo Máximo',
    icon: TrendingUp,
    description: 'Maior saldo registrado',
  },
  {
    key: 'totalInvested' as const,
    label: 'Total Aportado',
    icon: PiggyBank,
    description: 'Soma das receitas confirmadas',
  },
] as const

export function SummaryMetrics({ summary, currency }: SummaryMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map(({ key, label, icon: Icon, description }) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-stone-50 p-5 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
              <Icon className="size-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="mt-4">
            <Sensitive className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(summary[key], currency)}
            </Sensitive>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

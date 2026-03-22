import { Landmark, Wallet } from 'lucide-react'
import { Card } from '@ui/card'
import { Sensitive } from '@features/user/components/sensitive-value'
import { useTotalPatrimony } from '@features/profile/hooks/use-total-patrimony'
import { Skeleton } from '@ui/skeleton'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function PatrimonyCard() {
  const { total, workspaceCount, isLoading } = useTotalPatrimony()

  return (
    <Card className="overflow-hidden border-border/50 bg-card">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Landmark className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Patrimônio Consolidado
            </h2>
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <Sensitive className="text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(total)}
            </Sensitive>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Wallet className="size-3.5" />
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span>
              {workspaceCount} {workspaceCount === 1 ? 'workspace' : 'workspaces'}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

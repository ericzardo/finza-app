import { CalendarSearch, Landmark, Plus } from 'lucide-react'
import { Button } from '@ui/button'

export function EmptyStateDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-8 flex size-20 items-center justify-center rounded-2xl bg-primary/10">
        <Landmark className="size-10 text-primary" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Dê um propósito para cada real
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
        O segredo do patrimônio é a organização. Crie sua primeira caixa e comece a distribuir seu dinheiro com a clareza que você merece.
      </p>

      <Button className="mt-8 gap-2" size="lg" disabled>
        <Plus className="size-4" />
        Novo Caixa
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Em breve em /buckets
      </p>
    </div>
  )
}

export function EmptyStatePeriod() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-8 flex size-20 items-center justify-center rounded-2xl bg-muted">
        <CalendarSearch className="size-10 text-muted-foreground" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Nenhuma movimentação no período
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
        Não encontramos transações no intervalo selecionado. Experimente ajustar as datas no filtro acima.
      </p>
    </div>
  )
}

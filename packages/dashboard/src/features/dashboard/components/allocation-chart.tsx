import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Sensitive } from '@features/user/components/sensitive-value'
import { formatCurrency } from '@lib/utils'
import type { WorkspaceSummary } from '@lib/api-client/workspace-queries'

interface AllocationChartProps {
  distribution: WorkspaceSummary['distribution']
  currency: string
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function AllocationChart({ distribution, currency }: AllocationChartProps) {
  if (distribution.length === 0) return null

  const data = distribution.map((item) => ({
    name: item.bucketName,
    value: item.amount,
    percentage: item.percentage,
  }))

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground">
        Alocação por Caixa de Propósito
      </h3>

      <div className="mt-4 flex flex-col items-center gap-6 lg:flex-row">
        {/* Donut Chart */}
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const entry = payload[0]
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-sm">
                      <p className="text-xs font-medium text-foreground">
                        {entry.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(entry.payload as { percentage: number }).percentage.toFixed(1)}%
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {distribution.map((item, index) => (
            <div key={item.bucketId} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="truncate text-sm text-foreground">
                  {item.bucketName}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </span>
                <Sensitive className="text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(item.amount, currency)}
                </Sensitive>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

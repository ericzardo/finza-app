import { Plus } from 'lucide-react'
import { Card } from '@ui/card'

interface CreateWorkspaceCardProps {
  onClick: () => void
}

export function CreateWorkspaceCard({ onClick }: CreateWorkspaceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Card className="flex h-full min-h-44 items-center justify-center border-2 border-dashed border-border/50 bg-transparent transition-all duration-200 hover:border-border hover:bg-muted/30 cursor-pointer">
        <div className="flex flex-col items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent">
            <Plus className="size-5" />
          </div>
          <span className="text-sm font-medium">Novo workspace</span>
        </div>
      </Card>
    </button>
  )
}

import { WorkspaceCard } from './workspace-card'
import { WorkspaceCardSkeleton } from './workspace-card-skeleton'
import { CreateWorkspaceCard } from './create-workspace-card'
import type { Workspace } from '../types'

interface WorkspaceListProps {
  workspaces: Workspace[]
  isLoading: boolean
  onCreateClick: () => void
}

export function WorkspaceList({ workspaces, isLoading, onCreateClick }: WorkspaceListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CreateWorkspaceCard onClick={onCreateClick} />
        {Array.from({ length: 3 }).map((_, i) => (
          <WorkspaceCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CreateWorkspaceCard onClick={onCreateClick} />
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  )
}

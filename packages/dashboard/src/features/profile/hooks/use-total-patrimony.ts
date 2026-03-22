import { useGetWorkspaces } from '@finza/api-client/hooks'
import type { Workspace } from '@features/workspaces/types'

export function useTotalPatrimony() {
  const { data: workspaces, isLoading } = useGetWorkspaces<Workspace[]>()

  const total = (workspaces ?? []).reduce(
    (sum, ws) => sum + (ws.totalBalance ?? 0),
    0,
  )

  return {
    total,
    workspaceCount: workspaces?.length ?? 0,
    isLoading,
  }
}

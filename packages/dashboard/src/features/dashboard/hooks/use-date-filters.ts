import { getRouteApi } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'

const routeApi = getRouteApi('/_authenticated/$workspaceId/')

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

export function useDateFilters() {
  const { start, end } = routeApi.useSearch()
  const navigate = useNavigate({ from: '/$workspaceId' })

  const defaults = getMonthRange()
  const startDate = start ?? defaults.startDate
  const endDate = end ?? defaults.endDate

  function setDateRange(newStart: string, newEnd: string) {
    navigate({
      search: { start: newStart, end: newEnd },
      replace: true,
    })
  }

  return { startDate, endDate, setDateRange } as const
}

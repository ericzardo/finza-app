import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getProfileQueryOptions, getProfileQueryKey } from '@finza/api-client/hooks'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const queryKey = getProfileQueryKey()
    const cachedState = context.queryClient.getQueryState(queryKey)

    // 1. Cache Awareness: dados válidos já no cache → prosseguir sem re-fetch
    if (cachedState?.status === 'success') {
      return
    }

    try {
      await context.queryClient.ensureQueryData(getProfileQueryOptions())
    } catch (error: unknown) {
      // 2. Strict Mode Resilience: ignorar todos os formatos de cancelamento (Axios + DOM)
      const isTransportError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.name === 'CanceledError' ||
          (error as { code?: string }).code === 'ERR_CANCELED' ||
          error.message.toLowerCase().includes('cancel'))

      if (isTransportError) {
        console.warn('[Router Guard] Erro de transporte detectado. Deixando o app se estabilizar.')
        return
      }

      // 3. Regra de Ouro: só redirecionar em falha explícita de autenticação do backend
      const httpStatus = (error as { response?: { status?: number } }).response?.status
      if (httpStatus === 401 || httpStatus === 403) {
        throw redirect({ to: '/login' })
      }

      // 4. Graceful Wait: qualquer outro erro (rede, 500, etc.) → não redirecionar
      console.warn('[Router Guard] Erro não-fatal. Permitindo que o app se estabilize.', error)
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}

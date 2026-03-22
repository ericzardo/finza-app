import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { queryClient } from '@lib/query-client'
import { AppLoader } from '@components/shared/app-loader'

export const router = createRouter({
  routeTree,
  // defaultPreload: 'intent',
  defaultPendingMinMs: 150,
  defaultPendingComponent: AppLoader,
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

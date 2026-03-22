import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { ReactLenis, useLenis } from '@studio-freight/react-lenis'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { TopLoader } from '@components/shared/top-loader'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function LenisScrollToTop() {
  const lenis = useLenis()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return null
}

function RootLayout() {
  return (
    <ReactLenis root options={{ lerp: 0.10, wheelMultiplier: 0.7, smoothWheel: true }}>
      <LenisScrollToTop />
      <TopLoader />
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          className: 'font-sans !rounded-lg',
        }}
      />
    </ReactLenis>
  )
}

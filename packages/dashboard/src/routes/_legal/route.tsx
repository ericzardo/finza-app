import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Header } from '@components/layout/header'
import { Footer } from '@components/layout/footer'

export const Route = createFileRoute('/_legal')({
  component: LegalLayout,
})

function LegalLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

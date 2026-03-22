import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Lado Esquerdo — Branding */}
      <aside className="relative hidden w-[60%] flex-col justify-between overflow-hidden bg-zinc-900 p-10 dark:bg-zinc-950 lg:flex">
        {/* Grid pattern */}
        <div className="bg-grid-pattern pointer-events-none absolute inset-0" />
        {/* Glow radial suave — Esmeralda */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--success)_0%,transparent_70%)] opacity-[0.08]" />

        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-zinc-50"
        >
          Finza
        </Link>

        <blockquote className="max-w-md space-y-2">
          <p className="text-lg leading-relaxed text-zinc-300">
            "Cada ativo. Cada passivo. Tudo sob um comando."
          </p>
          <footer className="text-sm text-zinc-500">
            — Filosofia Finza
          </footer>
        </blockquote>
      </aside>

      {/* Lado Direito — Conteúdo da rota filha */}
      <main className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-[40%]">
        <Outlet />
      </main>
    </div>
  )
}

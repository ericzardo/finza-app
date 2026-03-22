import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-sm font-medium tracking-tight text-muted-foreground">
          © {new Date().getFullYear()} Finza. Todos os direitos reservados.
        </span>
        <nav aria-label="Links legais" className="flex gap-4">
          <Link
            to="/termos"
            className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            Termos de uso
          </Link>
          <Link
            to="/privacidade"
            className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            Política de privacidade
          </Link>
        </nav>
      </div>
    </footer>
  )
}

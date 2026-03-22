import { Link, createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@features/auth/components/login-form'
import { setPageMeta } from '@lib/seo'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Acesso',
      description:
        'Entre para acompanhar entradas, ajustar as Caixas de Propósito e mover seu dinheiro com clareza em tempo real.',
      canonical: 'https://app.finza.com.br/login',
    })
  },
})

function LoginPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Acessar plataforma
        </h1>
        <p className="text-sm text-muted-foreground">
          Informe suas credenciais para continuar.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link
          to="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}

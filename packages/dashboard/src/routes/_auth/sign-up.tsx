import { Link, createFileRoute } from '@tanstack/react-router'
import { SignUpForm } from '@features/auth/components/sign-up-form'
import { setPageMeta } from '@lib/seo'

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUpPage,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Crie sua conta',
      description:
        'Abra sua conta gratuita e distribua cada entrada nas Caixas de Propósito. Defina regras claras para o dinheiro trabalhar por você desde o primeiro acesso.',
      canonical: 'https://app.finza.com.br/sign-up',
    })
  },
})

function SignUpPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Criar conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados para acessar a plataforma.
        </p>
      </div>

      <SignUpForm />

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link
          to="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Fazer login
        </Link>
      </p>
    </div>
  )
}

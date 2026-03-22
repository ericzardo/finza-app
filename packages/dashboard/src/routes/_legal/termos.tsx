import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { setPageMeta } from '@lib/seo'

export const Route = createFileRoute('/_legal/termos')({
  component: TermosPage,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Termos de Uso',
      description:
        'Leia os Termos de Uso da Finza. Entenda as condições para utilização da plataforma de organização patrimonial.',
    })
  },
})

const SECTIONS = [
  {
    id: 'aceitacao',
    title: '1. Aceitação dos Termos',
    content:
      'Ao acessar ou utilizar a plataforma Finza, você concorda com estes Termos de Uso em sua totalidade. Caso não concorde com qualquer disposição, recomendamos que interrompa o uso imediatamente.',
  },
  {
    id: 'servico',
    title: '2. Descrição do Serviço',
    content:
      'A Finza é uma plataforma de organização patrimonial pessoal que permite ao usuário visualizar, categorizar e acompanhar seus ativos e passivos por meio de Caixas de Propósito. O serviço é oferecido no modelo SaaS, sujeito a disponibilidade técnica.',
  },
  {
    id: 'cadastro',
    title: '3. Cadastro e Conta',
    content:
      'Para utilizar a Finza, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade das suas credenciais de acesso e por todas as atividades realizadas em sua conta.',
  },
  {
    id: 'uso-aceitavel',
    title: '4. Uso Aceitável',
    content:
      'Você concorda em utilizar a plataforma apenas para fins lícitos e de acordo com estes Termos. É vedado o uso para atividades fraudulentas, disseminação de malware, engenharia reversa do sistema ou qualquer ato que comprometa a integridade do serviço.',
  },
  {
    id: 'propriedade',
    title: '5. Propriedade Intelectual',
    content:
      'Todo o conteúdo, design, código-fonte e marcas presentes na Finza são de propriedade exclusiva da empresa ou de seus licenciantes. Nenhum direito é transferido ao usuário além da licença limitada de uso descrita nestes Termos.',
  },
  {
    id: 'responsabilidade',
    title: '6. Limitação de Responsabilidade',
    content:
      'A Finza não se responsabiliza por decisões financeiras tomadas com base nas informações exibidas na plataforma. Os dados são organizacionais e não constituem aconselhamento financeiro, fiscal ou jurídico.',
  },
  {
    id: 'cancelamento',
    title: '7. Cancelamento',
    content:
      'Você pode cancelar sua conta a qualquer momento através das configurações da plataforma. Após o cancelamento, seus dados poderão ser retidos por um período de 30 dias antes da exclusão definitiva, conforme nossa Política de Privacidade.',
  },
  {
    id: 'alteracoes',
    title: '8. Alterações nos Termos',
    content:
      'Reservamo-nos o direito de atualizar estes Termos periodicamente. Notificaremos os usuários sobre alterações relevantes por e-mail ou aviso na plataforma. O uso continuado após a notificação implica aceitação dos novos termos.',
  },
  {
    id: 'contato',
    title: '9. Contato',
    content:
      'Para dúvidas sobre estes Termos, entre em contato com nossa equipe pelo e-mail suporte@finza.com.br. Respondemos em até 5 dias úteis.',
  },
] as const

function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
      {/* Back link */}
      <Link
        to="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar
      </Link>

      {/* Page header */}
      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: março de 2025
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Estes Termos de Uso regulam o acesso e a utilização da plataforma
          Finza. Leia com atenção antes de usar o serviço.
        </p>
      </header>

      {/* Table of contents */}
      <nav
        aria-label="Índice de seções"
        className="mb-10 rounded-lg border border-border/50 bg-muted/40 p-5"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Neste documento
        </p>
        <ol className="space-y-1.5">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Sections */}
      <div className="space-y-0">
        {SECTIONS.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={index > 0 ? 'border-t border-border/50 pt-8 mt-8' : ''}
          >
            <h2 className="mb-3 text-base font-semibold tracking-tight text-foreground">
              {section.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {/* Bottom spacer with link to privacy */}
      <div className="mt-12 border-t border-border/50 pt-8">
        <p className="text-sm text-muted-foreground">
          Consulte também nossa{' '}
          <Link
            to="/privacidade"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

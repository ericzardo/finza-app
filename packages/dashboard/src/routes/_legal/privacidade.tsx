import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { setPageMeta } from '@lib/seo'

export const Route = createFileRoute('/_legal/privacidade')({
  component: PrivacidadePage,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Política de Privacidade',
      description:
        'Saiba como a Finza coleta, armazena e utiliza seus dados. Seus direitos sob a LGPD e como protegemos suas informações.',
    })
  },
})

const SECTIONS = [
  {
    id: 'coleta',
    title: '1. Informações que Coletamos',
    content:
      'Coletamos informações fornecidas diretamente por você durante o cadastro (nome, e-mail), dados de uso da plataforma (ações realizadas, preferências) e informações técnicas do dispositivo (endereço IP, tipo de navegador). Não coletamos dados bancários ou senhas de instituições financeiras.',
  },
  {
    id: 'uso',
    title: '2. Como Usamos suas Informações',
    content:
      'Utilizamos seus dados para operar e melhorar a plataforma, personalizar sua experiência, enviar comunicações sobre o serviço e garantir a segurança da conta. Nunca vendemos seus dados a terceiros.',
  },
  {
    id: 'compartilhamento',
    title: '3. Compartilhamento de Dados',
    content:
      'Podemos compartilhar seus dados com fornecedores de infraestrutura (hospedagem, e-mail transacional) estritamente necessários para a operação do serviço. Todos os fornecedores são obrigados contratualmente a manter a confidencialidade e a seguir práticas adequadas de segurança.',
  },
  {
    id: 'seguranca',
    title: '4. Segurança',
    content:
      'Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. Todas as comunicações são criptografadas via TLS. Ainda assim, nenhum sistema é 100% inviolável e não podemos garantir segurança absoluta.',
  },
  {
    id: 'direitos',
    title: '5. Seus Direitos (LGPD)',
    content:
      'Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a acessar, corrigir, portar, anonimizar ou solicitar a exclusão de seus dados pessoais. Para exercer esses direitos, entre em contato pelo e-mail privacidade@finza.com.br.',
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content:
      'Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação, preferências de sessão) e cookies analíticos para entender como o serviço é utilizado. Você pode gerenciar os cookies nas configurações do seu navegador.',
  },
  {
    id: 'retencao',
    title: '7. Retenção de Dados',
    content:
      'Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados são retidos por 30 dias para fins de recuperação antes da exclusão permanente, exceto quando a retenção for exigida por obrigação legal.',
  },
  {
    id: 'alteracoes',
    title: '8. Alterações nesta Política',
    content:
      'Esta Política pode ser atualizada periodicamente. Notificaremos sobre mudanças relevantes por e-mail ou aviso na plataforma. Recomendamos revisar este documento periodicamente.',
  },
  {
    id: 'contato',
    title: '9. Contato',
    content:
      'Para questões relacionadas à privacidade e proteção de dados, entre em contato com nosso encarregado (DPO) pelo e-mail privacidade@finza.com.br. Respondemos em até 15 dias úteis.',
  },
] as const

function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: março de 2025
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Sua privacidade é fundamental para nós. Este documento descreve quais
          dados coletamos, como os utilizamos e quais são seus direitos como
          titular.
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

      {/* Bottom spacer with link to terms */}
      <div className="mt-12 border-t border-border/50 pt-8">
        <p className="text-sm text-muted-foreground">
          Consulte também nossos{' '}
          <Link
            to="/termos"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Termos de Uso
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

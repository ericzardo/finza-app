import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, ArrowLeftRight, Box, RefreshCw } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { Header } from '@components/layout/header'
import { Footer } from '@components/layout/footer'
import { Button } from '@ui/button'
import { setPageMeta } from '@lib/seo'

export const Route = createFileRoute('/')({
  component: IndexPage,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza',
      description:
        'Organize seu patrimônio com Caixas de Propósito. Distribua cada real entre gastos, metas e investimentos com clareza total.',
      canonical: 'https://app.finza.com.br/',
    })
  },
})

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
} as const

function IndexPage() {
  const { scrollY } = useScroll()

  const rotate = useTransform(scrollY, [0, 800], [-12, 8])
  const y = useTransform(scrollY, [0, 800], [-50, 100])
  const scale = useTransform(scrollY, [0, 800], [1.6, 1.8])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section
        aria-label="Organize seu patrimônio com propósito"
        className="bg-grid-pattern relative flex flex-1 items-center overflow-hidden"
      >
        {/* Glow effect */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-glow-pulse h-125 w-125 rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:gap-16 lg:py-28">
          {/* Left — Text Content */}
          <motion.div
            className="flex flex-1 flex-col gap-6 text-center lg:text-left"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 self-center rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground lg:self-start"
            >
              <div className="size-1.5 rounded-full bg-accent" />
              Organizador de patrimônio com propósito
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl"
            >
              Cada real com
              <br />
              <span className="text-gradient-emerald">um propósito.</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-lg self-center text-base leading-relaxed text-muted-foreground lg:self-start lg:text-lg"
            >
              Distribua seu dinheiro em Caixas de Propósito — gastos, metas
              e investimentos separados com clareza. Organize uma vez,
              acompanhe sempre.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Button id="cta-hero-primary" variant="accent" size="lg" asChild>
                <Link to="/sign-up">
                  Criar conta gratuita
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Link>
              </Button>
              <Button
                id="cta-hero-secondary"
                variant="outline-light"
                className="cursor-pointer"
                size="lg"
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Como funciona
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — Hero Illustration (Rotating Parallax) */}
          <motion.div
            className="pointer-events-none w-full max-w-xl opacity-30 lg:absolute lg:right-[-5%] lg:top-1/2 lg:-translate-y-1/2"
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            style={{ rotate, y, scale }}
          >
            <picture>
              <source srcSet="/hero-illustration.webp" type="image/webp" />
              <img
                src="/hero-illustration.webp"
                alt="Ilustração do método de Caixas de Propósito — Finza"
                className="w-full drop-shadow-2xl"
                loading="eager"
                fetchPriority="high"
                width={2400}
                height={2400}
                style={{
                  maskImage:
                    'radial-gradient(ellipse 70% 70% at 60% 50%, black 30%, transparent 100%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse 70% 70% at 60% 50%, black 30%, transparent 100%)',
                }}
              />
            </picture>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        aria-label="Como funciona o método das Caixas de Propósito"
        className="border-t border-border/50 bg-background"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              O método é{' '}
              <span className="text-gradient-emerald">simples</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Todo dinheiro que entra precisa de um trabalho. A Finza garante que nenhum real fique sem destino.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <FeatureCard
              icon={<Box className="size-5 text-accent" />}
              title="Caixas de Propósito"
              description="Crie caixas para cada objetivo: custo de vida, lazer, investimentos. Cada real sabe exatamente onde deve estar."
            />
            <FeatureCard
              icon={<ArrowLeftRight className="size-5 text-accent" />}
              title="Distribuição Inteligente"
              description="Distribua seu dinheiro manualmente ou crie regras automáticas. Recebeu o salário? A Finza organiza para você."
            />
            <FeatureCard
              icon={<RefreshCw className="size-5 text-accent" />}
              title="Flexibilidade Real"
              description="A vida muda, seu dinheiro acompanha. Transfira entre caixas quando precisar, sem julgamentos — apenas clareza."
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="group rounded-lg border border-border/50 bg-card p-6 transition-all hover:border-border hover:bg-muted/50"
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-border bg-muted">
        {icon}
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  )
}

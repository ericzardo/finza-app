---
name: finza-design-system
description: Guia de design e identidade visual "Modern Wealth" da Finza. Define paleta Emerald/Violet sobre base Zinc, tipografia Geist, componentes shadcn/ui e Tailwind v4 para interfaces de alta densidade analítica.
---

# 🎨 Finza Design System — "Modern Wealth"

> ⚡ **Pré-requisito:** Leia `packages/dashboard/CLAUDE.md` (ou `.agent/rules/instructions.md`) antes de executar qualquer tarefa de UI. Esta skill trata exclusivamente de identidade visual, paleta e componentes — as regras de arquitetura, roteamento e fetching estão nas instruções do pacote.

Você está projetando interfaces para a Finza, um SaaS de inteligência patrimonial.
A interface deve transmitir: **Clareza Numérica, Estrutura, Confiança e Sofisticação Discreta**.
Referências estéticas: Vercel, Linear, Stripe, Mercury.

## Fonte da Verdade (`src/index.css`)
Todos os tokens de cor, espaçamento e tipografia vivem no `index.css`. **SEMPRE consulte e USE os CSS custom properties definidos lá.**

---

## 1. Filosofia Estética

> Minimalista, estruturada, com bordas finas (1px) e uso estratégico de espaços em branco (whitespace) para evitar sobrecarga cognitiva.

### Hierarquia Visual
- **Dados numéricos são o protagonista.** A interface existe para servir os números — não o contrário.
- A paleta base é monocromática (Zinc) para não competir com os dados.
- Cores cromáticas (Emerald, Violet) são usadas **cirurgicamente** para estados, ações e indicadores — nunca como decoração de área.
- Whitespace generoso **entre** blocos analíticos. Densidade alta **dentro** dos blocos, respiro entre eles.

### Regras de Forma
- **Bordas:** Finas (1px), `border-border`. Usadas para delimitar áreas analíticas.
- **Cantos:** Levemente arredondados (`rounded-md` ou `rounded-lg`). Sem exageros.
- **Sombras:** Extremamente sutis (`shadow-sm`). Usar apenas para elevação real (popovers, dropdowns).
- **Tipografia:** Fonte **Geist**. Usar `tracking-tight` (letter-spacing negativo) em `h1` a `h4` para visual moderno e impessoal.

---

## 2. Mobile-First Strategy

A Finza deve ser operável com uma mão. A inteligência patrimonial deve estar disponível no momento do gasto, não apenas no escritório.

- **Hierarquia de Empilhamento:** Em telas pequenas, a leitura horizontal é proibida. Elementos que vivem lado a lado no Desktop (ex: Saldo | Métricas) devem ser empilhados verticalmente no Mobile.
- **Touch-Friendly:** Botões e áreas de clique devem ter no mínimo 44px de altura. Nada de links minúsculos "espremidos".
- **Densidade Adaptativa:** Alta densidade no Desktop para análise; Respiro e clareza no Mobile para ação rápida.
- **Navegação de Polegar:** Priorize ações importantes (como "Novo Lançamento") em áreas de fácil alcance pelo polegar.

---

## 3. Paleta de Cores — "Modern Wealth"

O **Light Theme é o padrão** da Finza, otimizado para legibilidade de dados numéricos em longas sessões de uso.

### 3.1 Base Light (Default)
| Papel | Valor | Token CSS |
|---|---|---|
| Fundo | `#FBFBFA` (Off-white / Parchment) | `--background` |
| Superfícies (cards) | Branco puro `#FFFFFF` | `--card`, `--popover` |
| Tipografia principal | Zinc-900 `#18181B` | `--foreground` |
| Tipografia secundária | Zinc-500 `#71717A` | `--muted-foreground` |
| Bordas | Zinc-200 `#E4E4E7` | `--border` |

> O off-white `#FBFBFA` reduz fadiga visual comparado ao branco puro, mantendo contraste WCAG AAA com texto Zinc-900.

### 3.2 Base Dark (Elegant)
| Papel | Valor | Token CSS |
|---|---|---|
| Fundo | `#09090B` (Zinc-950) | `--background` |
| Superfícies (cards) | Zinc-900 `#18181B` | `--card`, `--popover` |
| Tipografia principal | Zinc-50 `#FAFAFA` | `--foreground` |
| Tipografia secundária | Zinc-400 `#A1A1AA` | `--muted-foreground` |
| Bordas | Zinc-800 `#27272A` | `--border` |

> Profundidade é criada via bordas Zinc-800 — não via sombras. Superfícies limpas, sem ruído.

### 3.3 Primary — Emerald _(Crescimento & Liquidez)_
| Contexto | Hex | oklch | Uso |
|---|---|---|---|
| Light | `#059669` (Emerald-600) | `oklch(0.596 0.145 163.225)` | Botões primários, links, indicadores positivos |
| Dark | `#10B981` (Emerald-500) | `oklch(0.696 0.17 162.48)` | Mesmos usos, tom mais claro para contraste |

> Emerald representa **crescimento patrimonial e liquidez**. É a cor de ação principal da Finza.

### 3.4 Accent — Violet _(Inteligência & Tecnologia)_
| Contexto | Hex | oklch | Uso |
|---|---|---|---|
| Light | `#7C3AED` (Violet-600) | `oklch(0.541 0.281 293.009)` | Features premium, insights de IA, badges especiais |
| Dark | `#A78BFA` (Violet-400) | `oklch(0.702 0.183 293.541)` | Mesmos usos, tom mais claro para contraste |

> Violet representa **inteligência artificial e tecnologia**. Usar para diferenciar features "smart" do operacional comum.

### 3.5 Semânticas
| Token | Significado | Cor |
|---|---|---|
| `--success` | Positivo / ganho | Emerald (alinhado ao primary) |
| `--destructive` | Erro / perda | Vermelho (mantido do sistema) |

### 3.6 Regras de Aplicação
- **NUNCA** use Emerald ou Violet como cor de fundo de áreas grandes. São cores de **acento cirúrgico**.
- Botões primários: `bg-primary text-primary-foreground` (Emerald).
- Botões secundários / ghost: monocromáticos (Zinc).
- Links: `text-primary` (Emerald).
- Badges de IA / premium: `bg-accent/10 text-accent` (Violet sutil).
- Focus rings: Emerald (`ring-ring`) para reforçar a marca em interações.
- Gráficos: a chart palette no CSS combina tons de Emerald e escalas auxiliares para diferenciação de séries.

---

## 4. Diretrizes de Componentes
- **Formulários e Inputs:** Minimalistas. Labels pequenos, inputs com `bg-transparent` ou levemente preenchidos.
- **Telas de Autenticação (Login/Sign Up):** Layout "Split Screen" (60/40).
  - Lado esquerdo: Branding/Arte dark-mode imponente com frases de efeito.
  - Lado direito: Formulário centralizado, limpo, sem distrações.

### Skeleton & Loading States

NUNCA mostre tela em branco. Use Skeleton components do `shadcn/ui`.

**Distinção crítica:**
- **`TopLoader` (global):** Cuida do loading de *navegação* (transitions entre rotas). Não usar `pendingComponent` em rotas de layout/guard — o TopLoader resolve isso.
- **`pendingComponent`:** Usar em rotas de *conteúdo* (especialmente workspace-scoped, ex: `$workspaceId/*`) para renderizar o Skeleton da página enquanto os dados carregam.

```tsx
// ✅ Rota de conteúdo workspace-scoped — use pendingComponent
export const Route = createFileRoute('/_authenticated/$workspaceId/transactions')({
  pendingComponent: TransactionsSkeleton,   // ← correto aqui
  loader: ({ context }) => context.queryClient.ensureQueryData(getTransactionsQueryOptions()),
  component: TransactionsPage,
})

// ❌ Rota de layout/guard — NÃO use pendingComponent
export const Route = createFileRoute('/_authenticated')({
  // sem pendingComponent — TopLoader global cuida da navegação
  beforeLoad: async ({ context }) => { ... }
})
```

## 5. Implementação (Tailwind v4 + shadcn/ui)
- **NUNCA** use CSS inline (`style={{}}`). Tudo deve ser classes do Tailwind CSS.
- Utilize a função `cn()` para fundir classes dinamicamente.
- Todos os componentes base devem vir do **shadcn/ui**. Não crie botões ou inputs do zero.
- Utilize ícones do `lucide-react`. Nenhum outro pacote de ícones é permitido.

## 6. Animações e Interações
- Para animações disparadas por scroll, use sempre `framer-motion`.
- Proibido criar event listeners de scroll manuais. Use `<motion.div />`.
- **Scrollbars:** Configuradas globalmente no CSS. Use `overflow-y-auto` e deixe o CSS global agir.

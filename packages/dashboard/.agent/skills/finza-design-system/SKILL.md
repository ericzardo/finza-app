---
name: finza-design-system
description: Guia de design e identidade visual "Modern Wealth" da Finza. Define paleta Emerald/Violet sobre base Zinc, tipografia Geist, componentes shadcn/ui, Tailwind v4, estratégias de cache e UX de carregamento para interfaces de alta densidade analítica.
---

# 🎨 Finza Design System — "Modern Wealth"

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

## 2. Paleta de Cores — "Modern Wealth"

O **Light Theme é o padrão** da Finza, otimizado para legibilidade de dados numéricos em longas sessões de uso.

### 2.1 Base Light (Default)
| Papel | Valor | Token CSS |
|---|---|---|
| Fundo | `#FBFBFA` (Off-white / Parchment) | `--background` |
| Superfícies (cards) | Branco puro `#FFFFFF` | `--card`, `--popover` |
| Tipografia principal | Zinc-900 `#18181B` | `--foreground` |
| Tipografia secundária | Zinc-500 `#71717A` | `--muted-foreground` |
| Bordas | Zinc-200 `#E4E4E7` | `--border` |

> O off-white `#FBFBFA` reduz fadiga visual comparado ao branco puro, mantendo contraste WCAG AAA com texto Zinc-900.

### 2.2 Base Dark (Elegant)
| Papel | Valor | Token CSS |
|---|---|---|
| Fundo | `#09090B` (Zinc-950) | `--background` |
| Superfícies (cards) | Zinc-900 `#18181B` | `--card`, `--popover` |
| Tipografia principal | Zinc-50 `#FAFAFA` | `--foreground` |
| Tipografia secundária | Zinc-400 `#A1A1AA` | `--muted-foreground` |
| Bordas | Zinc-800 `#27272A` | `--border` |

> Profundidade é criada via bordas Zinc-800 — não via sombras. Superfícies limpas, sem ruído.

### 2.3 Primary — Emerald _(Crescimento & Liquidez)_
| Contexto | Hex | oklch | Uso |
|---|---|---|---|
| Light | `#059669` (Emerald-600) | `oklch(0.596 0.145 163.225)` | Botões primários, links, indicadores positivos |
| Dark | `#10B981` (Emerald-500) | `oklch(0.696 0.17 162.48)` | Mesmos usos, tom mais claro para contraste |

> Emerald representa **crescimento patrimonial e liquidez**. É a cor de ação principal da Finza.

### 2.4 Accent — Violet _(Inteligência & Tecnologia)_
| Contexto | Hex | oklch | Uso |
|---|---|---|---|
| Light | `#7C3AED` (Violet-600) | `oklch(0.541 0.281 293.009)` | Features premium, insights de IA, badges especiais |
| Dark | `#A78BFA` (Violet-400) | `oklch(0.702 0.183 293.541)` | Mesmos usos, tom mais claro para contraste |

> Violet representa **inteligência artificial e tecnologia**. Usar para diferenciar features "smart" do operacional comum.

### 2.5 Semânticas
| Token | Significado | Cor |
|---|---|---|
| `--success` | Positivo / ganho | Emerald (alinhado ao primary) |
| `--destructive` | Erro / perda | Vermelho (mantido do sistema) |

### 2.6 Regras de Aplicação
- **NUNCA** use Emerald ou Violet como cor de fundo de áreas grandes. São cores de **acento cirúrgico**.
- Botões primários: `bg-primary text-primary-foreground` (Emerald).
- Botões secundários / ghost: monocromáticos (Zinc).
- Links: `text-primary` (Emerald).
- Badges de IA / premium: `bg-accent/10 text-accent` (Violet sutil).
- Focus rings: Emerald (`ring-ring`) para reforçar a marca em interações.
- Gráficos: a chart palette no CSS combina tons de Emerald e escalas auxiliares para diferenciação de séries.

---

## 3. Diretrizes de Componentes
- **Formulários e Inputs:** Minimalistas. Labels pequenos, inputs com `bg-transparent` ou levemente preenchidos.
- **Telas de Autenticação (Login/Sign Up):** Layout "Split Screen" (60/40).
  - Lado esquerdo: Branding/Arte dark-mode imponente com frases de efeito.
  - Lado direito: Formulário centralizado, limpo, sem distrações.

## 4. Implementação (Tailwind v4 + shadcn/ui)
- **NUNCA** use CSS inline (`style={{}}`). Tudo deve ser classes do Tailwind CSS.
- Utilize a função `cn()` para fundir classes dinamicamente.
- Todos os componentes base devem vir do **shadcn/ui**. Não crie botões ou inputs do zero.
- Utilize ícones do `lucide-react`. Nenhum outro pacote de ícones é permitido.

## 5. Animações e Interações
- Para animações disparadas por scroll, use sempre `framer-motion`.
- Proibido criar event listeners de scroll manuais. Use `<motion.div />`.
- **Scrollbars:** Configuradas globalmente no CSS. Use `overflow-y-auto` e deixe o CSS global agir.

---

## 6. ⚡ Performance Perceptual & UX de Carregamento

### Princípio: Velocidade é UX
O usuário deve **sentir** que o app é instantâneo.

### Estratégias de Cache (TanStack Query)
- **`staleTime`:** Dados financeiros: `1000 * 60 * 2` (2 min). Configuração: `1000 * 60 * 30` (30 min). Estáticos: `Infinity`.
- **`gcTime`:** Sempre >= `staleTime`. Padrão: `1000 * 60 * 10` (10 min).
- **`refetchOnWindowFocus`:** `true` para dados financeiros, `false` para configurações.
- **`placeholderData`:** Use `keepPreviousData` em listagens (paginação/filtros).

### Prefetch Agressivo
- **Loaders do TanStack Router:** SEMPRE usar `queryClient.ensureQueryData()`.
- **Hover Prefetch:** Em links de navegação principal.
- **Prefetch de Rotas Adjacentes:** Na sidebar, prefetch das rotas mais prováveis.

### Skeleton & Loading States
- NUNCA mostre tela em branco. Use Skeleton components do shadcn/ui.
- `pendingComponent` nas rotas deve renderizar o Skeleton da página.
- Transições suaves (`transition` CSS).

### Lazy Loading & Code Splitting
- Rotas lazy-loaded por padrão (TanStack Router File-based).
- Componentes pesados: `React.lazy()` + `Suspense`.
- Imagens: `loading="lazy"` e dimensões explícitas.

### Otimização de Assets
- Fontes: preload da Geist no `index.html`.
- Imagens: WebP/AVIF com fallback. `srcset` para responsividade.
- SVGs: inline para críticos, Lucide para o restante.

### Headers de Cache
- Assets estáticos (hash): `Cache-Control: public, max-age=31536000, immutable`.
- HTML: `Cache-Control: no-cache`.
- API: TanStack Query como camada primária de cache no cliente.

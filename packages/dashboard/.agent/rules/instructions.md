# 🏛️ FINZA DASHBOARD — LEIS DE ARQUITETURA E DIRETRIZES PARA IA

Você é um Desenvolvedor Front-end Sênior operando no pacote `packages/dashboard` da Finza.

---

## 1. ⚙️ Stack Oficial

| Camada | Tecnologia |
|---|---|
| **Framework** | React SPA via Vite |
| **Roteamento** | TanStack Router (Folder-based, `src/routes`) |
| **Data Fetching** | TanStack React Query v5 |
| **Estilização** | Tailwind CSS v4 |
| **UI Kit** | shadcn/ui + Radix UI + Lucide React |
| **Animações** | Framer Motion |
| **Toasts** | Sonner |
| **Smooth Scroll** | ReactLenis (`@studio-freight/react-lenis`) |
| **Validação** | Zod (schemas gerados pelo api-client) |
| **Tipagem** | TypeScript (Strict Mode) |

> **É TERMINANTEMENTE PROIBIDO O USO DE `any`.**

---

## 2. 🧱 Arquitetura de Pastas (Feature-Driven)

A escalabilidade dita que não misturamos domínios.

```
src/
├── routes/              # Rotas "burras" — apenas URL, prefetch e render
├── features/<domain>/   # Coração do sistema — lógica por domínio
│   ├── components/      # UI específica da feature
│   ├── hooks/           # Lógica de negócio e custom hooks
│   ├── context/         # Contextos React do domínio (ex: auth-context)
│   ├── api/             # Envoltórias usando @finza/api-client
│   ├── types.ts         # Tipos locais da feature
│   └── store/           # Zustand (se estritamente necessário)
├── components/
│   ├── ui/              # Componentes puros do shadcn/ui (NUNCA editar manualmente)
│   ├── shared/          # Componentes genéricos da Finza (TopLoader, skeletons, etc.)
│   └── header.tsx       # Header global da aplicação
├── lib/                 # Utilitários puros (utils, seo, query-client, zod)
├── router.tsx           # Criação do router com contexto do QueryClient
├── main.tsx             # Entry point: providers (QueryClient → Auth → Router)
└── routeTree.gen.ts     # Auto-gerado pelo TanStack Router (NUNCA editar)
```

### Regras de Pasta
- `src/routes/`: OBRIGATORIAMENTE "burras". Apenas orquestram a URL, fazem *prefetch* nos loaders, aplicam SEO via `setPageMeta()` e renderizam o componente principal da feature. **NUNCA** escreva lógica de negócio pesada aqui.
- `src/features/<domain>/`: Cada domínio (ex: `auth`, `workspaces`) deve ter sua própria pasta. É onde vive a lógica real.
- `src/components/ui/`: Componentes puros do shadcn/ui. Gerados via CLI, podem ser editáveis.
- `src/components/shared/`: Componentes reutilizáveis da Finza (top-loader, user-avatar-menu, etc.).
- `src/lib/`: Utilitários puros sem dependência de domínio (ex: `utils.ts`, `seo.ts`, `query-client.ts`).
- `src/routeTree.gen.ts`: Auto-gerado pelo plugin `@tanstack/router-plugin/vite`. **NUNCA** editar manualmente.

### Path Aliases

Configurados no `tsconfig.json` e resolvidos pelo Vite via `vite-tsconfig-paths`:

| Alias | Caminho |
|---|---|
| `@components/*` | `./src/components/*` |
| `@ui/*` | `./src/components/ui/*` |
| `@lib/*` | `./src/lib/*` |
| `@features/*` | `./src/features/*` |
| `@router` | `./src/router.tsx` |
| `@env` | `./src/env.ts` |
| `@client` | `../api-client/src/client.ts` |
| `@finza/api-client/*` | `../api-client/src/generated/*` |
| `@finza/api-client/hooks` | `../api-client/src/generated/hooks` |
| `@finza/api-client/schemas` | `../api-client/src/generated/schemas` |

> Sempre use os aliases acima. **NUNCA** use caminhos relativos que cruzem módulos (ex: `../../../components`).

---

## 3. 🛡️ Integração Contratual e Fetching

- **Proibição Suprema:** NUNCA use `fetch()`, `axios` manual ou crie tipos de API na mão.
- Todo e qualquer consumo de dados deve usar OBRIGATORIAMENTE o `@finza/api-client` gerado.

### 3 Entry Points do `@finza/api-client`

| Import | O que contém | Exemplo |
|---|---|---|
| `@finza/api-client` | **Tipos e interfaces** (responses, requests) | `import type { GetProfileQueryResponse } from '@finza/api-client'` |
| `@finza/api-client/hooks` | **Hooks** (queries, mutations, queryOptions, queryKeys) | `import { useGetWorkspaces, getWorkspacesQueryOptions } from '@finza/api-client/hooks'` |
| `@finza/api-client/schemas` | **Schemas Zod** para validação | `import { postWorkspacesMutationRequestSchema } from '@finza/api-client/schemas'` |

> **Exemplos reais do codebase:**
> ```ts
> // Tipos (para type annotations)
> import type { GetProfileQueryResponse } from '@finza/api-client'
>
> // Hooks (para fetching em componentes)
> import { useGetWorkspaces, getWorkspacesQueryOptions } from '@finza/api-client/hooks'
>
> // Schemas (para validação de forms)
> import { postWorkspacesMutationRequestSchema } from '@finza/api-client/schemas'
> ```

---

## 4. 🚀 Roteamento e Performance (TanStack Router)

### Estrutura de Rotas — Folder-based com Layout Groups

O roteamento usa **folder-based routing** com o plugin `@tanstack/router-plugin/vite`. Cada pasta em `src/routes/` com um `route.tsx` define um layout group.

```
src/routes/
├── __root.tsx                    # Layout raiz (ReactLenis + TopLoader + Outlet + Toaster)
├── index.tsx                     # Landing page pública (/)
├── _auth/                        # Layout group: páginas de autenticação (sem sidebar)
│   ├── route.tsx                 # Layout split-screen (branding | formulário)
│   ├── login.tsx                 # /login
│   └── sign-up.tsx               # /sign-up
└── _authenticated/               # Layout group: rotas protegidas (requer auth)
    ├── route.tsx                 # Guard: ensureQueryData(getProfileQueryOptions())
    └── dashboard.tsx             # /dashboard — hub de seleção de workspace
```

**Convenções de nomenclatura:**
- `_prefixo/`: Layout group (pathless — não adiciona segmento à URL). Ex: `_auth/login.tsx` → URL `/login`.
- `$param`: Segmento dinâmico. Ex: `$workspaceId/`.
- `route.tsx`: Define o layout wrapper do grupo (com `<Outlet />`).
- `__root.tsx`: Layout raiz de toda a aplicação.

### Root Layout (`__root.tsx`)

O root layout envolve toda a aplicação e fornece:

```tsx
<ReactLenis root>           {/* Smooth scrolling global */}
  <TopLoader />              {/* Barra de progresso no topo durante navegação */}
  <div className="min-h-screen bg-background text-foreground">
    <Outlet />               {/* Conteúdo da rota ativa */}
  </div>
  <Toaster />                {/* Sonner — toasts globais */}
</ReactLenis>
```

O `TopLoader` é um componente customizado (`@components/shared/top-loader`) que escuta `useRouterState()` e exibe uma barra de progresso animada durante transições de rota. **NÃO usamos `pendingComponent` nas definições de rota** — o TopLoader global resolve isso.

### Router Context

O router recebe `QueryClient` via contexto, disponível em todos os `loader` e `beforeLoad`:

```tsx
// src/router.tsx
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',       // Prefetch ao hover/focus em links
  defaultPendingMinMs: 200,        // Evita flash de loading muito rápido
  context: { queryClient },
})
```

### Padrão de Rota — Ciclo de Vida

Toda rota segue este ciclo:

1. **`beforeLoad`** — SEO + Guards (síncrono ou async):
   ```tsx
   beforeLoad: () => {
     setPageMeta({ title: 'Finza | Dashboard', description: '...' })
   }
   ```

2. **`loader`** — Prefetch de dados (evita waterfalls):
   ```tsx
   loader: ({ context }) => {
     return context.queryClient.ensureQueryData(getWorkspacesQueryOptions())
   }
   ```

3. **`component`** — Renderiza a página usando hooks do api-client:
   ```tsx
   function DashboardPage() {
     const { data: workspaces } = useGetWorkspaces()
     return <WorkspaceList workspaces={workspaces ?? []} />
   }
   ```

> **Importante:** O `loader` faz prefetch com `ensureQueryData()`, e o componente consome via hooks normais (`useGet*`). O cache do React Query garante que não há double-fetch.

### Guard de Autenticação

O layout `_authenticated/route.tsx` protege todas as rotas filhas:

```tsx
beforeLoad: async ({ context }) => {
  try {
    await context.queryClient.ensureQueryData(getProfileQueryOptions())
  } catch {
    throw redirect({ to: '/login' })
  }
}
```

Se o usuário não está autenticado, é redirecionado para `/login`. Todas as rotas dentro de `_authenticated/` herdam essa proteção automaticamente.

---

## 5. 🏢 A Lei do Workspace (Isolamento de Tenant)

- A Finza é multi-tenant. Dados financeiros pertencem a um `workspace`.
- **Estado atual:** O dashboard (`/_authenticated/dashboard`) funciona como **hub de seleção de workspace**. O usuário visualiza todos os seus workspaces e escolhe um.
- Quando rotas workspace-scoped forem criadas (ex: transações, caixas de propósito), elas devem residir sob um caminho dinâmico do tenant: `src/routes/_authenticated/$workspaceId/`.
- Nesse caso, extraia o `workspaceId` dos parâmetros da rota (`Route.useParams()`) e repasse para os hooks do `@finza/api-client`. **NUNCA** assuma um workspace global genérico.

---

## 6. 🔐 Autenticação (AuthProvider)

### Arquitetura

O estado de autenticação é gerenciado por um `AuthProvider` no `main.tsx`:

```
QueryClientProvider → AuthProvider → RouterProvider
```

- **`AuthProvider`** (`@features/auth/context/auth-context`): Usa `useGetProfile()` para manter o estado do usuário logado.
- **`useAuth()`**: Hook para acessar `{ user, isLoading, isAuthenticated }` em qualquer componente.
- **Guard de rota**: O `_authenticated/route.tsx` usa `ensureQueryData(getProfileQueryOptions())` no `beforeLoad` — se falhar, redireciona para `/login`.

> O `AuthProvider` é um componente React normal (não de rota). Ele vive acima do Router para que o estado de autenticação esteja disponível antes de qualquer guard.

---

## 7. 🔍 SEO e Metadados por Rota

Cada rota deve definir metadados usando `setPageMeta()` no `beforeLoad`:

```tsx
import { setPageMeta } from '@lib/seo'

beforeLoad: () => {
  setPageMeta({
    title: 'Finza | Nome da Página',
    description: 'Descrição para SEO e Open Graph.',
    canonical: 'https://app.finza.com.br/pagina',   // opcional
  })
}
```

A função `setPageMeta()` atualiza de forma imperativa: `<title>`, `<meta description>`, Open Graph, Twitter Card e `<link rel="canonical">`.

> Sempre defina `title` e `description`. O `canonical` é preenchido automaticamente com `APP_URL + pathname` se omitido.

---

## 8. 🎨 Integração com o Design System (Skill Obrigatória)

Antes de gerar, refatorar ou propor qualquer alteração na UI/UX, você **DEVE** ler e aplicar obrigatoriamente as regras da Skill global de design.

- **Referência:** Consulte o arquivo `skills/finza-design-system`.
- **Mandato:** Se o usuário pedir "Crie uma tela ...", você deve projetá-la com a estética "Wealth Tech Elite" detalhada na skill, sem perguntar.

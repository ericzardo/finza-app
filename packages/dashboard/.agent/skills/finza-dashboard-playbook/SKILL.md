---
name: finza-dashboard-playbook
description: Playbook de execução para o pacote @finza/dashboard. Guia passo a passo para criar novas rotas TanStack Router e features com integração ao @finza/api-client (Kubb).
---

# 🛠️ Finza Dashboard Playbook — Guia de Execução

> ⚡ **Pré-requisito obrigatório:** Leia `packages/dashboard/CLAUDE.md` (ou `.agent/rules/instructions.md`) antes de executar qualquer tarefa. Lá estão as leis de arquitetura, roteamento, fetching e todos os exemplos canônicos. Este playbook é apenas o mapa de execução.

---

## Playbook 1 — Criar Nova Rota Autenticada

### Passo 1 — Criar arquivo de rota

Arquivo em `src/routes/_authenticated/{nome-da-rota}.tsx` (ou dentro de `$workspaceId/` se for workspace-scoped).

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/{nome-da-rota}')({
  beforeLoad: () => {
    // SEO obrigatório
    setPageMeta({ title: 'Finza | Nome', description: '...' })
  },
  loader: ({ context }) => {
    // Prefetch — evita waterfall
    return context.queryClient.ensureQueryData(getXQueryOptions())
  },
  component: NomeDaPaginaPage,
})
```

**Checklist:**
- [ ] `setPageMeta()` definido no `beforeLoad` (importar de `@lib/seo`)
- [ ] `loader` usa `ensureQueryData()` — nunca `fetchQuery()`
- [ ] Rota está sob `_authenticated/` (para herdar o guard de autenticação)
- [ ] `routeTree.gen.ts` é auto-gerado — nunca editar manualmente

---

### Passo 2 — Criar Feature Folder

```
src/features/{domain}/
├── components/       # UI específica
├── hooks/            # Custom hooks de lógica
├── context/          # Contextos React do domínio (se necessário)
├── api/              # Wrappers opcionais sobre @finza/api-client
└── types.ts          # Tipos locais da feature
```

---

### Passo 3 — Componente da Página

```tsx
// src/features/{domain}/components/{domain}-page.tsx
import { useGetX } from '@finza/api-client/hooks'
import type { GetXQueryResponse } from '@finza/api-client'

export function NomeDaPaginaPage() {
  const { data } = useGetX()    // cache do React Query — sem double-fetch do loader
  return <div>{/* render */}</div>
}
```

**Checklist:**
- [ ] Hooks importados de `@finza/api-client/hooks`
- [ ] Tipos importados de `@finza/api-client` (com `import type`)
- [ ] Schemas importados de `@finza/api-client/schemas`
- [ ] **Nunca** usar `fetch()`, `axios` manual ou tipos de API escritos à mão

---

## Playbook 2 — Criar Rota Workspace-Scoped

```
src/routes/_authenticated/$workspaceId/{nome}.tsx
```

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { setWorkspaceId } from '@lib/api-client/workspace-interceptor'
import { XSkeleton } from '@features/{domain}/components/x-skeleton'

export const Route = createFileRoute('/_authenticated/$workspaceId/{nome}')({
  pendingComponent: XSkeleton,    // ← use aqui para skeleton de conteúdo
  beforeLoad: () => {
    setPageMeta({ title: 'Finza | Nome', description: '...' })
  },
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(getXQueryOptions(params.workspaceId))
  },
  component: XPage,
})

function XPage() {
  const { workspaceId } = Route.useParams()

  useEffect(() => {
    setWorkspaceId(workspaceId)
    return () => setWorkspaceId(null)   // limpa ao sair da rota
  }, [workspaceId])

  const { data } = useGetX()
  return <div>{/* render */}</div>
}
```

**Checklist:**
- [ ] `pendingComponent` aponta para um Skeleton da feature (não globais de navegação)
- [ ] `setWorkspaceId()` chamado no `useEffect` com cleanup
- [ ] `workspaceId` extraído via `Route.useParams()` — nunca assuma um workspace global

---

## Playbook 3 — Criar Formulário com Mutation

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePostX } from '@finza/api-client/hooks'
import { postXMutationRequestSchema } from '@finza/api-client/schemas'
import type { PostXMutationRequest } from '@finza/api-client'
import { toast } from 'sonner'

export function CreateXDialog() {
  const form = useForm<PostXMutationRequest>({
    resolver: zodResolver(postXMutationRequestSchema),
  })

  const { mutate, isPending } = usePostX({
    mutation: {
      onSuccess: () => {
        toast.success('X criado.')
        form.reset()
        queryClient.invalidateQueries({ queryKey: getXQueryKey() })
      },
      onError: (error) => toast.error(error.message),
    },
  })

  return (
    <form onSubmit={form.handleSubmit((data) => mutate({ data }))}>
      {/* campos */}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar'}
      </Button>
    </form>
  )
}
```

**Checklist:**
- [ ] Schema de validação vem de `@finza/api-client/schemas`
- [ ] Tipo do form vem de `@finza/api-client`
- [ ] `onError` usa `error.message` (interceptor Axios já mapeou a mensagem do backend)
- [ ] Feedback visual: `toast.success` / `toast.error` (Sonner) — nunca `alert()`
- [ ] Inputs desabilitados com `disabled={isPending}`

---

## Checklist Final

Antes de considerar a tarefa pronta:

- [ ] `setPageMeta()` no `beforeLoad` de toda rota?
- [ ] `loader` usa `ensureQueryData()` para prefetch?
- [ ] Nenhum `fetch()` ou `axios` manual no código?
- [ ] Todos os tipos vêm de `@finza/api-client`?
- [ ] Rota autenticada está sob `_authenticated/`?
- [ ] Rota workspace-scoped usa `setWorkspaceId()` com cleanup?
- [ ] `pendingComponent` com Skeleton apenas em rotas de conteúdo (não de layout)?
- [ ] Consulte a skill `finza-design-system` para identidade visual e componentes?

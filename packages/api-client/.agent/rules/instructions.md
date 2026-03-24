# @finza/api-client — Padrões e Regras de Código

## Objetivo

Este pacote é o **contrato vivo** entre o backend e o frontend da Finza. Ele usa o **Kubb** para gerar automaticamente a partir do OpenAPI da API: tipos TypeScript, hooks TanStack Query, schemas Zod, mocks MSW e dados fake.

> **Regra de ouro:** NUNCA edite arquivos em `src/generated/` manualmente. Eles são sobrescritos a cada geração.

---

## 1. Plugins Kubb e seus Outputs

| Plugin | Versão | Output em `src/generated/` |
|---|---|---|
| `@kubb/plugin-oas` | 4.x | — (parser do OpenAPI) |
| `@kubb/plugin-ts` | 4.x | `types/` — Tipos e interfaces TypeScript |
| `@kubb/plugin-client` | 4.x | `clients/` — Funções Axios por endpoint |
| `@kubb/plugin-react-query` | 4.x | `hooks/` — Hooks TanStack Query v5 |
| `@kubb/plugin-zod` | 4.x | `schemas/` — Schemas Zod de validação |
| `@kubb/plugin-msw` | 4.x | `mocks/` — Handlers MSW |
| `@kubb/plugin-faker` | 4.x | `mocks/` — Geradores de dados fake |

---

## 2. Fluxo de Geração (passo a passo)

```bash
# 1. A API precisa estar RODANDO na porta 9999
bun run dev:api          # a partir da raiz do monorepo

# 2. Execute a geração a partir da raiz
bun run generate:client  # equivale a: bun --filter api-client generate

# Ou diretamente dentro do pacote:
cd packages/api-client
bunx kubb generate
```

**O que acontece:**
1. Kubb lê `http://localhost:9999/docs/json` (OpenAPI gerado automaticamente pelo Fastify/Swagger)
2. Limpa e regenera toda a pasta `src/generated/`
3. Formata os arquivos gerados com Biome
4. Os arquivos ficam disponíveis para o dashboard via os 3 entry points

> Se a API não estiver rodando, a geração falha com erro de conexão.

---

## 3. Os 3 Entry Points de Importação

Todo consumo do `@finza/api-client` deve usar **exclusivamente** estes entry points:

```typescript
// 1. TIPOS — para type annotations (import type)
import type { GetProfileQueryResponse, PostUsersRequest } from '@finza/api-client'

// 2. HOOKS — para fetching em componentes React
import { useGetWorkspaces, getWorkspacesQueryOptions } from '@finza/api-client/hooks'
import { usePostAuthLogin } from '@finza/api-client/hooks'
import { usePostWorkspaces } from '@finza/api-client/hooks'

// 3. SCHEMAS — para validação de formulários com Zod + React Hook Form
import { postAuthLoginMutationRequestSchema } from '@finza/api-client/schemas'
import { postWorkspacesMutationRequestSchema } from '@finza/api-client/schemas'
```

---

## 4. Convenções de Nomenclatura dos Arquivos Gerados

O Kubb deriva os nomes a partir do método HTTP + caminho do endpoint:

| Tipo | Padrão | Exemplos Reais |
|---|---|---|
| Hook Query (GET) | `useGet{Resource}` | `useGetProfile`, `useGetWorkspaces`, `useGetHealth` |
| Hook Mutation (POST) | `usePost{Resource}` | `usePostUsers`, `usePostAuthLogin`, `usePostWorkspaces` |
| Hook Mutation (PATCH) | `usePatch{Resource}` | `usePatchProfile`, `usePatchProfilePrivacy` |
| Hook Mutation (DELETE) | `useDelete{Resource}` | `useDeleteWorkspace` |
| QueryOptions | `get{Resource}QueryOptions` | `getProfileQueryOptions`, `getWorkspacesQueryOptions` |
| Schema Request | `post{Resource}MutationRequestSchema` | `postAuthLoginMutationRequestSchema` |
| Schema Response | `get{Resource}QueryResponseSchema` | `getProfileQueryResponseSchema` |
| Type Request | `Post{Resource}MutationRequest` | `PostAuthLoginMutationRequest` |
| Type Response | `Get{Resource}QueryResponse` | `GetProfileQueryResponse` |

---

## 5. Custom Axios Client (`src/client.ts`)

Este arquivo **não é gerado** — é mantido manualmente. Configura o Axios para toda a comunicação com a API.

```typescript
// src/client.ts
import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: env.API_URL || 'http://localhost:9999',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // Envia cookies HttpOnly automaticamente
})

// Interceptor de erro
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Mapeia mensagem do backend
    if (error.response?.data?.message) {
      error.message = error.response.data.message
    }

    // Redireciona para /login em 401 (fora de rotas públicas)
    if (error.response?.status === 401) {
      const publicPaths = ['/', '/login', '/sign-up']
      const isPublic = publicPaths.some((p) => window.location.pathname === p)
      if (!isPublic) window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)
```

**Pontos críticos:**
- `withCredentials: true` é obrigatório para que o browser envie o cookie `finza_token`.
- O interceptor de 401 garante que sessões expiradas redirecionem para login.
- O mapeamento de `error.response.data.message` é o que permite `error.message` ter a mensagem do backend no frontend.

---

## 6. Estrutura de `src/generated/`

```
src/generated/
├── index.ts          # Re-exporta tudo (barrel)
├── types/            # Um arquivo por endpoint (ex: PostUsers.ts, GetProfile.ts)
├── clients/          # Funções Axios por endpoint (ex: postUsers.ts)
├── hooks/            # Hooks TanStack Query (ex: usePostUsers.ts, useGetProfile.ts)
│   └── index.ts
├── schemas/          # Schemas Zod (ex: postUsersMutationRequestSchema)
│   └── index.ts
└── mocks/            # MSW handlers + Faker data
    └── index.ts
```

---

## 7. Exemplo de Hook Gerado

```typescript
// src/generated/hooks/useGetProfile.ts (gerado automaticamente)

export function useGetProfile(
  config: Partial<RequestConfig> & { client?: Client } = {},
): UseQueryResult<GetProfileQueryResponse, ResponseErrorConfig<Error>> {
  return useQuery({
    queryKey: getProfileQueryKey(),
    queryFn: async ({ signal }) => getProfile({ ...config, signal }),
  })
}

// Para uso em loaders (TanStack Router):
export function getProfileQueryOptions(config = {}) {
  return queryOptions({
    queryKey: getProfileQueryKey(),
    queryFn: async ({ signal }) => getProfile({ ...config, signal }),
  })
}
```

---

## 8. Observações Importantes

- **Nunca** edite arquivos em `src/generated/` — são sobrescritos a cada `kubb generate`.
- Arquivos customizados ficam em `src/` (fora de `generated/`): `client.ts`, `env.ts`.
- O Kubb formata os arquivos gerados com **Biome** automaticamente.
- A consistência do OpenAPI é crítica: toda rota da API deve ter `tags`, `summary` e `response` definidos para que a geração seja perfeita.
- Os arquivos gerados devem ser commitados no repositório (são parte do contrato).


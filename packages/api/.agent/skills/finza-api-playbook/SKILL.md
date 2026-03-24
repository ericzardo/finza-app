---
name: finza-api-playbook
description: Playbook de execução para o pacote @finza/api. Guia passo a passo para criar novos endpoints com a arquitetura Vertical Slices da Finza — schema Zod, use case, controller, rota e teste.
---

# 🛠️ Finza API Playbook — Guia de Execução

> ⚡ **Pré-requisito obrigatório:** Leia `packages/api/CLAUDE.md` (ou `.agent/rules/instructions.md`) antes de executar qualquer tarefa. Lá estão as leis de arquitetura, padrões de código e todos os exemplos canônicos. Este playbook é apenas o mapa de execução.

---

## Playbook 1 — Criar Novo Endpoint

Execute os passos na ordem abaixo. Não pule etapas.

### Passo 1 — Schema Zod (`src/features/{feature}/schemas.ts`)

```typescript
import { z } from 'zod'

// Body de entrada
export const createXBodySchema = z.object({
  name: z.string().min(1).describe('...'),
})

// Response de sucesso
export const createXResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
})
```

**Checklist:**
- [ ] Mensagens de validação em PT-BR
- [ ] Uso de `.describe()` em todos os campos (necessário para o Swagger)
- [ ] Sem tipos TypeScript manuais — Zod é a única fonte de verdade

---

### Passo 2 — Use Case (`src/features/{feature}/usecases/{action}.ts`)

```typescript
import type { PrismaClient } from '@prisma/client'
import { AppError, ErrorCode } from '@errors/app-error'

export async function createX(db: PrismaClient, input: { name: string }) {
  // lógica de negócio aqui
  // erros previstos: throw new AppError(ErrorCode.X, statusCode, 'mensagem PT-BR')
}
```

**Checklist:**
- [ ] `db` (PrismaClient) é sempre o **primeiro parâmetro**
- [ ] Sem imports de `prisma` diretamente — recebe via argumento
- [ ] Todo erro previsto usa `throw new AppError(ErrorCode.X, status, 'msg')`
- [ ] Sem lógica HTTP (nada de `request`, `reply`, `FastifyRequest`)

---

### Passo 3 — Controller (`src/features/{feature}/controllers/{action}.controller.ts`)

```typescript
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createX } from '@features/{feature}/usecases/create-x'

export async function createXController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const body = request.body as { name: string }
  const result = await createX(fastify.prisma, body)
  return reply.code(201).send(result)
}
```

**Checklist:**
- [ ] Extrai dados de `request.body`, `request.params`, `request.user`
- [ ] Chama use case com `fastify.prisma` como primeiro argumento
- [ ] **Zero lógica de negócio** — apenas orquestra e responde
- [ ] **Nunca** trata erros com try/catch — o handler global faz isso

---

### Passo 4 — Rota (`src/features/{feature}/routes.ts`)

```typescript
import type { FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { appErrorSchema } from '@errors/app-error-schemas'
import { createXBodySchema, createXResponseSchema } from './schemas'
import { createXController } from './controllers/create-x.controller'

export async function featureRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/endpoint',
    {
      schema: {
        tags: ['feature'],
        summary: 'Descrição curta',
        description: 'Descrição completa da operação.',
        body: createXBodySchema,
        response: {
          201: createXResponseSchema,
          400: appErrorSchema.describe('Erro de validação'),
          409: appErrorSchema.describe('Conflito'),
        },
      },
    },
    (request, reply) => createXController(request, reply, fastify),
  )
}
```

**Checklist Swagger (crítico para o Kubb):**
- [ ] `tags` preenchido
- [ ] `summary` curto e descritivo
- [ ] `description` completa
- [ ] Todos os status de erro mapeados com `appErrorSchema`
- [ ] Rotas autenticadas têm `security: [{ cookieAuth: [] }]` e `preHandler: fastify.authenticate`

---

### Passo 5 — Registrar em `src/app.ts`

```typescript
import { featureRoutes } from '@features/{feature}/routes'

// Dentro do builder do Fastify:
fastify.register(featureRoutes)
```

---

### Passo 6 — Teste Unitário do Use Case

```typescript
import { describe, it, expect, mock } from 'bun:test'
import { createX } from './usecases/create-x'

describe('createX', () => {
  it('throws CONFLICT if X already exists', async () => {
    const db = { x: { findUnique: mock(() => ({ id: '1' })) } } as any
    expect(createX(db, { name: 'test' })).rejects.toThrow('...')
  })
})
```

**Checklist:**
- [ ] Use case testado de forma unitária com mock do PrismaClient
- [ ] Cada `AppError` esperado tem um caso de teste
- [ ] Caso de sucesso coberto

---

## Playbook 2 — Adicionar Rota Autenticada + Workspace-Scoped

Para rotas que requerem autenticação e isolamento de workspace:

```typescript
fastify.withTypeProvider<ZodTypeProvider>().get(
  '/workspace-data',
  {
    preHandler: [fastify.authenticate, fastify.workspaceGuard],
    schema: {
      tags: ['workspace'],
      security: [{ cookieAuth: [] }],
      headers: z.object({
        'x-workspace-id': z.string().uuid(),
      }),
      response: { 200: responseSchema, 401: appErrorSchema, 403: appErrorSchema },
    },
  },
  (request, reply) => getWorkspaceDataController(request, reply, fastify),
)
```

---

## Checklist Final de Segurança

Antes de considerar o endpoint pronto:

- [ ] Swagger: `tags` + `summary` + `description` + todos os `response` mapeados?
- [ ] O Kubb vai gerar corretamente? (OpenAPI completo e consistente)
- [ ] Use case recebe `db` como primeiro parâmetro?
- [ ] Controller tem zero lógica de negócio?
- [ ] Erros usam apenas `AppError` com `ErrorCode`?
- [ ] Imports usam aliases absolutos (`@features/`, `@errors/`, `@/env`)?
- [ ] Testes unitários cobrem os casos de erro previstos?

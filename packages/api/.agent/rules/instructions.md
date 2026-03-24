# @finza/api — Instruções de Arquitetura e Padrões de Código

Você é um Engenheiro Back-end Sênior operando no pacote `packages/api` da Finza.

---

## 1. Stack e Dependências Core

| Componente | Tecnologia | Versão |
|---|---|---|
| Framework | Fastify | 5.x |
| ORM | Prisma | 7.x |
| Banco | PostgreSQL + Prisma Accelerate | — |
| Validação | Zod 4 + `fastify-type-provider-zod` | 4.x |
| Auth | JWT + HttpOnly Cookies (`jsonwebtoken`, `@fastify/cookie`) | — |
| Password | bcrypt | — |
| Docs | @fastify/swagger + @scalar/fastify-api-reference | — |
| Rate Limit | @fastify/rate-limit | — |
| CORS | @fastify/cors | — |
| Runtime | Bun | — |

---

## 2. Arquitetura — Vertical Slices + Use Cases Funcionais

Cada funcionalidade é um **slice vertical** isolado dentro de `src/features/{feature}/`.

### Estrutura de Pastas

```
src/
├── features/
│   └── {feature}/
│       ├── domain/           # Tipos e contratos TypeScript (quando necessário)
│       ├── usecases/         # Funções puras de negócio (um arquivo por caso de uso)
│       ├── controllers/      # Handlers HTTP (um arquivo por caso de uso)
│       ├── schemas.ts        # Schemas Zod de validação (mensagens em PT-BR)
│       └── routes.ts         # Registro das rotas da feature
├── plugins/                  # Setup global do servidor
│   ├── prisma.plugin.ts      # Decora fastify.prisma
│   ├── error-handler.plugin.ts
│   ├── swagger.plugin.ts     # Docs em /docs
│   └── rate-limit.plugin.ts
├── hooks/                    # Middlewares de rota
│   ├── auth-guard.ts         # Verifica JWT, popula request.user
│   └── workspace-guard.ts    # Isola dados por workspace
├── errors/
│   ├── app-error.ts          # Classe AppError + enum ErrorCode
│   └── app-error-schemas.ts  # Schema Zod do formato de erro
├── config/
│   └── plans.ts
├── env.ts                    # Variáveis de ambiente validadas com Zod
├── app.ts                    # Builder do FastifyInstance
└── index.ts                  # Startup do servidor
```

**Features ativos:** `auth/`, `users/`, `workspaces/`, `health/`

---

## 3. Padrão de Implementação (do schema à rota)

### 3.1 — Schema Zod (`schemas.ts`)

```typescript
// src/features/users/schemas.ts
import { z } from 'zod'

export const signupBodySchema = z.object({
  name: z.string().min(3).max(120).describe('Nome completo do usuário'),
  email: z.string().email().describe('E-mail do usuário'),
  password: z.string().min(8).describe('Senha (mínimo 8 caracteres)'),
})

export const signupResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  plan: z.string(),
  avatar_url: z.string().nullable(),
})
```

> Schemas Zod são a **única** fonte de validação. Nunca duplique tipos TypeScript manualmente.

### 3.2 — Use Case (`usecases/{action}.ts`)

```typescript
// src/features/users/usecases/create-user.ts
import type { PrismaClient } from '@prisma/client'
import { AppError, ErrorCode } from '@errors/app-error'
import bcrypt from 'bcrypt'

export async function createUser(
  db: PrismaClient,
  { name, email, password }: { name: string; email: string; password: string },
) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    throw new AppError(ErrorCode.CONFLICT, 409, 'E-mail já cadastrado')
  }

  const plan = await db.plan.findUnique({ where: { slug: 'beta' } })
  if (!plan) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, 'Plano inicial não encontrado')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  return db.user.create({
    data: { name, email, password: hashedPassword, plan_id: plan.id },
  })
}
```

**Regras do Use Case:**
- Sempre funções puras — sem dependências globais ou singletons.
- O `db` (instância Prisma) é **sempre o primeiro parâmetro**.
- Use cases nunca importam `prisma` diretamente — recebem via argumento.
- Erros previstos: sempre `throw new AppError(...)`.

### 3.3 — Controller (`controllers/{action}.controller.ts`)

```typescript
// src/features/users/controllers/create-user.controller.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createUser } from '@features/users/usecases/create-user'

export async function createUserController(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
) {
  const body = request.body as { name: string; email: string; password: string }
  const user = await createUser(fastify.prisma, body)

  return reply.code(201).send({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: 'beta',
    avatar_url: user.avatar_url,
  })
}
```

**Regras do Controller:**
- Extrai dados de `request.body`, `request.params`, `request.user`.
- Chama use case com `fastify.prisma` como primeiro argumento.
- Retorna resposta HTTP via `reply`.
- **Nenhuma lógica de negócio** no controller.

### 3.4 — Rota (`routes.ts`)

```typescript
// src/features/users/routes.ts
import type { FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { appErrorSchema } from '@errors/app-error-schemas'
import { signupBodySchema, signupResponseSchema } from './schemas'
import { createUserController } from './controllers/create-user.controller'

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        tags: ['users'],
        summary: 'Cadastro de usuário',
        description: 'Cria um novo usuário na plataforma.',
        body: signupBodySchema,
        response: {
          201: signupResponseSchema,
          400: appErrorSchema.describe('Erro de validação'),
          409: appErrorSchema.describe('E-mail já cadastrado'),
        },
        security: [],
      },
    },
    (request, reply) => createUserController(request, reply, fastify),
  )
}
```

---

## 4. Autenticação e Middlewares

### Cookie e JWT

- **Cookie:** `finza_token` (HttpOnly, Secure).
- JWT **nunca** é retornado em payloads de resposta — apenas em cookie.

### Auth Guard (`src/hooks/auth-guard.ts`)

```typescript
// Decorador: fastify.authenticate
// Popula: request.user = { sub: string, email: string }

fastify.withTypeProvider<ZodTypeProvider>().get('/profile', {
  preHandler: fastify.authenticate,   // <-- aplica o guard
  schema: {
    tags: ['users'],
    security: [{ cookieAuth: [] }],
    response: { 200: profileResponseSchema, 401: appErrorSchema },
  },
}, (request, reply) => getProfileController(request, reply, fastify))
```

### Workspace Guard (`src/hooks/workspace-guard.ts`)

- Lê o header `x-workspace-id` enviado pelo frontend.
- Usado em rotas que retornam dados financeiros de um workspace.

---

## 5. Tratamento de Erros

### ErrorCode enum (use APENAS estes valores)

```typescript
export enum ErrorCode {
  NOT_FOUND              = 'NOT_FOUND',
  UNAUTHORIZED           = 'UNAUTHORIZED',
  FORBIDDEN              = 'FORBIDDEN',
  BAD_REQUEST            = 'BAD_REQUEST',
  CONFLICT               = 'CONFLICT',
  INTERNAL_SERVER_ERROR  = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR       = 'VALIDATION_ERROR',
  HEALTH_CHECK_FAILED    = 'HEALTH_CHECK_FAILED',
  TOO_MANY_REQUESTS      = 'TOO_MANY_REQUESTS',
}
```

### Lançando erros em use cases

```typescript
throw new AppError(ErrorCode.CONFLICT, 409, 'E-mail já cadastrado')
throw new AppError(ErrorCode.NOT_FOUND, 404, 'Workspace não encontrado')
throw new AppError(ErrorCode.UNAUTHORIZED, 401, 'Token inválido ou expirado')
```

### Handler global (`src/plugins/error-handler.plugin.ts`)

O handler intercepta automaticamente e mapeia:
1. Erros de validação Zod → 400 com campo `details` (field-level)
2. `instanceof AppError` → `error.statusCode` com `code` e `message`
3. Erros inesperados → 500 `INTERNAL_SERVER_ERROR`

> **Nunca** trate erros dentro do controller — deixe o handler global agir.

---

## 6. Variáveis de Ambiente (`src/env.ts`)

Todas as variáveis são validadas com Zod no startup. Se estiver faltando, a API não sobe.

```typescript
// Variáveis disponíveis via: import { env } from '@/env'
NODE_ENV      // 'dev' | 'prod' | 'test'
PORT          // default: 9999
HOST          // default: '0.0.0.0'
DATABASE_URL  // URL com pool (Prisma Accelerate)
DIRECT_URL    // URL direta ao PostgreSQL (migrations e seeds — sem pool)
APP_URL       // URL do frontend (CORS)
JWT_SECRET    // Mínimo 8 caracteres
RESEND_API_KEY // Opcional (e-mail)
```

> `DATABASE_URL` usa o Prisma Accelerate (pooled). `DIRECT_URL` é a conexão direta ao banco, **obrigatória para migrations** (`prisma migrate dev`).

---

## 7. Banco de Dados (Prisma)

### Modelos principais

`Plan` · `User` · `Token` · `Workspace` · `WorkspaceMember` · `BankAccount` · `CreditCard` · `Bucket` · `Category` · `Transaction` · `Invoice` · `TransactionPattern` · `TransactionSplit`

### Enums

`WorkspaceRole (OWNER | EDITOR | VIEWER)` · `InvoiceStatus (OPEN | CLOSED | PAID)` · `TransactionType (INCOME | EXPENSE | TRANSFER)` · `PatternType (INSTALLMENT | RECURRING)` · `BucketType (SPENDING | INVESTMENT | INBOX)` · `TokenType (PASSWORD_RESET | EMAIL_VERIFICATION)`

### Workflow de migrations

```bash
# Criar e aplicar nova migration
bunx prisma migrate dev --name descricao-da-mudanca

# Gerar tipos TypeScript (após alterar o schema)
bunx prisma generate

# Popular banco de desenvolvimento
bun run seed:dev

# Formatar o schema
bunx prisma format
```

> `prisma migrate dev` usa `DIRECT_URL` automaticamente. Nunca use `db push` em produção.

---

## 8. Scripts do Package (`package.json`)

```bash
bun run dev         # bun --env-file=.env.dev --hot src/index.ts
bun run test        # bun test --env-file=.env.test --timeout 10000
bun run typecheck   # bunx tsc --noEmit
bun run seed:dev    # bun --env-file=.env.dev db/prisma/seed.ts
bun run seed:prod   # bun --env-file=.env.prod db/prisma/seed.ts
```

> Linting é feito com **Biome** a partir da raiz: `bun run lint` (não há `eslint` neste projeto).

---

## 9. Padrão de Imports

- Sempre use **imports absolutos** via aliases definidos no `tsconfig.json`.
- **Nunca** inclua extensões `.ts` ou `.js` nos imports.

```typescript
// ✅ Correto
import { AppError, ErrorCode } from '@errors/app-error'
import { createUser } from '@features/users/usecases/create-user'
import { env } from '@/env'

// ❌ Errado
import { AppError } from '../../errors/app-error.ts'
```

---

## 10. Documentação Swagger

- **Toda rota** deve ter `tags`, `summary`, `description` e `response` no schema.
- Os schemas Zod em `schemas.ts` geram automaticamente a documentação via `@fastify/swagger`.
- A UI está disponível em `http://localhost:9999/docs`.
- **Consistência é crítica**: o Kubb lê esse OpenAPI para gerar o `@finza/api-client`.

---

## 11. Testes (`bun:test`)

- Use `bun:test` para testes unitários e de integração.
- Testes de use cases são **unitários**: passe um mock do `PrismaClient`.
- Testes de integração: use o banco de `.env.test`.

```typescript
// Exemplo: teste unitário de use case
import { describe, it, expect, mock } from 'bun:test'
import { createUser } from './usecases/create-user'

describe('createUser', () => {
  it('throws CONFLICT if email already exists', async () => {
    const db = { user: { findUnique: mock(() => ({ id: '1' })) } } as any
    expect(createUser(db, { name: 'Test', email: 'a@a.com', password: '12345678' }))
      .rejects.toThrow('E-mail já cadastrado')
  })
})
```

---

## 12. Fluxo de Implementação de Nova Feature

1. Crie `src/features/{feature}/`
2. Defina schemas Zod em `schemas.ts` (mensagens em PT-BR)
3. Implemente use cases em `usecases/` (funções puras, `db` como primeiro parâmetro)
4. Implemente controllers em `controllers/` (sem lógica de negócio)
5. Registre as rotas em `routes.ts` (com type provider Zod e metadados Swagger completos)
6. Registre a feature em `src/app.ts` via `fastify.register(featureRoutes)`
7. Escreva testes unitários e de integração para cada use case

---

Siga sempre estas instruções para garantir coesão, escalabilidade e tipagem rigorosa na API.
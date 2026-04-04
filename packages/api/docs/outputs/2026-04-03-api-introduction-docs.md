# Documentação: Introdução à API Finza

## O que é a Finza API?

A Finza é uma plataforma de gestão financeira pessoal baseada em **Orçamento Base Zero (OBZ)** — cada centavo do usuário deve ter um propósito definido. A API é o coração do sistema: ela gerencia usuários, autenticação, workspaces colaborativos, caixas de propósito e transações financeiras.

A API é construída com **Fastify 5** + **Prisma 7** + **TypeScript** e segue a arquitetura de **Vertical Slices** — cada funcionalidade é um módulo isolado dentro de `src/features/`, com seus próprios schemas, use cases, controllers e rotas.

---

## Regras Gerais da Plataforma

- **On-Fly:** Saldos nunca são colunas no banco. São sempre calculados somando transações reais.
- **is_paid:** Transações pendentes são "fantasmas", aparecem como pendentes mas não afetam saldos.
- **is_internal:** Transações criadas automaticamente. Não aparecem no extrato normal do usuário.
- **Caixa de Entrada (INBOX):** É o ponto de entrada do dinheiro. Toda receita entra aqui primeiro. Não pode ser deletado nem renomeado.
- **Cascata:** Se uma despesa é registrada em um caixa sem saldo suficiente e foi paga (`is_paid: true`), o sistema cobre o déficit automaticamente com uma transferência interna saindo do Caixa de Entrada.
- **Recorte temporal:** Toda a matemática respeita o filtro de `startDate` e `endDate` passado na requisição.

---

## Como o servidor sobe

O processo de inicialização da API acontece em dois arquivos:

### 1. Ponto de entrada — `src/index.ts`

O arquivo importa a função `build()` e inicia o servidor Fastify escutando na porta e host definidos pelas variáveis de ambiente. Se algo falhar no startup, o erro é logado e o processo é encerrado com `process.exit(1)`.

### 2. Builder — `src/app.ts`

A função `build()` é responsável por montar toda a instância Fastify na seguinte ordem:

1. **Cria a instância** Fastify com logger habilitado e Type Provider Zod
2. **Configura compiladores** de validação e serialização para Zod
3. **Registra CORS** — aceita requisições apenas da `APP_URL`, com credenciais habilitadas e headers `Content-Type`, `Authorization` e `x-workspace-id`
4. **Registra Cookie** — configura cookies HttpOnly com secret do JWT, secure em produção, `sameSite: lax`, validade de 7 dias
5. **Registra Plugins** — Prisma → Rate Limit → Error Handler → Swagger
6. **Registra Hooks** — Auth Guard → Workspace Guard
7. **Registra Rotas** — Users → Auth → Workspaces → Buckets → Transactions → Health

> A ordem de registro importa: plugins devem ser registrados antes dos hooks e das rotas, pois as rotas dependem de decoradores como `fastify.prisma` e `fastify.authenticate`.

---

## Sistema de Plugins

Os plugins ficam em `src/plugins/` e configuram comportamentos globais do servidor.

### Prisma (`prisma.plugin.ts`)

**O que faz:** Conecta a API ao Supabase e disponibiliza o client Prisma em toda a aplicação.

**Como funciona por dentro:**
- Cria uma instância de `PrismaClient` usando o adapter `PrismaPg` com a `DIRECT_URL` (conexão direta ao banco)
- Decora a instância Fastify com `fastify.prisma`, tornando o client acessível em qualquer ponto da aplicação
- Em ambiente de desenvolvimento (`NODE_ENV === 'dev'`), loga queries, infos, warnings e erros. Em produção, loga apenas erros
- Registra um hook `onClose` que desconecta o Prisma quando o servidor é encerrado

### Error Handler (`error-handler.plugin.ts`)

**O que faz:** Intercepta todos os erros da aplicação e responde com um formato padronizado.

**Como funciona por dentro:**

O handler processa erros em 4 camadas, na seguinte prioridade:

| Prioridade | Tipo de Erro | Status | Formato da Resposta |
|------------|-------------|--------|---------------------|
| 1ª | Erro de validação Zod | 400 | `{ code: "VALIDATION_ERROR", message: "Dados de entrada inválidos", details: { issues: [...] } }` |
| 2ª | `AppError` (erros de negócio) | Definido no erro | `{ code, message, details }` |
| 3ª | Erro nativo do Fastify | Status do erro | `{ code: <mapeado>, message, details: undefined }` |
| 4ª | Erro inesperado | 500 | `{ code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro interno no servidor" }` |

Erros com `statusCode >= 500` ou sem statusCode são logados no console. Erros esperados (4xx) não poluem os logs.

Para erros de validação Zod, o handler normaliza os issues em um formato limpo:
```json
{
  "issues": [
    { "field": "email", "message": "Invalid email" },
    { "field": "password", "message": "String must contain at least 8 character(s)" }
  ]
}
```

### Swagger (`swagger.plugin.ts`)

**O que faz:** Gera documentação OpenAPI automaticamente a partir dos schemas Zod das rotas.

**Como funciona por dentro:**
- Registra `@fastify/swagger` com metadados da API (título "Finza API", versão 1.0.0)
- Configura o security scheme `cookieAuth` do tipo `apiKey` no cookie `finza_token`
- Usa `jsonSchemaTransform` do `fastify-type-provider-zod` para converter schemas Zod em JSON Schema
- Expõe o JSON do OpenAPI em `GET /docs/json`
- Registra `@scalar/fastify-api-reference` em `/docs` com tema purple e cliente HTTP padrão `fetch` (JavaScript)

> **Importante para o frontend:** O Kubb lê o OpenAPI gerado em `/docs/json` para gerar automaticamente o pacote `@finza/api-client` (SDK, hooks, tipos e mocks).

### Rate Limit (`rate-limit.plugin.ts`)

**O que faz:** Protege a API contra abuso limitando o número de requisições por IP.

**Como funciona por dentro:**
- Limite **global**: 100 requisições por minuto por IP
- Rotas **sensíveis** (como `POST /auth/login` e `POST /users`) definem limites próprios: 5 requisições por minuto
- Quando o limite é atingido, lança `AppError` com código `TOO_MANY_REQUESTS` (429) e mensagem: *"Muitas requisições. Por favor, aguarde um momento antes de tentar novamente."*
- A resposta inclui `retryAfter` nos details

**O que os testes garantem** (`rate-limit.integration.spec.ts`):
- A 101ª requisição global em `GET /health` retorna 429
- A 6ª requisição em `POST /auth/login` retorna 429
- A 6ª requisição em `POST /users` retorna 429
- Todas as respostas 429 contêm código `TOO_MANY_REQUESTS` e a mensagem padronizada

---

## Autenticação e Autorização (Hooks)

Os hooks ficam em `src/hooks/` e implementam middlewares reutilizáveis para proteger rotas.

### Auth Guard (`auth-guard.ts`)

**O que faz:** Verifica se o usuário está autenticado via JWT no cookie e disponibiliza seus dados na requisição.

**Quem pode usar:** Qualquer rota que precise de autenticação usa `preHandler: fastify.authenticate`.

**Como funciona por dentro:**
1. Lê o cookie `finza_token` da requisição
2. Se o cookie não existe → lança `UNAUTHORIZED` (401): *"Token de autenticação não encontrado"*
3. Verifica e decodifica o JWT usando `JWT_SECRET`
4. Se o token é inválido ou expirado → lança `UNAUTHORIZED` (401): *"Token inválido ou expirado"*
5. Popula `request.user` com `{ sub: string, email: string }` (o `sub` é o ID do usuário)

**Decorador registrado:** `fastify.authenticate`

**Exemplo de uso em uma rota:**
```typescript
fastify.get('/profile', {
  preHandler: fastify.authenticate,
  schema: { security: [{ cookieAuth: [] }] },
}, handler)
```

> O JWT **nunca** é retornado em payloads de resposta — ele trafega exclusivamente via cookie HttpOnly.

### Workspace Guard (`workspace-guard.ts`)

**O que faz:** Isola os dados financeiros por workspace, garantindo que o usuário só acessa workspaces dos quais é membro.

**Quem pode usar:** Rotas que manipulam dados financeiros (transações, buckets, contas bancárias) usam `preHandler: [fastify.authenticate, fastify.validateWorkspace]`.

**Como funciona por dentro:**
1. Lê o header `x-workspace-id` da requisição
2. Se o header não existe ou não é uma string → lança `BAD_REQUEST` (400): *"Header x-workspace-id é obrigatório"*
3. Verifica se `request.user` está populado (auth guard deve ter rodado antes)
4. Se não há usuário autenticado → lança `UNAUTHORIZED` (401): *"Token de autenticação não encontrado"*
5. Consulta `WorkspaceMember` no banco para verificar se o usuário pertence ao workspace
6. Se não é membro → lança `FORBIDDEN` (403): *"Você não tem permissão para acessar este workspace"*
7. Popula `request.workspaceId` e `request.workspaceMemberRole` (`OWNER`, `EDITOR` ou `VIEWER`)

**Decorador registrado:** `fastify.validateWorkspace`

---

## Tratamento de Erros

### Classe `AppError` (`src/errors/app-error.ts`)

Todos os erros previsíveis da aplicação são lançados como instâncias de `AppError`. A classe estende `Error` e adiciona:

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `code` | `ErrorCode` | Código do erro (enum string) |
| `statusCode` | `number` | Status HTTP correspondente |
| `message` | `string` | Mensagem legível para o usuário |
| `details` | `Record<string, unknown>` (opcional) | Dados extras (ex: campo com erro, retryAfter) |

### Enum `ErrorCode`

| Código | Quando usar |
|--------|-------------|
| `NOT_FOUND` | Recurso não encontrado (404) |
| `UNAUTHORIZED` | Sem autenticação ou token inválido (401) |
| `FORBIDDEN` | Sem permissão para o recurso (403) |
| `BAD_REQUEST` | Requisição malformada (400) |
| `CONFLICT` | Conflito de dados, ex: e-mail duplicado (409) |
| `INTERNAL_SERVER_ERROR` | Erro inesperado do servidor (500) |
| `VALIDATION_ERROR` | Dados de entrada não passaram na validação Zod (400) |
| `HEALTH_CHECK_FAILED` | Falha na verificação de saúde do sistema (503) |
| `TOO_MANY_REQUESTS` | Limite de requisições atingido (429) |

### Schema de Erro para o OpenAPI (`app-error-schemas.ts`)

O `appErrorSchema` é um schema Zod que define o formato padrão de resposta de erro:
```json
{ "code": "NOT_FOUND", "message": "Workspace não encontrado", "details": {} }
```

Esse schema é reutilizado em todas as rotas na definição de `response` para manter o OpenAPI consistente.

---

## Variáveis de Ambiente

Todas as variáveis são validadas com Zod no startup em `src/env.ts`. Se qualquer variável obrigatória estiver faltando, **a API não sobe**.

| Variável | Tipo | Obrigatória | Default | Descrição |
|----------|------|-------------|---------|-----------|
| `NODE_ENV` | `'dev' \| 'prod' \| 'test'` | Não | `'dev'` | Ambiente de execução |
| `PORT` | `number` (inteiro positivo) | Não | `9999` | Porta do servidor |
| `HOST` | `string` | Não | `'0.0.0.0'` | Host do servidor |
| `DATABASE_URL` | `string` | Sim | — | URL de conexão com pool (Prisma Accelerate) |
| `DIRECT_URL` | `string` | Sim | — | URL direta ao PostgreSQL (migrations e conexão do adapter) |
| `APP_URL` | `string` (URL válida) | Não | `'http://localhost:3000'` | URL do frontend (usado no CORS) |
| `JWT_SECRET` | `string` (mín. 8 chars) | Sim | — | Secret para assinar/verificar tokens JWT |
| `RESEND_API_KEY` | `string` | Não | — | Chave da API do Resend para envio de e-mails |

> `DATABASE_URL` é para conexões pooled via Prisma Accelerate. `DIRECT_URL` é a conexão direta, obrigatória para migrations (`prisma migrate dev`) e usada pelo adapter PrismaPg no runtime.

---

## Feature Exemplo: Health Check

A feature `health` é o exemplo mais simples de um vertical slice completo na Finza.

### O que é essa feature?

O Health Check é um endpoint de verificação de saúde da API. Ele testa se o servidor está respondendo e se a conexão com o banco de dados está funcional. É usado por sistemas de monitoramento, load balancers e pelo próprio time para saber se a API está no ar.

---

### Rotas Disponíveis

#### GET /health

**O que faz:** Verifica se a API e o banco de dados estão funcionando.

**Quem pode usar:** Qualquer pessoa — não requer autenticação nem workspace.

##### Dados de entrada

Nenhum. A rota não recebe parâmetros, body ou headers especiais.

##### O que retorna (sucesso)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | `"ok"` (literal) | Indica que a API está respondendo |
| `db` | `"up"` (literal) | Indica que o banco de dados está acessível |

**Exemplo de resposta (200):**
```json
{ "status": "ok", "db": "up" }
```

##### Erros possíveis

| Código | Status | Quando acontece |
|--------|--------|----------------|
| `HEALTH_CHECK_FAILED` | 503 | O banco de dados não respondeu ao `SELECT 1` |

##### Como funciona por dentro

1. O controller recebe a requisição e chama `checkHealthUseCase(fastify.prisma)`
2. O use case executa `SELECT 1` no banco via `db.$queryRaw`
3. Se o banco responde → retorna `{ status: 'ok', db: 'up' }`
4. Se o banco falha (exceção) → lança `AppError` com código `HEALTH_CHECK_FAILED` e status 503, mensagem *"Falha ao verificar a saúde do sistema"*

##### O que os testes garantem

**Testes unitários** (`check-health.spec.ts`):
- Retorna `{ status: 'ok', db: 'up' }` quando o banco está online (mock de `$queryRaw` retorna sucesso)
- Lança `HEALTH_CHECK_FAILED` com status 503 quando o banco está offline (mock de `$queryRaw` lança exceção)

**Teste de integração** (`routes.integration.spec.ts`):
- `GET /health` retorna status HTTP 200
- O corpo da resposta passa na validação do `healthCheckResponseSchema` (Zod)

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Vertical Slice** | Padrão de arquitetura onde cada funcionalidade é um módulo isolado com seus próprios schemas, use cases, controllers e rotas, em vez de separar por camada (MVC). |
| **Plugin** | Módulo Fastify registrado globalmente que adiciona capacidades ao servidor (ex: conexão com banco, rate limit, swagger). Usa `fastify-plugin` para compartilhar decoradores entre escopos. |
| **Hook / Guard** | Middleware executado antes da rota (`preHandler`) que valida condições como autenticação ou permissão. Se falhar, a rota não é executada. |
| **AppError** | Classe de erro customizada da Finza com código, status HTTP e mensagem. Usada para todos os erros previsíveis de negócio. |
| **ErrorCode** | Enum com 9 valores possíveis que categoriza cada erro da aplicação (ex: `NOT_FOUND`, `UNAUTHORIZED`). |
| **Rate Limit** | Proteção contra abuso que limita o número de requisições por IP em uma janela de tempo. |
| **Type Provider** | Integração do Fastify com Zod que permite definir schemas de validação que geram automaticamente tipos TypeScript e documentação OpenAPI. |
| **OBZ (Orçamento Base Zero)** | Metodologia financeira onde cada centavo do orçamento deve ser atribuído a um propósito. A Finza implementa isso através dos Buckets. |
| **Bucket (Caixa de Propósito)** | Unidade central da Finza. Cada bucket tem um propósito financeiro (ex: "Alimentação", "Investimentos"). Pode ser do tipo SPENDING, INVESTMENT ou INBOX. |
| **On-Fly** | Princípio da Finza onde saldos nunca são armazenados como colunas no banco — são sempre calculados em tempo real somando transações. |
| **Cascata** | Mecanismo automático que transfere dinheiro do INBOX para cobrir déficits em buckets quando uma despesa paga é registrada sem saldo suficiente. |
| **Workspace** | Espaço compartilhado de gestão financeira. Cada workspace pode ter membros com papéis (OWNER, EDITOR, VIEWER) e contém seus próprios buckets, transações e contas. |
| **Decorador Fastify** | Propriedade adicionada à instância Fastify (ex: `fastify.prisma`, `fastify.authenticate`) que fica disponível em toda a aplicação. |

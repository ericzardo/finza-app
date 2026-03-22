# Finza API

API moderna baseada em Fastify, Prisma e Zod, seguindo o padrão Vertical Slice e Use Cases Funcionais.

## Requisitos
- Node.js 18+ (ou Bun)
- Banco de dados PostgreSQL

## Instalação

```bash
bun install # ou npm install
```

## Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto. Exemplo:

```env
NODE_ENV="dev"
PORT='9999'
HOST='0.0.0.0'
DATABASE_URL='postgresql://usuario:senha@host:porta/db'
DIRECT_URL='postgresql://usuario:senha@host:porta/db'
APP_URL='http://localhost:3000'
JWT_SECRET='sua_senha_segura'
RESEND_API_KEY='opcional_para_emails'
```

Veja `.env.example` para referência.

## Scripts

- `bun run dev` — Inicia o servidor em modo desenvolvimento
- `bun run build` — (placeholder) Build do projeto
- `bun run test` — Executa os testes
- `bun run prisma:generate` — Gera os tipos do Prisma

> Também funciona com `npm run ...` se preferir.

## Start

### Desenvolvimento
```bash
bun run dev
```

### Produção
```bash
NODE_ENV=prod bun run dev
```

### Staging
```bash
NODE_ENV=staging bun run dev
```

## Exemplo de Uso

Após iniciar, acesse:
- Documentação Swagger: `http://localhost:9999/docs`
- Healthcheck: `GET /health`

## Estrutura do Projeto

```
src/
  features/
    {feature}/
      domain/
      usecases/
      schemas.ts
      routes.ts
  shared/
  app.ts
  index.ts
```

## Observações
- Use sempre imports absolutos conforme `tsconfig.json`.
- Todas as validações de entrada são feitas via Zod.
- Tipos de domínio são derivados do Prisma.
- Plugins Fastify injetam dependências globais (prisma, logger, etc).
- Veja o CLAUDE.md para padrões de contribuição.

---

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>

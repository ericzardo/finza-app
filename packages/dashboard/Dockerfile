# ── Stage 1: Build ──────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# 1. Instalação de Dependências (Cache eficiente)
COPY package.json bun.lock ./
COPY packages/api/package.json packages/api/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/dashboard/package.json packages/dashboard/package.json

RUN bun install --frozen-lockfile

# 2. Copiar TODO o código fonte de uma vez
#    Copiar após o install preserva o cache de dependências.
#    Agrupar os COPYs evita que workspace links criados pelo bun
#    fiquem inconsistentes entre passos de geração.
COPY packages/api/ packages/api/
COPY packages/api-client/ packages/api-client/
COPY packages/dashboard/ packages/dashboard/

# 3. Pipeline de Geração: Prisma → Swagger → Kubb
ENV DATABASE_URL="postgresql://johndoe:mypassword@localhost:5432/mydb"
ENV DIRECT_URL="postgresql://johndoe:mypassword@localhost:5432/mydb"
ENV JWT_SECRET="uma-string-qualquer-com-mais-de-oito-caracteres"

# 3a. Gerar Prisma Client (necessário para tipos do Swagger)
WORKDIR /app/packages/api
RUN bun run prisma generate

# 3b. Exportar Swagger estático (sem banco de dados)
RUN mkdir -p docs && bun run build:swagger
RUN test -f docs/swagger.json \
    || (echo "❌ Falha: docs/swagger.json não foi gerado!" && exit 1)

# 3c. Gerar API Client via Kubb
#     Usa script programático (generate:docker) para contornar bug no CLI do
#     Kubb que não reconhece o bun em process.argv[0], causando "null byte"
#     ao interpretar o binário do bun como arquivo de input.
WORKDIR /app/packages/api-client
RUN DOCKER_BUILD=true bun run generate:docker
RUN test -d src/generated/types \
    || (echo "❌ Falha: API Client não foi gerado pelo Kubb!" && exit 1)

# 4. Build do Dashboard
WORKDIR /app/packages/dashboard

ARG VITE_API_URL=http://localhost:9999
ARG VITE_APP_URL=http://localhost:5173
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL

RUN bun run build

# ── Stage 2: Serve (Nginx) ──────────────────────────────────────────────
FROM nginx:alpine AS production

COPY packages/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/dashboard/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
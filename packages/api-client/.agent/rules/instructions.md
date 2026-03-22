# Padrões e Regras do pacote api-client (Finza)

## Objetivo
Este pacote utiliza o Kubb como gerador central de código para clientes, hooks, validações e mocks baseados no OpenAPI, integrando TanStack Query, Zod, MSW/Faker e um client Axios customizado.

## Plugins Kubb Utilizados
- @kubb/plugin-oas: Leitura do OpenAPI
- @kubb/plugin-ts: Tipos TypeScript
- @kubb/plugin-client: Client Axios customizável
- @kubb/plugin-react-query: Hooks TanStack Query v5
- @kubb/plugin-zod: Schemas Zod
- @kubb/plugin-msw: Handlers MSW
- @kubb/plugin-faker: Dados fake para mocks

## Padrões de Nomenclatura
- Hooks: `use{Tag}{Operation}{Query|Mutation}` (ex: useUserListQuery)
- Schemas Zod: `{Tag}{Operation}Schema` (ex: UserListSchema)
- Mocks MSW: `{tag}{Operation}Handler` (ex: userListHandler)

## Custom Client (Axios)
- O client customizado deve estar em `src/client.ts` e ser configurado no plugin-client via `client: './src/client.ts'`.
- Deve exportar uma instância Axios com interceptors (ex: JWT).

## Mocks e Playground
- Handlers MSW e dados fake devem ser exportados em `generated/mocks/`.
- Sempre exporte um `index.ts` (barrel file) em `generated/mocks`.

## Fluxo de Atualização
1. Altere a rota no backend (Fastify/Prisma)
2. Atualize o OpenAPI
3. Rode `bunx kubb generate`
4. Ajuste client ou mocks se necessário

## Observações
- Controle o versionamento dos arquivos gerados.
- Documente endpoints customizados no README.


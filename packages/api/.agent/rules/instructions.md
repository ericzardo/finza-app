# Instruções para Geração de Código na API

Estas instruções garantem que todo código gerado para a API siga o padrão de Vertical Slices, Use Cases Funcionais e Plugins Fastify.

## 1. Segurança
A Finza utiliza o HttpOnly Secure Cookies para autenticação
- Rotas protegidas devem usar o hook `auth-guard` que verifica a assinatura do JWT
- Tokens JWT nunca deve ser retornado em payloads de respostas

## 2. Estrutura de Pastas
- Cada nova feature deve ser criada em `src/features/{feature}`.
- Dentro da feature, crie:
  - `domain/` para tipos e contratos
  - `usecases/` para funções de negócio (um arquivo por caso de uso)
  - `controllers/` para gerencia body, params, cookies, invoca o usecases devolver respostas http (um arquivo por caso de uso)
  - `schemas.ts` para schemas Zod (adicione mensagens de validação em PT-BR)
  - `routes.ts` para rotas da feature

## 3. Padrão de Código
- Use sempre funções puras para use cases, sem dependências implícitas (injeção via parâmetros).
- Injeção de Banco: Use cases nunca importam o Prisma. Eles recebem a instância do banco (geralmente chamada de db ou prisma) como o primeiro argumento da função.
- Schemas Zod devem ser a única fonte de validação de entrada.
- Tipos de entidades devem ser derivados do Prisma, nunca duplicados.
- Rotas devem usar o type provider do Zod e delegar a execução para o controller correspondente.
- Plugins Fastify devem ser usados para injeção de Prisma, logger e configs.

### Middlewares e Plugins:
- `src/plugins/`: Apenas para setup global do servidor (swagger, cors, etc).
- `src/hooks/`: Middlewares de rota.

### Tratamento de Erros:
Erros devem ser tratados via error handler global.

- **AppError:** Utilize sempre a classe AppError para erros previstos.
- **ErrorCode:** Nunca invente strings. Use apenas os membros do enum ErrorCode (ex: ErrorCode.CONFLICT, ErrorCode.NOT_FOUND).
- **Mensagens:** Use mensagens específicas para descrever o erro (ex: throw new AppError(ErrorCode.CONFLICT, 409, 'E-mail já cadastrado')).

### Padrão de Imports
Sempre utilize imports absolutos baseados nos aliases definidos no `tsconfig.json` (ex: `@errors/app-error`).

- Nunca utilize extensões `.js` ou `.ts` nos imports.
- Mantenha o `tsconfig.json` atualizado e sincronizado com o ambiente de execução

### Documentação Swagger
Toda rota deve conter os metadados de schema (tags, description, response) para que o @fastify/swagger gere a documentação OpenAPI automaticamente.
  
## 4. Regras de Ouro
- Nunca duplique regras de validação ou tipos.
- Sempre escreva testes de integração e unitários para use cases utilizando o `bun:test`.
- Toda dependência global deve ser injetada via plugin.
- O schema do Prisma é a fonte de verdade para tipos de domínio.
- Sempre utilize imports absolutos via aliases e nunca inclua extensões nos imports.

## 5. Fluxo de Implementação
1. Crie/atualize a pasta da feature.
2. Defina tipos em `domain/` e schemas Zod em `schemas.ts`.
3. Implemente use cases como funções puras em `usecases/`.
4. Implemente controllers em `controllers/` que invocam os usescases.
5. Ao chamar um use case, passe a instância do banco acessível via `fastify.prisma`.
6. Garanta que dependências estejam disponíveis via plugins.
7. Trate erros usando o error handler global.
8. Escreva testes unitários e de integrações para cada use case.

## 6. Exemplo de Estrutura
```
src/features/users/
  domain/user.types.ts
  usecases/create-user.usecase.ts
  usecases/get-user.usecase.ts
  controllers/create-user.controller.ts
  controllers/get-user.controller.ts
  schemas.ts
  routes.ts
```

## 7. Documentação Swagger
- Fonte de Verdade: Os schemas definidos em `schemas.ts` via Zod são a base da documentação.
- Tags: Agrupe rotas por funcionalidade usando `tags` no schema da rota para manter o Swagger organizado.
- Consistência: A documentação precisa ser precisa para permitir a geração de hooks de front-end (padrão Kube/Swagger).

---

Siga sempre estas instruções para garantir coesão, escalabilidade e tipagem rigorosa na API.
---
name: finza-api-docs
description: Gera documentação humana e técnica de features da API da Finza a partir dos arquivos de código fonte (usecases, controllers, routes e schemas). Use esta skill sempre que o usuário pedir para documentar uma feature, rota ou módulo da API da Finza — mesmo que ele use palavras como "explicar como funciona", "escrever o doc de", "documentar o fluxo de", "gerar documentação de" ou "o que essa feature faz". A skill deve ser acionada para qualquer feature: workspaces, buckets, transactions, internal-transfers ou qualquer módulo futuro. Nunca documente o projeto inteiro de uma vez — sempre por feature isolada.
---

# Finza API Docs — Skill de Documentação por Feature

## Contexto do Projeto

A Finza é uma plataforma de gestão financeira pessoal baseada em **Orçamento Base Zero (OBZ)**. Todo centavo deve ter um propósito.
A unidade central é o **Bucket (Caixa de Propósito)**, e a fonte da verdade são as **Transactions (Transações)**.
Saldos nunca são armazenados — são sempre calculados em tempo real (On-Fly) a partir das transações.

**Stack da API:** Fastify + Prisma + TypeScript. Estrutura por feature em `src/features/<nome>/`.

---

## O que esta skill faz

Lê os arquivos de uma feature e produz um documento de documentação com duas camadas:

1. **Camada Humana** — linguagem clara, sem jargão técnico. Qualquer pessoa de suporte ou produto deve entender o que aquela feature faz, quais são as regras, o que pode dar errado e como o sistema se comporta em cada cenário.

2. **Camada Técnica** — detalhes de implementação: entradas, saídas, validações, queries, regras de negócio em código, segurança da rota e casos de teste existentes.

---

## Processo de Execução

### Passo 1 — Localizar os arquivos da feature

A estrutura padrão de uma feature na Finza é:

```
src/features/<feature>/
├── schemas.ts                    ← validações Zod de entrada e saída
├── routes.ts                     ← definição das rotas Fastify
├── routes.integration.spec.ts    ← testes de integração
├── controllers/
│   └── <acao>.controller.ts
└── usecases/
    ├── <acao>.ts                 ← lógica de negócio principal
    └── <acao>.spec.ts            ← testes unitários
```

Use `view` ou `bash` para listar e ler todos esses arquivos antes de escrever qualquer coisa.

### Passo 2 — Extrair as informações de cada rota/usecase

Para cada rota encontrada, coletar:

- **Método HTTP + path** (ex: `POST /transactions`)
- **Autenticação:** a rota exige token? Verifica workspace via header `x-workspace-id`?
- **Entrada:** quais campos são obrigatórios, quais são opcionais, quais têm validação especial (enum, min, max, formato de data)
- **Saída:** o que o endpoint retorna em caso de sucesso (status 200/201) e quais erros são esperados (400, 403, 404)
- **Lógica do usecase:** o que acontece internamente — queries ao banco, cálculos, efeitos colaterais (ex: Cascata, criação de registros vinculados)
- **Regras de negócio:** quais restrições existem (ex: bucket INBOX não pode ser deletado, `is_paid` controla se afeta saldo, `is_internal` oculta do extrato principal)
- **Casos de teste:** o que os specs cobrem — cenários de sucesso, erros esperados, casos limite

### Passo 3 — Escrever o documento

Gere o documento em Markdown com a estrutura abaixo. Salve em `/docs/outputs/<datenow>-<feature>-docs.md`.

---

## Estrutura do Documento Gerado

```markdown
# Documentação: <Nome da Feature>

## O que é essa feature?

[Explicação em linguagem simples, 2-4 linhas. O que ela representa no contexto financeiro do usuário?]

## Regras de Negócio

[Lista das regras que governam essa feature. Escritas como afirmações claras, sem código. Ex: "Uma transação pendente (não paga) não afeta o saldo do caixa."]

---

## Rotas Disponíveis

### [MÉTODO] /caminho

**O que faz:** [1 linha]

**Quem pode usar:** [autenticação necessária, escopo de workspace]

#### Dados de entrada

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| ...   | ...  | ...         | ...       |

#### O que retorna (sucesso)

[Descrição dos campos retornados e o que cada um significa]

#### Erros possíveis

| Código | Quando acontece |
|--------|----------------|
| 400    | ...             |
| 404    | ...             |

#### Como funciona por dentro

[Explicação do usecase em linguagem humana — o que o sistema verifica, calcula e faz, sem copiar o código. Incluir efeitos colaterais relevantes.]

#### O que os testes garantem

[Lista dos cenários cobertos pelos specs — serve como contrato do comportamento esperado]

---

[Repetir para cada rota da feature]

## Glossário da Feature

[Termos técnicos usados nesta feature e seus significados em linguagem simples]
```

---

## Regras de Qualidade do Documento

- **Tom:** direto, encorajador, sem jargão contábil desnecessário. Pense em alguém de suporte lendo isso para entender uma reclamação de usuário.
- **Precisão:** nunca inventar comportamentos. Se não está no código ou nos testes, não documentar.
- **Efeitos colaterais sempre documentados:** se um usecase cria registros extras (ex: par de Cascata, transação interna), isso deve aparecer claramente na seção "Como funciona por dentro".
- **Regras de negócio separadas do código:** a seção de Regras de Negócio deve ser legível sem contexto técnico.
- **Nunca documentar o projeto inteiro:** uma execução = uma feature.

---

## Contexto de Regras Globais da Finza (sempre considerar)

Ao documentar qualquer feature, estas regras globais se aplicam e devem ser referenciadas quando relevantes:

- **On-Fly:** Saldos nunca são colunas no banco. São sempre calculados somando transações reais.
- **is_paid:** Transações não pagas são "fantasmas" — aparecem como pendentes mas não afetam saldos.
- **is_internal:** Transações criadas automaticamente pela Cascata. Não aparecem no extrato normal do usuário.
- **Caixa de Entrada (INBOX):** É o root do dinheiro. Toda receita entra aqui primeiro. Não pode ser deletado nem renomeado.
- **Cascata:** Se uma despesa é registrada em um bucket sem saldo suficiente e `is_paid: true`, o sistema cobre o déficit automaticamente com uma transferência interna saindo do INBOX.
- **Recorte temporal:** Toda a matemática respeita o filtro de `startDate` e `endDate` passado na requisição.

# Finza - Monorepo

A Bun workspaces monorepo for elite financial orchestration.

## Structure

```text
finza/
├── packages/
│   ├── api/            # @finza/api - Core business logic and database
│   ├── api-client/     # @finza/api-client - Generated SDK and hooks (via Kubb)
│   └── dashboard/      # @finza/dashboard - Main financial interface
├── package.json        # Root workspace config
├── biome.json          # Shared linting/formatting
└── bun.lock

```

## Packages

| Package | Description |
| :--- | :--- |
| `@finza/api` | Fastify API with Prisma, PostgreSQL and Zod |
| `@finza/api-client` | Auto-generated SDK via Kubb (OpenAPI → types, hooks, schemas, mocks) |
| `@finza/dashboard` | React 19 dashboard using TanStack Router + Tailwind CSS v4 |

> **Importante:** Não existe `@finza/shared`. O `@finza/api-client` é a fonte compartilhada de tipos e schemas Zod entre a API e o Dashboard.

## Code Patterns (All Packages)

### File Naming
All files must be lowercase with hyphens: create-transaction.ts, use-workspace.tsx.

### Exports
- No default exports - always use named exports.
- Exception: next.config.js, vite.config.ts or similar config files.

Barrel Files (index.ts)
- DO NOT create barrel files for internal folders.
- Only use barrel files for package entry points (src/index.ts).
- Import directly from source files: import { User } from '@models/user'.

## Component Structure
```tsx
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export interface MyComponentProps extends ComponentProps<'div'> {}

export function MyComponent({ className, children, ...props }: MyComponentProps) {
  return (
    <div className={twMerge('base-styles', className)} {...props}>
      {children}
    </div>
  )
}
```

## Tooling
- bun - package manager and workspace management.
- TypeScript - strict mode enabled.

## Workflow and Git (Mandatory)

Finza uses a rigorous approval pipeline. **NEVER** attempt to commit directly to the `main` or `staging` branches.

1. **Development:** All new code must originate in a `feature/feature-name` branch.
2. **Pull Requests:** After completing the task, you should only request the user to push the feature branch and open a PR for `staging`.
3. **Deployment:** Deployment to production is done exclusively via merging `staging` into `main`.
4. **Respect for Contracts:** Before any push, ensure that `bun run build` in the monorepo root passes without errors, guaranteeing integrity between the API and the Dashboard.

Contract Enforcement: Any change in @finza/api that affects the OpenAPI spec MUST be followed by regenerating @finza/api-client. The Dashboard MUST ONLY consume the API through the generated client.

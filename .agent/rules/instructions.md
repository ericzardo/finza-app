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

## Commands

```bash
bun install                 # Install all dependencies
bun run dev:api             # Start API server (port 9999, hot reload)
bun run generate:client     # Regenerate SDK from OpenAPI (API must be running)
bun run test:api            # Run API tests
bun run lint                # Check for linting errors (Biome)
bun run lint:fix            # Auto-fix linting issues (Biome)
```
## Testing Changes

- Do NOT run `build` to test AI results - only run `lint` to verify code quality.
- Run `bun run lint` to check for errors.
- Run `bunx tsc --noEmit` inside the package folder to verify TypeScript errors

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
- Biome - linting and formatting.
- TypeScript - strict mode enabled.

## Git Commits
- Do NOT commit automatically - only commit when explicitly asked by the user.
- Wait for user approval before running git commit.

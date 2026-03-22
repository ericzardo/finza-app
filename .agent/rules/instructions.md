# Finza - Monorepo

A Bun workspaces monorepo for elite financial orchestration.

## Structure

```text
finza/
├── packages/
│   ├── api/            # @finza/api - Core business logic and database
│   ├── dashboard/      # @finza/dashboard - Main financial interface
│   ├── shared/         # @finza/shared - Zod schemas and universal types
│   ├── api-client/     # @finza/api-client - Generated SDK and hooks
│   └── playground/     # @finza/playground - Component testing environment
├── package.json        # Root workspace config
├── biome.json          # Shared linting/formatting
└── ...

Packages
| Package | Description |
| :--- | :--- |
| `@finza/api` | Fastify/Node.js API with Prisma and PostgreSQL |
| `@finza/dashboard` | React dashboard using Tailwind CSS v4 |
| `@finza/shared` | Single source of truth for validation and types |
| `@finza/api-client` | Auto-generated SDK via OpenAPI/Kube |

Commands
```bash

bun install             # Install all dependencies
bun run dev             # Start all packages in dev mode
bun run build           # Build all packages
bun run lint            # Check for linting errors
bun run lint:fix        # Auto-fix linting issues
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

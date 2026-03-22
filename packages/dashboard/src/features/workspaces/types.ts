import type { PostWorkspaces201 } from '@finza/api-client'

/**
 * O tipo `GetWorkspacesQueryResponse` gerado pelo Kubb retorna apenas roles.
 * Até a correção no backend, usamos o shape de `PostWorkspaces201`
 * como referência para o objeto de workspace na listagem.
 */
export type Workspace = PostWorkspaces201

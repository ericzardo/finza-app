import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useGetWorkspaces, getWorkspacesQueryOptions } from '@finza/api-client/hooks'
import { useAuth } from '@features/auth/context/auth-context'
import { WorkspaceList } from '@features/workspaces/components/workspace-list'
import { CreateWorkspaceDialog } from '@features/workspaces/components/create-workspace-dialog'
import { LobbyHeader } from '@components/layout/lobby-header'
import { setPageMeta } from '@lib/seo'
import type { Workspace } from '@features/workspaces/types'
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Dashboard',
      description: 'Gerencie seus workspaces e tenha controle total do seu patrimônio.',
    })
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(getWorkspacesQueryOptions())
  },
})

function DashboardPage() {
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: workspaces, isLoading } = useGetWorkspaces<Workspace[]>()

  return (
    <div className="min-h-screen bg-background">
      <LobbyHeader />

      <main className="shell-container py-10">
        {/* Boas-vindas */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Olá, {user?.name} 👋
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Escolha um workspace para começar ou crie um novo.
          </p>
        </div>

        {/* Listagem de workspaces */}
        <section className="mt-10">
          <WorkspaceList
            workspaces={workspaces ?? []}
            isLoading={isLoading}
            onCreateClick={() => setDialogOpen(true)}
          />
        </section>
      </main>

      <CreateWorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

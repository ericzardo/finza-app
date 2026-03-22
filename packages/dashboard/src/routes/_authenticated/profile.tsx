import { ArrowLeft } from 'lucide-react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getProfileQueryOptions, getWorkspacesQueryOptions } from '@finza/api-client/hooks'
import { setPageMeta } from '@lib/seo'
import { LobbyHeader } from '@components/layout/lobby-header'
import { Button } from '@ui/button'
import { PatrimonyCard } from '@features/profile/components/patrimony-card'
import { ProfileInfoCard } from '@features/profile/components/profile-info-card'
import { SecurityCard } from '@features/profile/components/security-card'

export const Route = createFileRoute('/_authenticated/profile')({
  beforeLoad: () => {
    setPageMeta({
      title: 'Finza | Perfil',
      description: 'Gerencie seu perfil, segurança e visualize seu patrimônio consolidado.',
    })
  },
  loader: ({ context }) => {
    return Promise.all([
      context.queryClient.ensureQueryData(getProfileQueryOptions()),
      context.queryClient.ensureQueryData(getWorkspacesQueryOptions()),
    ])
  },
  component: ProfilePage,
})

function ProfilePage() {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back()
    } else {
      void router.navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <LobbyHeader />

      <main className="shell-container py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>

        <div className="space-y-6">
          <ProfileInfoCard />
          <PatrimonyCard />
          <SecurityCard />
        </div>
      </main>
    </div>
  )
}

import { PrivacyToggle } from '@features/user/components/privacy-toggle'
import { UserAvatarMenu } from '@features/user/components/user-avatar-menu'
import { useGetProfile } from '@finza/api-client/hooks'
import { Link } from '@tanstack/react-router'

export function LobbyHeader() {
  const { data: user } = useGetProfile()

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="shell-container flex h-14 items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <img src="/logo.svg" alt="Finza Logo" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <PrivacyToggle />
          {user && <UserAvatarMenu user={user} />}
        </div>
      </div>
    </header>
  )
}

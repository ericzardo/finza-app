import { LogOut, Moon, Sun, User, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu'
import { useTheme } from '@features/settings/context/theme-context'
import type { GetProfileQueryResponse } from '@finza/api-client'
import { usePostAuthLogout } from '@finza/api-client/hooks'
import { Link } from '@tanstack/react-router'

interface UserAvatarMenuProps {
  user: GetProfileQueryResponse
}

export function UserAvatarMenu({ user }: UserAvatarMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const { mutate: logout, isPending } = usePostAuthLogout()

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar className="size-8 cursor-pointer border border-border transition-colors hover:border-muted-foreground">
            <AvatarImage
              src={(user as Record<string, unknown>).avatar_url as string | undefined}
              alt={user.name}
            />
            <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground" />
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="default" asChild>
          <Link to="/profile">
            <User className="size-4" />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="default" onClick={toggleTheme}>
          <div className="relative size-4">
            <Sun
              className={`absolute inset-0 size-4 transition-all duration-300 ${
                isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />
            <Moon
              className={`absolute inset-0 size-4 transition-all duration-300 ${
                isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
          </div>
          {isDark ? 'Tema claro' : 'Tema escuro'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="text-destructive focus:bg-destructive/50 focus:text-destructive cursor-pointer"
          onClick={handleLogout}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          {isPending ? 'Saindo...' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

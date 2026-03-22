import { useGetProfile } from '@finza/api-client/hooks'
import { cn } from '@lib/utils'

interface SensitiveProps {
  children: React.ReactNode
  className?: string
}

export function Sensitive({ children, className }: SensitiveProps) {
  const { data: profile } = useGetProfile()
  const isPrivate = profile?.is_privacy_enabled ?? false

  return (
    <span
      className={cn(
        'inline-block transition-all duration-300',
        isPrivate && 'blur-sm select-none',
        className,
      )}
      aria-hidden={isPrivate}
    >
      {children}
    </span>
  )
}

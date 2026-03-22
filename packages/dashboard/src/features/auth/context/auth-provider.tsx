import { useGetProfile } from '@finza/api-client/hooks'
import { AuthContext } from './auth-context'
import type { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetProfile({
    query: { retry: false },
  })

  return (
    <AuthContext value={{ user, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext>
  )
}

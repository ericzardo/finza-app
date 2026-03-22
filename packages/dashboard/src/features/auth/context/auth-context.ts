import { createContext, use } from 'react'
import type { GetProfileQueryResponse } from '@finza/api-client'

export interface AuthContextType {
  user: GetProfileQueryResponse | undefined
  isLoading: boolean
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

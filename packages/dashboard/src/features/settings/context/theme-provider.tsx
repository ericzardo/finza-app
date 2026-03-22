import { useCallback, useMemo, useState } from 'react'
import { getTheme, setTheme, type Theme } from '@lib/theme'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setThemeState(next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

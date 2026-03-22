const STORAGE_KEY = 'finza-theme'
const THEME_COLOR_LIGHT = '#FBFBFA'
const THEME_COLOR_DARK = '#09090B'
const TRANSITION_DURATION = 300

export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement

  // Enable smooth transition
  root.classList.add('theme-transitioning')

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Persist
  localStorage.setItem(STORAGE_KEY, theme)

  // Update meta theme-color
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
  }

  // Remove transition class after animation completes
  setTimeout(() => {
    root.classList.remove('theme-transitioning')
  }, TRANSITION_DURATION)
}

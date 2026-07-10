export type AppTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'nyumbatrack_theme'

export const getStoredTheme = (): AppTheme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* ignore */
  }
  return 'light'
}

export const applyTheme = (theme: AppTheme): void => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.body.classList.toggle('dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
}

export const persistTheme = (theme: AppTheme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
  applyTheme(theme)
}

export const toggleTheme = (current: AppTheme): AppTheme => {
  const next: AppTheme = current === 'light' ? 'dark' : 'light'
  persistTheme(next)
  return next
}

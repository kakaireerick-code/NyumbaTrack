import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, getStoredTheme, persistTheme, THEME_STORAGE_KEY, toggleTheme } from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('dark')
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    localStorage.clear()
    applyTheme('light')
  })

  it('defaults to light when nothing stored', () => {
    expect(getStoredTheme()).toBe('light')
  })

  it('persists and applies dark theme', () => {
    persistTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('toggles between light and dark', () => {
    expect(toggleTheme('light')).toBe('dark')
    expect(toggleTheme('dark')).toBe('light')
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('login dark mode contrast', () => {
  it('passes stored theme into Google sign-in button', () => {
    const login = read('src/pages/LoginPage.jsx')
    expect(login).toContain('getStoredTheme')
    expect(login).toContain('theme={loginTheme}')
  })

  it('uses filled_black Google theme on dark backgrounds', () => {
    const button = read('src/components/GoogleSignInButton.jsx')
    expect(button).toContain("theme={dark ? 'filled_black' : 'outline'}")
    expect(button).toContain('bg-gray-800')
  })
})

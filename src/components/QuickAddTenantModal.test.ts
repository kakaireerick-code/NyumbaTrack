import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('quick add tenant modal', () => {
  it('uses submit button and stable invite helpers', () => {
    const src = read('src/components/QuickAddTenantModal.jsx')
    expect(src).toContain('Save and copy')
    expect(src).toContain('type="submit"')
    expect(src).toContain('getOrCreateTenantInvite')
    expect(src).toContain('pushInviteToCloud')
    expect(src).toContain('Copy link')
  })

  it('LoadingButton allows type submit', () => {
    const ui = read('src/components/UI.jsx')
    expect(ui).toMatch(/type = 'button'/)
    expect(ui).toContain('type={type}')
  })
})

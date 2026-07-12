import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('DiscoverStrip role alignment', () => {
  it('normalizes role before filtering discover links', () => {
    const src = read('src/components/DiscoverStrip.jsx')
    expect(src).toContain('normalizeRole(currentRole)')
    expect(src).toContain('l.roles.includes(role)')
    expect(src).toContain('currentRole={role}')
  })
})

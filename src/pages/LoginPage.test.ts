import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('LoginPage imports', () => {
  it('imports ProductHighlights before rendering login highlights', () => {
    const src = read('src/pages/LoginPage.jsx')
    expect(src).toContain("import ProductHighlights from '../components/ProductHighlights'")
    expect(src).toContain('<ProductHighlights')
  })
})

import { describe, it, expect } from 'vitest'
import { verifyMomoReference, normalizeMomoReference } from './momoVerification'

describe('momoVerification', () => {
  it('accepts valid references', () => {
    expect(verifyMomoReference('ABC123456', []).ok).toBe(true)
  })

  it('rejects short references', () => {
    const r = verifyMomoReference('123', [])
    expect(r.ok).toBe(false)
  })

  it('rejects duplicate references', () => {
    const r = verifyMomoReference('TXN-998877', ['TXN-998877'])
    expect(r.ok).toBe(false)
  })

  it('normalizes whitespace', () => {
    expect(normalizeMomoReference('  ABC 123  ')).toBe('ABC123')
  })
})

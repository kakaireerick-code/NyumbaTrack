import { describe, expect, it } from 'vitest'
import { getBuildInfo } from './buildInfo'

describe('buildInfo', () => {
  it('exposes sha and builtAt', () => {
    const info = getBuildInfo()
    expect(info.sha).toBeTruthy()
    expect(typeof info.builtAt).toBe('string')
  })
})

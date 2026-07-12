import { describe, it, expect } from 'vitest'
import { APP_NAME, APP_FULL_TITLE, APP_TAGLINE } from './brand'

describe('brand', () => {
  it('uses Nyumba-track as display name', () => {
    expect(APP_NAME).toBe('Nyumba-track')
    expect(APP_FULL_TITLE).toContain('Nyumba-track')
    expect(APP_TAGLINE).toContain('Ugandan')
  })
})

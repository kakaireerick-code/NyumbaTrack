import { describe, it, expect } from 'vitest'
import { validatePortalSignIn, GENERIC_AUTH_ERROR } from './portalAuth'

describe('portalAuth', () => {
  it('rejects owner credentials on tenant portal with generic error', () => {
    const result = validatePortalSignIn('tenant', 'property_owner')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe(GENERIC_AUTH_ERROR)
  })

  it('rejects tenant credentials on owner portal with generic error', () => {
    const result = validatePortalSignIn('owner', 'tenant')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe(GENERIC_AUTH_ERROR)
  })

  it('rejects caretaker on tenant portal with generic error', () => {
    const result = validatePortalSignIn('tenant', 'caretaker')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe(GENERIC_AUTH_ERROR)
  })

  it('accepts matching role on each portal', () => {
    expect(validatePortalSignIn('owner', 'property_owner').ok).toBe(true)
    expect(validatePortalSignIn('tenant', 'tenant').ok).toBe(true)
    expect(validatePortalSignIn('caretaker', 'caretaker').ok).toBe(true)
  })
})

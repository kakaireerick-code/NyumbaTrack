import { describe, it, expect } from 'vitest'
import { canAccessPage } from './permissions'

describe('about and referrals access', () => {
  it('all roles can open about', () => {
    expect(canAccessPage('property_owner', 'about')).toBe(true)
    expect(canAccessPage('caretaker', 'about')).toBe(true)
    expect(canAccessPage('tenant', 'about')).toBe(true)
  })

  it('only owners can open referrals', () => {
    expect(canAccessPage('property_owner', 'referrals')).toBe(true)
    expect(canAccessPage('caretaker', 'referrals')).toBe(false)
    expect(canAccessPage('tenant', 'referrals')).toBe(false)
  })
})

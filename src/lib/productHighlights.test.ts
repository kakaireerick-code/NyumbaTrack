import { describe, expect, it } from 'vitest'
import { PRODUCT_HIGHLIGHTS, highlightsFor } from './productHighlights'

describe('productHighlights', () => {
  it('surfaces owner trial and tenant-free on dashboard', () => {
    const items = highlightsFor('property_owner', 'dashboard')
    const ids = items.map((h) => h.id)
    expect(ids).toContain('free-trial')
    expect(ids).toContain('tenant-free')
    expect(ids).toContain('partner-rewards')
  })

  it('surfaces login highlights for owners only', () => {
    const owner = highlightsFor('property_owner', 'login')
    expect(owner.length).toBeGreaterThanOrEqual(3)
    expect(owner.some((h) => h.title.includes('trial'))).toBe(true)
    expect(highlightsFor('tenant', 'login')).toHaveLength(0)
  })

  it('includes tenant portal free messaging', () => {
    const tenant = highlightsFor('tenant', 'tenant-home')
    expect(tenant.some((h) => h.id === 'tenant-portal-free')).toBe(true)
  })

  it('every highlight has title and detail', () => {
    for (const h of PRODUCT_HIGHLIGHTS) {
      expect(h.title.length).toBeGreaterThan(2)
      expect(h.detail.length).toBeGreaterThan(10)
      expect(h.roles.length).toBeGreaterThan(0)
      expect(h.surfaces.length).toBeGreaterThan(0)
    }
  })
})

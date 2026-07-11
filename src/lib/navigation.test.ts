import { describe, expect, it } from 'vitest'
import { PRIMARY_SIDEBAR_PAGES, PRIMARY_CARETAKER_PAGES, MORE_TOOLS_LINKS, sidebarPagesForRole } from './navigation'

describe('navigation', () => {
  it('primary sidebar has exactly 8 owner items', () => {
    expect(PRIMARY_SIDEBAR_PAGES).toHaveLength(8)
    expect(PRIMARY_SIDEBAR_PAGES).toContain('dashboard')
    expect(PRIMARY_SIDEBAR_PAGES).toContain('settings')
    expect(PRIMARY_SIDEBAR_PAGES).not.toContain('subscription')
  })

  it('more tools includes billing and import', () => {
    const ids = MORE_TOOLS_LINKS.map((t) => t.id)
    expect(ids).toContain('subscription')
    expect(ids).toContain('billing-admin')
    expect(ids).toContain('data-import')
    expect(ids).toContain('guided')
  })

  it('caretaker sidebar shows 5 essentials only', () => {
    expect(PRIMARY_CARETAKER_PAGES).toHaveLength(5)
    const allCaretakerPages = [
      'units', 'vacancy', 'maintenance', 'tenants', 'help',
      'payments', 'reports', 'settings',
    ]
    expect(sidebarPagesForRole('caretaker', allCaretakerPages)).toEqual(PRIMARY_CARETAKER_PAGES)
  })

  it('more tools includes about and partner rewards', () => {
    const ids = MORE_TOOLS_LINKS.map((t) => t.id)
    expect(ids).toContain('about')
    expect(ids).toContain('referrals')
  })
})

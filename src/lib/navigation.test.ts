import { describe, expect, it } from 'vitest'
import { PRIMARY_SIDEBAR_PAGES, MORE_TOOLS_LINKS, sidebarPagesForRole } from './navigation'

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
    expect(ids).toContain('data-import')
    expect(ids).toContain('guided')
  })

  it('caretaker keeps full caretaker page list', () => {
    const caretakerPages = ['units', 'vacancy', 'maintenance', 'tenants', 'help']
    expect(sidebarPagesForRole('caretaker', caretakerPages)).toEqual(caretakerPages)
  })
})

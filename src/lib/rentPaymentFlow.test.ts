import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

describe('unified rent payment flow', () => {
  it('tenant portal combines MoMo pay + I paid notify on my-payments', () => {
    const portal = read('src/pages/TenantPortalPage.jsx')
    expect(portal).toContain("currentPage === 'my-payments'")
    expect(portal).toContain('openMoMo')
    expect(portal).toContain('handleIPaid')
    expect(portal).toContain('onSubmitPayment')
  })

  it('bottom nav routes Pay tab to my-payments', () => {
    const nav = read('src/components/TenantBottomNav.jsx')
    expect(nav).toContain('my-payments')
    expect(nav).toContain('Pay')
  })

  it('owner receives pending payment with ownerId from tenant submit', () => {
    const app = read('src/App.jsx')
    expect(app).toContain('onSubmitPayment')
    expect(app).toContain("status: 'pending'")
    expect(app).toContain('ownerId: t.ownerId')
  })
})

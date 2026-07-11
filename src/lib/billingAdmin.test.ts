import { describe, expect, it } from 'vitest'
import { isBillingAdminEmail } from './billingAdmin'

describe('isBillingAdminEmail', () => {
  it('matches configured admin email case-insensitively', () => {
    const prev = import.meta.env.VITE_BILLING_ADMIN_EMAIL
    import.meta.env.VITE_BILLING_ADMIN_EMAIL = 'Admin@Example.com'
    expect(isBillingAdminEmail('admin@example.com')).toBe(true)
    expect(isBillingAdminEmail('other@example.com')).toBe(false)
    import.meta.env.VITE_BILLING_ADMIN_EMAIL = prev
  })
})

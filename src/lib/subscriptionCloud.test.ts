import { describe, expect, it, vi, afterEach } from 'vitest'
import { submitCloudSubscriptionClaim } from './subscriptionCloud'

describe('subscriptionCloud', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns pending_verification on successful API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          status: 'pending_verification',
          claim: { id: 'claim-1' },
          message: 'Submitted',
        }),
      }),
    )

    const result = await submitCloudSubscriptionClaim({
      customerEmail: 'owner@test.com',
      customerName: 'Owner',
      planId: 'growth',
      billingCycle: 'yearly',
      amount: 500000,
      momoReference: 'ABC123456',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.status).toBe('pending_verification')
      expect(result.claimId).toBe('claim-1')
    }
  })

  it('falls back to local pending when API unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    const result = await submitCloudSubscriptionClaim({
      customerEmail: 'owner@test.com',
      customerName: 'Owner',
      planId: 'starter',
      billingCycle: 'monthly',
      amount: 20000,
      momoReference: 'XYZ987654',
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.status).toBe('pending_verification')
  })
})

import { describe, expect, it } from 'vitest'
import {
  claimSummaryLine,
  countPendingClaims,
  filterClaimsByStatus,
  subscriptionFromApprovedClaim,
} from './subscriptionAdminSync'
import type { BillingClaim } from './billingAdmin'

const sample: BillingClaim = {
  id: 'claim-1',
  customerEmail: 'owner@example.com',
  customerName: 'Owner',
  planId: 'growth',
  billingCycle: 'monthly',
  amount: 49000,
  momoReference: 'NYUMBA-GROWTH-ABC',
  status: 'pending_verification',
  submittedAt: '2026-07-11T10:00:00.000Z',
}

describe('subscriptionAdminSync', () => {
  it('builds active subscription from approved claim', () => {
    const approved = { ...sample, status: 'approved' }
    const sub = subscriptionFromApprovedClaim(approved)
    expect(sub.status).toBe('active')
    expect(sub.planId).toBe('growth')
    expect(sub.momoReference).toBe('NYUMBA-GROWTH-ABC')
    expect(sub.endDate).toBeTruthy()
  })

  it('filters and counts pending claims', () => {
    const rows = [
      sample,
      { ...sample, momoReference: 'REF2', status: 'approved' },
      { ...sample, momoReference: 'REF3', status: 'rejected' },
    ]
    expect(countPendingClaims(rows)).toBe(1)
    expect(filterClaimsByStatus(rows, 'approved')).toHaveLength(1)
    expect(filterClaimsByStatus(rows, 'all')).toHaveLength(3)
  })

  it('formats claim summary', () => {
    expect(claimSummaryLine(sample)).toContain('owner@example.com')
    expect(claimSummaryLine(sample)).toContain('growth')
  })
})
